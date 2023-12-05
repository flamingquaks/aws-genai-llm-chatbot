import genai_core.types
import genai_core.parameters
import genai_core.embeddings
from typing import List
from pydantic import BaseModel
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler.api_gateway import Router
from genai_core.auth import UserPermissions

tracer = Tracer()
router = Router()
logger = Logger()
permissions = UserPermissions(router)


class EmbeddingsRequest(BaseModel):
    provider: str
    model: str
    input: List[str]


@router.get("/embeddings/models")
@tracer.capture_method
@permissions.approved_roles(
    [
        permissions.ADMIN_ROLE,
        permissions.WORKSPACES_MANAGER_ROLE,
        permissions.WORKSPACES_USER_ROLE,
    ]
)
def models():
    models = genai_core.embeddings.get_embeddings_models()

    return {"ok": True, "data": models}


@router.post("/embeddings")
@tracer.capture_method
@permissions.approved_roles(
    [
        permissions.ADMIN_ROLE,
        permissions.WORKSPACES_MANAGER_ROLE,
        permissions.WORKSPACES_USER_ROLE,
    ]
)
def embeddings():
    data: dict = router.current_event.json_body
    request = EmbeddingsRequest(**data)
    selected_model = genai_core.embeddings.get_embeddings_model(
        request.provider, request.model
    )

    if selected_model is None:
        raise genai_core.types.CommonError("Model not found")

    ret_value = genai_core.embeddings.generate_embeddings(selected_model, request.input)

    return {"ok": True, "data": ret_value}
