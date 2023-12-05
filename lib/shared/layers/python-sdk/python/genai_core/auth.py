from functools import wraps


def get_user_id(router):
    user_id = (
        router.current_event.get("requestContext", {})
        .get("authorizer", {})
        .get("claims", {})
        .get("cognito:username")
    )

    return user_id
    
class UserPermissions():
    ADMIN_ROLE = "admin"
    WORKSPACES_MANAGER_ROLE = "workspaces_manager"
    WORKSPACES_USER_ROLE = "workspaces_user"
    CHATBOT_USER_ROLE = "chatbot_user"

    def __init__(self, router):
        self.router = router

    def __get_user_role(self):
        user_role = (
            self.router.current_event.get("requestContext", {})
            .get("authorizer", {})
            .get("claims", {})
            .get("custom:userRole")
        )

        return user_role

    def approved_roles(self, roles:[]):
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kargs):
                user_role = self.__get_user_role()
                if user_role in roles:
                    return func(*args, **kargs)
                else:
                    self.logger.info()
                    return {"ok": False, "error": "Unauthorized"}
            return wrapper
        return decorator