import os
import boto3
import botocore
import uuid
from aws_lambda_powertools import Logger, Tracer
import genai_core.documents
import feedparser

logger = Logger()
tracer = Tracer()

scheduler = boto3.client('scheduler')
dynamodb = boto3.client('dynamodb')

RSS_SCHEDULE_GROUP_NAME = os.environ['RSS_SCHEDULE_GROUP_NAME']
RSS_FEED_TABLE = os.environ['RSS_FEED_TABLE']
RSS_FEED_INGESTOR_FUNCTION = os.environ['RSS_FEED_INGESTOR_FUNCTION']
RSS_FEED_SCHEDULE_ROLE_ARN = os.environ['RSS_FEED_SCHEDULE_ROLE_ARN']
RSS_FEED_DOCUMENT_TYPE_STATUS_INDEX = os.environ['RSS_FEED_DOCUMENT_TYPE_STATUS_INDEX']
RSS_FEED_WORKSPACE_DOCUMENT_TYPE_INDEX = os.environ['RSS_FEED_WORKSPACE_DOCUMENT_TYPE_INDEX']

def create_rss_subscription(workspace_id, rss_feed_url, rss_feed_title):
    logger.debug(f'Creating RSS Subscription for workspace_id {workspace_id} and rss_feed_url {rss_feed_url}')
    rss_feed_id = str(uuid.uuid4())
    dynamodb_response = dynamodb.put_item(
        TableName=RSS_FEED_TABLE,
        Item={
            '#workspace_id' : {
                'S': ':workspace_id'
            },
            '#compound_sort_key' : {
                'S': '#feed_id::feed_id'
            },
            '#feed_url': {
                'S': ':feed_url'
            },
            '#feed_title': {
                'S': ':feed_title'
            },
            '#document_type': {
                'S': ':document_type'
            },
            '#status': {
                'S': ':status'
            }
        },
        ExpressionAttributeNames={
            '#workspace_id': 'workspace_id',
            '#compound_sort_key': 'compound_sort_key',
            '#feed_url': 'feed_url',
            '#feed_title': 'feed_title',
            '#document_type': 'document_type',
            '#status': 'status'
        },
        ExpressionAttributeValues={
            ':workspace_id': {
                'S': workspace_id
            },
            ':feed_id': {
                'S': rss_feed_id
            },
            ':feed_url': {
                'S': rss_feed_url
            },
            ':feed_title': {
                'S': rss_feed_title
            },
            ':document_type': {
                'S': 'feed'
            },
            ':status' : {
                'S': 'ENABLED'
            }
        }
    )
    logger.debug(f'Created RSS Subscription for workspace_id {workspace_id} and rss_feed_url {rss_feed_url}')
    if dynamodb_response['Attributes']:
        logger.debug('Creating schedule for feed polling')
        scheduler_response = scheduler.create_schedule(
            ActionAfterCompletion= 'NONE',
            Name=rss_feed_id,
            Description=f'RSS Feed Subscription for GenAI Website Crawling',
            GroupName=RSS_SCHEDULE_GROUP_NAME,
            ScheduleExpression='rate(1 day)',
            Target={
                'Arn': RSS_FEED_INGESTOR_FUNCTION,
                'Input': {'workspace_id': workspace_id, 'feed_id': rss_feed_id},
                'RoleArn': RSS_FEED_SCHEDULE_ROLE_ARN
            },
            FlexibleTimeWindow={
                'MaximumWindowInMinutes': 120,
                'Mode':'FLEXIBLE'
            }
        )
        logger.debug(scheduler_response)

def disable_rss_feed_subscription(workspace_id, feed_id):
    '''Disables scheduled subscription to RSS Feed'''
    logger.debug(f'Disabling RSS Subscription for workspace_id {workspace_id} and feed_id {feed_id}')
    _toggle_rss_feed_subscription(workspace_id, feed_id, 'DISABLED')
    logger.debug(f'Successfully disabled RSS Subscription for workspace_id {workspace_id} and feed_id {feed_id}')
    return {
        'status': 'success'
    }

