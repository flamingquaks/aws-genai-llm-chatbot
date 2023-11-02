import os
import boto3
import requests
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext
import feedparser

logger = Logger()

dynamodb = boto3.client('dynamodb')
rss_feed_items_table = os.environ['RSS_FEED_ITEMS_TABLE']

#Make an HTTP request to the RSS feed URL and read the response
def read_rss(url):
    logger.info(f"Reading RSS feed from {url}")
    return feedparser.parse(url)

#Function to loop through feed and put each item in DynamoDB
def add_feed_entries_to_table(feed_contents, rss_feed_url, rag_workspace_id):
    logger.info(f"Adding Parsed RSS Entries to DynamoDB Table")
    for feed_item in feed_contents['entries']:
        logger.info(f"Adding Post {feed_item['link']}")
        try:
            dynamo_response = dynamodb.put_item(
                TableName=rss_feed_items_table,
                Item={
                    'PostURL': {
                        'S': feed_item['link']
                    },
                    'FeedURL': {
                        'S': rss_feed_url
                    },
                    'RAGWorkspaceId': {
                        'S': rag_workspace_id
                    },
                    'PublishDate': {
                        'S': feed_item['published']
                    },
                    'Title': {
                        'S': feed_item['title']
                    },
                    'Status': {
                        'S': 'PENDING'
                    }
                },
                ConditionExpression='attribute_not_exists(PostURL)'
            )
            logger.info(f"DynamoDB Response: {dynamo_response}")
        except ClientError as e:
            if e.response['Error']['Code']!='ConditionalCheckFailedException':
                logger.error(f"Error adding post to table: {e}")
            else:
                logger.info(f"Post already exists in table")
            
        
    logger.info(f"Finished Adding Parsed RSS Entries to DynamoDB Table")

@logger.inject_lambda_context(log_event=True)
def lambda_handler(event, context: LambdaContext):
    logger.info(f"Starting RSS Feed Ingest!")
    rss_feed_url = event['rss_feed_url']
    rag_workspace_id = event['rag_workspace_id']
    logger.info(f"rss_feed_url = {rss_feed_url}")
    logger.info(f"rag_workspace_id = {rag_workspace_id}")
    feed_contents = read_rss(rss_feed_url)
    add_feed_entries_to_table(feed_contents, rss_feed_url, rag_workspace_id)
