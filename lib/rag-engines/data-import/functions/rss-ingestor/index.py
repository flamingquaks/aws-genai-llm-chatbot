import os
import boto3
import requests
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
def add_feed_entries_to_table(feed_contents, feed_url):
    logger.info(f"Adding Parsed RSS Entries to DynamoDB Table")
    for feed_item in feed_contents:
        logger.info(f"Adding Post {feed_item['link']}")
        dynamo_response = dynamodb.put_item(
            TableName=rss_feed_items_table,
            Item={
                'PostURL': {
                    'S': feed_item['link']
                },
                'FeedURL': {
                    'S': feed_url
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
            ConditionalExpression='attribute_not_exists(PostURL)'
        )
        logger.info(f"DynamoDB Response: {dynamo_response}")
    logger.info(f"Finished Adding Parsed RSS Entries to DynamoDB Table")

@logger.inject_lambda_context(log_event=True)
def lambda_handler(event, context: LambdaContext):
    logger.info(f"Starting RSS Feed Ingest!")
    feed_url = event['feed_url']
    feed_contents = read_rss(feed_url)
    add_feed_entries_to_table(feed_contents, feed_url)
