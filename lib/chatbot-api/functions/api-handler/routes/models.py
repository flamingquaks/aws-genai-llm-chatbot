import genai_core.models
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler.api_gateway import Router
from genai_core.auth import role_permission

tracer = Tracer()
router = Router()
logger = Logger()


@router.get("/models")
@tracer.capture_method
@role_permission(["admin", "workspaces_manager","workspaces_user", "chatbot_user"])
def models():
    models = genai_core.models.list_models()

    return {"ok": True, "data": models}
