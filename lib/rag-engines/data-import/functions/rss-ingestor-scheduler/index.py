import boto3
from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext
import os


logger = Logger()
scheduler = boto3.client('scheduler')

schedule_group = os.environ['SCHEDULE_GROUP']
rss_feed_ingestor_function = os.environ['RSS_FEED_INGESTOR_FUNCTION']
rss_feed_schedule_role_arn = os.environ['RSS_FEED_SCHEDULE_ROLE_ARN']

@logger.inject_lambda_context(log_event=True)
def lambda_handler(event, context: LambdaContext):
    logger.info(f"Received a request to create a schedule")
    rss_feed_name = event['rss_feed_name']
    rss_feed_url = event['rss_feed_url']
    rag_workspace_id = event['rag_workspace_id']

    logger.info(f"rss_feed_name = {rss_feed_name}")
    logger.info(f"rss_feed_url = {rss_feed_url}")
    logger.info('Creating schedule!')
    scheduler_response = scheduler.create_schedule(
        ActionAfterCompletion = 'NONE',
        Name=f'RSS-Daily-Ingestor-{rss_feed_name}',
        Description=f'Daily scheduled RSS ingestion of {rss_feed_url}',
        GroupName=schedule_group,
        ScheduleExpression='rate(1 day)',
        Target={
            'Arn': rss_feed_ingestor_function,
            'Input': f'{{"rss_feed_name": "{rss_feed_name}", "rss_feed_url": "{rss_feed_url}", "rag_workspace_id": "{rag_workspace_id}"}}',
            'RoleArn':rss_feed_schedule_role_arn
        },
        FlexibleTimeWindow={
            'MaximumWindowInMinutes': 120,
            'Mode': 'FLEXIBLE'
        }        
    )
    logger.info(f'Created schedule respond = {scheduler_response}')

