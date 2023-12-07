from typing import Optional
import genai_core.types
import genai_core.admin.user_management
from pydantic import BaseModel
from genai_core.auth import UserPermissions
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler.api_gateway import Router

tracer = Tracer()
router = Router()
logger = Logger()
permissions = UserPermissions(router)


class User(BaseModel):
    email: str
    phone_number: Optional[str] = None
    role: Optional[str]
    name: Optional[str]
    update_action: Optional[str] = None


@router.get("/admin/users")
@tracer.capture_method
@permissions.admin_only
def list_users():
    try:
        users = genai_core.admin.user_management.list_users()
        return {"ok": True, "data": users}
    except Exception as e:
        logger.exception(e)
        return {"ok": False, "error": str(e)}


@router.get("/admin/users/<user_id>")
@tracer.capture_method
@permissions.admin_only
def get_user(user_id: str):
    try:
        user = genai_core.admin.user_management.get_user(user_id)
        return {"ok": True, "data": user}
    except Exception as e:
        logger.exception(e)
        return {"ok": False, "error": str(e)}


@router.put("/admin/users")
@tracer.capture_method
@permissions.admin_only
def create_user():
    try:
        data: dict = router.current_event.json_body
        user = User(**data)
        if user.role in UserPermissions.approved_roles:
            genai_core.admin.user_management.create_user(
                email=user.email,
                phone_number=user.phone_number,
                role=user.role,
                name=user.name,
            )
            return {"ok": True, "data": user}
        else:
            return { "ok": False, "error": "Invalid Role provided" }
    except Exception as e:
        logger.exception(e)
        return {"ok": False, "error": str(e)}


@router.patch("/admin/users/<user_id>")
@tracer.capture_method
@permissions.admin_only
def update_user(user_id: str):
    try:
        data: dict = router.current_event.json_body
        data["email"] = user_id
        user = User(**data)
        if user.update_action == "update_details":
            genai_core.admin.user_management.update_user_details(
                user_id=user.email,
                phone_number=user.phone_number,
                role=user.role,
                name=user.name,
            )
        elif user.update_action == "disable_user":
            genai_core.admin.user_management.disable_user(user.email)
        elif user.update_action == "enable_user":
            genai_core.admin.user_management.enable_user(user.email)
        else:
            raise Exception("No valid update action provided.")
        return {"ok": True, "data": user}
    except Exception as e:
        logger.exception(e)
        return {"ok": False, "error": str(e)}


@router.delete("/admin/users/<user_id>")
@tracer.capture_method
@permissions.admin_only
def delete_user(user_id: str):
    try:
        response = genai_core.admin.user_management.delete_user(user_id)
        if response:
            return {"ok": True}
        else:
            return {
                "ok": False,
                "error": "The user is not disabled. To delete a user, first disable the user, then delete the user.",
            }
    except Exception as e:
        logger.exception(e)
        return {"ok": False, "error": str(e)}


@router.get("/admin/users/<user_id>/reset-password")
@tracer.capture_method
@permissions.admin_only
def reset_password(user_id: str):
    try:
        genai_core.admin.user_management.reset_user_password(user_id)
        return {"ok": True}
    except Exception as e:
        logger.exception(e)
        return {"ok": False, "error": str(e)}
