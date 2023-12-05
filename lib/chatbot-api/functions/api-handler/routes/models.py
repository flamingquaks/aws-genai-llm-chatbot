import genai_core.models
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler.api_gateway import Router
from genai_core.auth import approved_roles

tracer = Tracer()
router = Router()
logger = Logger()


@router.get("/models")
@tracer.capture_method
@approved_roles(router, ["admin", "workspaces_manager","workspaces_user", "chatbot_user"])
def models():
    models = genai_core.models.list_models()

    return {"ok": True, "data": models}
