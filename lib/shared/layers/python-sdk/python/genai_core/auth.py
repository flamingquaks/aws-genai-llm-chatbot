from functools import wraps
from aws_lambda_powertools.event_handler.api_gateway import Router

router = Router()

def get_user_id(router):
    user_id = (
        router.current_event.get("requestContext", {})
        .get("authorizer", {})
        .get("claims", {})
        .get("cognito:username")
    )

    return user_id


def get_user_role(router):
    user_role = (
        router.current_event.get("requestContext", {})
        .get("authorizer", {})
        .get("claims", {})
        .get("custom:userRole")
    )

    return user_role

def role_permission(approved_roles:[]):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kargs):
            user_role = get_user_role(router)
            if user_role in approved_roles:
                return func(*args, **kargs)
            else:
                return {"ok": False, "error": "Unauthorized"}
        return wrapper
    