def enable_rss_feed_subscription(workspace_id, feed_id):
    '''Enables scheduled subscription to RSS Feed'''
    logger.debug(f'Enabling RSS Subscription for workspace_id {workspace_id} and feed_id {feed_id}')
    _toggle_rss_feed_subscription(workspace_id, feed_id, 'ENABLED')
    logger.debug(f'Successfully enabled RSS Subscription for workspace_id {workspace_id} and feed_id {feed_id}')
    return {
        'status': 'success'
    }

def _toggle_rss_feed_subscription(workspace_id, feed_id, status):
    logger.debug(f'Toggling RSS Subscription for workspace_id {workspace_id} and feed_id {feed_id} to {status}')
    if status.upper() == 'ENABLED' or status.upper() == 'DISABLED':
        update_item_response = dynamodb.update_item(
            TableName=RSS_FEED_TABLE,
            Key={
                '#workdspace_id': {
                    'S': ':workspace_id'
                },
                '#compound_sort_key': {
                    'S': '#feed_id::feed_id'
                }
            },
            AttibuteUpdates={
                '#status': {
                    'S': ':status'
                }
            },
            ExpressionAttributeNames={
                '#workspace_id': 'workspace_id',
                '#compound_sort_key': 'compound_sort_key',
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':workspace_id': {
                    'S': workspace_id
                },
                ':feed_id': {
                    'S': feed_id
                },
                ':status': {
                    'S': status
                }
            }
        )
        if update_item_response['Attributes']:
            logger.debug(f'Updated status for {feed_id} to {status} in DynamoDB')
            logger.debug(f'Updating scheduler status for {feed_id} to {status}')
            scheduler_response = scheduler.update_schedule(
                Name=feed_id,
                GroupName=RSS_SCHEDULE_GROUP_NAME,
                State=status.upper()
            )
            if scheduler_response['ScheduleArn']:
                logger.debug(f'Successfully set schedule to {status} for {feed_id}')
    else:
        logger.error(f'Invalid status update for RSS Subscription')



def list_rss_subscriptions(workspace_id):
    '''Provides list of RSS Feed subscriptions for a given workspace'''
    logger.debug(f'Getting RSS Subscriptions for workspace_id {workspace_id}')
    subscriptions = dynamodb.query(
            TableName=RSS_FEED_TABLE,
            IndexName=RSS_FEED_WORKSPACE_DOCUMENT_TYPE_INDEX,
            KeyConditionExpression="#workspace_id = :workspace_id and #document_type = :document_type",
            ExpressionAttributeValues={ ":workspace_id": { "S": workspace_id }, ":document_type": { "S": "feed" } }, 
            ExpressionAttributeNames={ "#workspace_id": "workspace_id", "#document_type": "document_type" }
      )
    logger.debug(f'Found {subscriptions["Count"]} RSS Subscriptions')
    if subscriptions['Count'] > 0:
        return [{
            'workspace_id': subscription['workspace_id'],
            'feed_url': subscription['feed_url'],
            'title': subscription['title'],
            'status': subscription['status']
        } for subscription in subscriptions['Items']]
    else:
        logger.debug('No RSS Subscriptions found')
        return []
    
def list_posts_for_rss_feed(workspace_id, feed_id):
    '''Gets a list of posts that the RSS feed subscriber 
        has consumed or will consume
    '''
    logger.debug(f'Getting posts for RSS Feed {feed_id} in workspace {workspace_id}')
    dynamodb_results = dynamodb.query(
        TableName=RSS_FEED_TABLE,
        KeyConditionExpression="#workspace_id = :workspace_id and begins_with(#compound_sort_key, :feed_id)",
        ExpressionAttributeValues={ ":workspace_id": { "S": workspace_id }, ":feed_id": { "S": feed_id } }, 
        ExpressionAttributeNames={ "#workspace_id": "workspace_id", "#compound_sort_key": "compound_sort_key" }
    )
    return [{
        "workspace_id": workspace_id,
        "feed_id": feed_id,
        "post_id": item['post_id'],
        "post_url": item['post_url'],
        "post_title": item['post_title'],
        "post_status": item['status']
    } for item in dynamodb_results['Items']]
    
