import genai_core.models
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler.api_gateway import Router
from genai_core.auth import UserPermissions

tracer = Tracer()
router = Router()
logger = Logger()
permissions = UserPermissions(router)


@router.get("/models")
@tracer.capture_method
@permissions.approved_roles(
    [
        permissions.ADMIN_ROLE,
        permissions.WORKSPACES_MANAGER_ROLE,
        permissions.WORKSPACES_USER_ROLE,
        permissions.CHATBOT_USER_ROLE,
    ],
)
def models():
    models = genai_core.models.list_models()

    return {"ok": True, "data": models}
