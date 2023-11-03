import os
import boto3


scheduler = boto3.client('scheduler')

RSS_SCHEDULE_GROUP_NAME = os.environ.get('RSS_SCHEDULE_GROUP_NAME')
RSS_FEED_INGESTOR_FUNCTION = os.environ['RSS_FEED_INGESTOR_FUNCTION']
RSS_FEED_SCHEDULE_ROLE_ARN = os.environ['RSS_FEED_SCHEDULE_ROLE_ARN']

def create_rss_subscription(workspace_id, rss_feed_url, rss_feed_title):
    rss_feed_title = rss_feed_title.replace(" ","_20")
    schedule_group = f'{RSS_SCHEDULE_GROUP_NAME}.{workspace_id}'
    scheduler_response = scheduler.create_schedule(
        ActionAfterCompletion= 'NONE',
        Name=f'{workspace_id}.{rss_feed_title}',
        Description=f'RSS Feed Subscription for {rss_feed_title}',
        GroupName=schedule_group,
        ScheduleExpression='rate(1 day)',
        Target={
            'Arn': RSS_FEED_INGESTOR_FUNCTION,
            'Input': f'{{"rss_feed_name": "{rss_feed_title}", "rss_feed_url":"{rss_feed_url}", "rag_workspace_id":"{workspace_id}"}}',
            'RoleArn': RSS_FEED_SCHEDULE_ROLE_ARN
        },
        FlexibleTimeWindow={
            'MaximumWindowInMinutes': 120,
            'Mode':'FLEXIBLE'
        }
    )
    print(scheduler_response)

def delete_rss_subscription(workspace_id, rss_feed_title):
    rss_feed_title = rss_feed_title.replace(" ","_20")
    schedule_group = f'{RSS_SCHEDULE_GROUP_NAME}.{workspace_id}'
    scheduler_response = scheduler.delete_schedule(
        Name=f'{workspace_id}.{rss_feed_title}',
        GroupName=schedule_group
    )
    print(scheduler_response)


# List Schedules for a Workspace
def list_rss_subscriptions(workspace_id):
    schedule_group = f'{RSS_SCHEDULE_GROUP_NAME}.{workspace_id}'
    scheduler_response = scheduler.list_schedules(
        GroupName=schedule_group
    )
    cleaned_schedules = []
    for schedule in scheduler_response['Schedules']:
        schedule['Name'] = schedule['Name'].replace('_20',' ').replace(workspace_id,'')
        cleaned_schedules.append(schedule)
    scheduler_response['Schedules'] = cleaned_schedules
    return scheduler_response