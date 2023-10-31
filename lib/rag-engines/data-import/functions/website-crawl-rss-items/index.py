from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext
import genai_core.documents
import os
import boto3

logger = Logger()
dynamodb = boto3.client('dynamodb')
rss_feed_items_table = os.environ['RSS_FEED_ITEMS_TABLE']
rss_feed_items_table_index = os.environ['RSS_FEED_ITEMS_TABLE_INDEX']

def create_document(rag_workspace_id, rss_item_address, link_limit):
    rss_item_address = rss_item_address.strip()[:10000]
    logger.info(f"rag_workspace_id = {rag_workspace_id}")
    logger.info(f"rss_item_address = {rss_item_address}")
    logger.info(f"link_limit = {link_limit}")
    logger.info("Creating Document!")
    return genai_core.documents.create_document(
            workspace_id=rag_workspace_id,
            document_type="website",
            path=rss_item_address,
            crawler_properties={
                "follow_links": True,
                "limit": link_limit,
            },
        )

def get_pending_rss_items():
      logger.info("Getting Pending RSS Items from dynamoDB table")
      return dynamodb.query(
            TableName=rss_feed_items_table,
            IndexName=rss_feed_items_table_index,
            Limit=10,
            KeyConditionExpression="#Status = :status",
            ExpressionAttributeValues={ ":status": { "S": "PENDING" } },
            ExpressionAttributeNames={ "#Status": "Status" }
      )

def set_rss_item_ingested(post_url, rss_feed_url):
     logger.info(f'Setting {post_url} as Ingested')
     return dynamodb.update_item(
          TableName=rss_feed_items_table,
          Key={
               'PostURL': {
                    'S': post_url
               },
               'FeedURL': {
                    'S': rss_feed_url
               }
          },
          UpdateExpression='SET #Status = :status',
          ExpressionAttributeNames={
               '#Status': 'Status'
          },
          ExpressionAttributeValues={
               ':status': {
                    'S': 'INGESTED'
               }
          }
     )


@logger.inject_lambda_context(log_event=True)
def lambda_handler(event, context: LambdaContext):    
    link_limit = 30
    pending_rss_items = get_pending_rss_items();
    logger.info(f'pending_rss_items = {pending_rss_items}')
    if len(pending_rss_items['Items']) > 0:
        for rss_item in pending_rss_items['Items']:
            logger.info(f'rss_item = {rss_item}')
            rag_workspace_id = rss_item['RAGWorkspaceId']['S']
            rss_item_address = rss_item['PostURL']['S']
            rss_item_feed_url = rss_item['FeedURL']['S']
            create_results = create_document(rag_workspace_id, rss_item_address, link_limit)
            logger.info(f'create_resuls = {create_results}')
            set_rss_item_ingested(rss_item_address,rss_item_feed_url)
            logger.info(f'Finished ingesting {rss_item_address} into crawler')
    else:
         logger.info("No pending RSS Items to ingest")
         return {
              "error": "Error Processing!"
         }

        
        
        
        