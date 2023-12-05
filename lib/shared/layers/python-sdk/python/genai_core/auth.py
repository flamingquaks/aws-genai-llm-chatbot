from functools import wraps


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

def approved_roles(router, roles:[]):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kargs):
            user_role = get_user_role(router)
            if user_role in roles:
                return func(*args, **kargs)
            else:
                return {"ok": False, "error": "Unauthorized"}
        return wrapper
    return decorator
    
