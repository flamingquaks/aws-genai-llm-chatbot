import os
import genai_core.rss
from pydantic import BaseModel
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler.api_gateway import Router


tracer = Tracer()
router = Router()
logger = Logger()

class RssFeedRequest(BaseModel):
    rssFeedUrl: str
    rssFeedTitle: str



@router.post("/rss/<workspace_id>/")
@tracer.capture_method
def subscribe_to_rss(workspace_id: str):
    data: dict = router.current_event.json_body
    request = RssFeedRequest(**data)   
    result = genai_core.rss.create_rss_subscription(workspace_id, request.rssFeedUrl,request.rssFeedTitle)
    return {"ok": True, "data": {
        "items": result
    }}


@router.get('/rss/<workspace_id>/')
@tracer.capture_method
def list_rss_subscriptions(workspace_id: str):
    result = genai_core.rss.list_rss_subscriptions(workspace_id)
    return {
        "ok": True,
        "data": {
            "items": result
        },
    }



@router.get('/rss/<workspace_id>/<feed_id>/')
@tracer.capture_method
def get_rss_subscription_details(workspace_id: str, feed_id: str):
    logger.debug(f'Get RSS Subscription Details for feed_id {feed_id} and workspace_id {workspace_id}')
    details = genai_core.rss.get_rss_subscription_details(workspace_id, feed_id)
    return {
        "ok": True,
        "data": details
    }

@router.get('/rss/<workspace_id>/<feed_id>/posts')
@tracer.capture_method
def list_posts_for_rss_subscription(workspace_id: str, feed_id: str):
    logger.debug(f'List posts for RSS subscription with feed_id = {feed_id} and workspace_id = {workspace_id}')
    posts = genai_core.rss.list_posts_for_rss_subscription(workspace_id, feed_id)
    if posts is None:
        return {"ok": True, "data": {
            "items": []
        }}
    else:
        return {"ok": True, "data": {
            "items": posts,
        }}
        

@router.get('/rss/<workspace_id>/<feed_id>/disable')
@tracer.capture_method
def disable_rss_subscription(workspace_id: str, feed_id: str):
    result = genai_core.rss.disable_rss_feed_subscription(workspace_id, feed_id)
    return {"ok": True, "data": {
        "items": result
    }}

@router.get('/rss/<workspace_id>/<feed_id>/enable')
@tracer.capture_method
def enable_rss_subscription(workspace_id: str, feed_id: str):
    result = genai_core.rss.enable_rss_feed_subscription(workspace_id, feed_id)
    return {"ok": True, "data": {
        "items": result
    }}