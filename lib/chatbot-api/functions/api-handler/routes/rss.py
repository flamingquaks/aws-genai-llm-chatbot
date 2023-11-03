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



@router.post("/workspaces/<workspace_id>/rss")
@tracer.capture_method
def subscribe_to_rss(workspace_id: str):
    data: dict = router.current_event.json_body
    request = RssFeedRequest(**data)   

    result = genai_core.rss.create_rss_subscription(workspace_id, request.rssFeedUrl,request.rssFeedTitle)

    return {"ok": True, "data": result}


@router.get('/workspaces/<workspace_id>/rss')
@tracer.capture_method
def list_rss_subscriptions(workspace_id: str):
    result = genai_core.rss.list_rss_subscriptions(workspace_id)
    return {
        "ok": True,
        "data": {
            "workspaceId" : workspace_id,
            "items": [result["Schedules"]],

        },
    }

@router.delete('/workspace/<workspace_id>/rss/<rss_feed_title>')
@tracer.capture_method
def delete_rss_subscription(workspace_id: str, rss_feed_title: str):
    result = genai_core.rss.delete_rss_subscription(workspace_id, rss_feed_title)
    return {"ok": True, "data": result}