def set_rss_post_ingested(workspace_id, feed_id, post_id):
     '''Sets an RSS Feed Post as Ingested'''
     logger.info(f'Setting {post_id} as Ingested')
     return dynamodb.update_item(
          TableName=RSS_FEED_TABLE,
          Key={
               '#workspace_id': {
                    'S': ':workspace_id'
               },
               '#compound_sort_key': {
                    'S': '#feed_id::feed_id#post_id::post_id'
               }
          },
          UpdateExpression='SET #Status = :status',
          ExpressionAttributeNames={
               '#workspace_id': 'workspace_id',
               '#compound_sort_key': 'compound_sort_key'
          },
          ExpressionAttributeValues={
               ':status': {
                    'S': 'INGESTED'
               },
               ':feed_id': {
                    'S': feed_id
               },
               ':post_id': {
                    'S': post_id
               },
               ':workspace_id': {
                    'S': workspace_id
               }
          }
     )

def batch_crawl_websites():
    '''Gets next 10 pending posts and sends them to be website crawled
    '''
    posts = _get_batch_pending_posts()
    if posts['Count'] > 0:
        logger.debug(f'Found {posts["Count"]} pending posts')
        for post in posts['Items']:
            workspace_id = post['workspace_id']['S']
            feed_id = post['feed_id']['S']
            post_id = post['post_id']['S']
            rss_item_address = post['post_url']['S']
            crawl_rss_feed_post(workspace_id, feed_id, post_id)
            set_rss_post_ingested(workspace_id, feed_id, post_id)
            logger.info(f'Finished sending {post_id} ({rss_item_address}) to website crawler')

def _get_batch_pending_posts():
      '''Gets the first 10 Pending Posts from the RSS Feed to Crawl
      '''
      logger.info("Getting Pending RSS Items from dynamoDB table")
      return dynamodb.query(
            TableName=RSS_FEED_TABLE,
            IndexName=RSS_FEED_DOCUMENT_TYPE_STATUS_INDEX,
            Limit=10,
            KeyConditionExpression="#status = :status and #document_type = :document_type",
            ExpressionAttributeValues={ ":status": { "S": "PENDING" }, ":document_type": { "S": "post" } }, 
            ExpressionAttributeNames={ "#status": "status", "#document_type": "document_type" }
      )

def get_rss_feed_details(workspace_id,feed_id):
    '''Gets details about a specified RSS Feed Subscripton'''
    logger.debug(f'Getting RSS Feed Details for workspace_id {workspace_id} and feed_id {feed_id}')
    dynamodb_response = dynamodb.query(
        TableName=RSS_FEED_TABLE,
        KeyConditionExpression="#workspace_id = :workspace_id and #compound_sort_key = #feed_id::feed_id",
        ExpressionAttributeValues={ ":workspace_id": { "S": workspace_id }, ":feed_id": { "S": feed_id } },
    )
    if dynamodb_response['Count'] == 1:
        return {
            'workspace_id': dynamodb_response['Items'][0]['workspace_id']['S'],
            'feed_id': dynamodb_response['Items'][0]['feed_id']['S'],
            'feed_url': dynamodb_response['Items'][0]['url']['S'],
            'title': dynamodb_response['Items'][0]['title']['S'],
            'status': dynamodb_response['Items'][0]['status']['S']
        }

