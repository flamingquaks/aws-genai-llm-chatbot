import genai_core.parameters
import genai_core.kendra
from pydantic import BaseModel
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler.api_gateway import Router
from genai_core.auth import UserPermissions

tracer = Tracer()
router = Router()
logger = Logger()
permissions = UserPermissions(router)


class KendraDataSynchRequest(BaseModel):
    workspaceId: str


@router.get("/rag/engines")
@tracer.capture_method
@permissions.approved_roles(
    [
        permissions.ADMIN_ROLE,
        permissions.WORKSPACES_MANAGER_ROLE,
        permissions.WORKSPACES_USER_ROLE,
    ]
)
def engines():
    config = genai_core.parameters.get_config()

    engines = config["rag"]["engines"]
    ret_value = [
        {
            "id": "aurora",
            "name": "Amazon Aurora",
            "enabled": engines.get("aurora", {}).get("enabled", False) == True,
        },
        {
            "id": "opensearch",
            "name": "Amazon OpenSearch",
            "enabled": engines.get("opensearch", {}).get("enabled", False) == True,
        },
        {
            "id": "kendra",
            "name": "Amazon Kendra",
            "enabled": engines.get("kendra", {}).get("enabled", False) == True,
        },
    ]

    return {"ok": True, "data": ret_value}