def check_rss_feed_for_posts(workspace_id, feed_id):
    '''Checks if there are any new RSS Feed Posts'''
    logger.info(f'Checking RSS Feed for new posts for workspace_id {workspace_id} and feed_id {feed_id}')
    feed_contents = _get_rss_feed_posts(workspace_id, feed_id)
    if feed_contents:
        for feed_entry in feed_contents:
            _queue_rss_feed_post_for_ingestion(workspace_id, feed_id, feed_entry)
            logger.info(f'Queued RSS Feed Post for ingestion: {feed_entry["link"]}')
    else:
        logger.info(f'No RSS Feed Posts found for workspace_id {workspace_id} and feed_id {feed_id}')

def _get_rss_feed_posts(workspace_id, feed_id):
    '''Gets RSS Feed Details & Parses the RSS Feed'''
    logger.info(f'Getting RSS Feed Posts for workspace_id {workspace_id} and feed_id {feed_id}')
    rss_feed_url = get_rss_feed_details(workspace_id, feed_id)
    feed_contents = feedparser.parse(rss_feed_url)
    return feed_contents['entries']

def _queue_rss_feed_post_for_ingestion(workspace_id, feed_id,feed_entry):
    '''Adds RSS Feed Post to RSS Table to be picked up by scheduled crawling'''
    logger.info(f'Queueing RSS Feed Post for ingestion: {feed_entry["link"]}')
    try:
        dynamodb_response = dynamodb.put_item(
            TableName=RSS_FEED_TABLE,
            Item={
                '#workspace_id': {
                    'S': ':workspace_id'
                },
                '#compound_sort_key': {
                    'S': '#feed_id::feed_id#post_id::post_id'
                },
                '#document_type': {
                    'S': ':document_type'
                },
                '#feed_id': {
                    'S': ':feed_id'
                },
                '#post_id': {
                    'S': ':post_id'
                },
                '#title': {
                    'S': 'title'
                },
                '#url': {
                    'S': ':url'
                }
            },
            ConditionExpression='attribute_not_exists(#compound_sort_key)',
            ExpressionAttributeNames={
                '#workspace_id':'workspace_id',
                '#compound_sort_key': 'compound_sort_key',
                '#document_type': 'document_type',
                '#feed_id': 'feed_id',
                '#post_id': 'post_id',
                '#title': 'title',
                '#url': 'url'
            },
            ExpressionAttributeValues={
                ':workspace_id': {
                    'S': workspace_id
                },
                ':feed_id': {
                    'S': feed_id
                },
                ':post_id': {
                    'S': str(uuid.uuid4())
                },
                ':document_type': {
                    'S': 'post'
                },
                ':title': {
                    'S': feed_entry['title']
                },
                ':url': {
                    'S': feed_entry['link']
                }
            }
        )
        if dynamodb_response['Attributes']:
            logger.info(f'Successfully added RSS Feed Post to DynamoDB Table')
            logger.info(f'RSS Feed Post: {dynamodb_response["Attributes"]}')
            return True
    except botocore.exceptions.ClientError as e:
        if e.response['Error']['Code'] != 'ConditionalCheckFailedException':
            logger.error(f'Error adding RSS Feed Post to DynamoDB Table: {e}')
            raise
        else:
            logger.info(f'RSS Feed Post already exists in DynamoDB Table')
    finally:
        logger.error(f'Error! Something went wrong for inserting of {feed_id} with post_url {feed_entry["link"]}')
        return False

def crawl_rss_feed_post(workspace_id,post_url,link_limit=30):
    '''Creates a Website Crawling Document for the Post from the RSS Feeds'''
    logger.info(f'Starting to crawl RSS Feed post')
    logger.info(f'workspace_id = {workspace_id}')
    logger.info(f'link_limit = {link_limit}')
    logger.info(f'post_url = {post_url}')
    post_url = post_url.strip()[:10000]
    logger.info("Creating Document!")
    return genai_core.documents.create_document(
            workspace_id=workspace_id,
            document_type="website",
            path=post_url,
            crawler_properties={
                "follow_links": True,
                "limit": link_limit,
            },
        )