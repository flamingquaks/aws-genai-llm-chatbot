from functools import wraps


def get_user_id(router):
    user_id = (
        router.current_event.get("requestContext", {})
        .get("authorizer", {})
        .get("claims", {})
        .get("cognito:username")
    )

    return user_id


class UserPermissions:
    """Responsible for validating the user's permissions for API calls

    Args:
        router (aws_lambda_powertools.event_handler.api_gateway.Router): The lambda powertools router defined for the API endpoints

    Valid Roles:
        - `ADMIN_ROLE` = `admin`
        - `WORKSPACES_MANAGER_ROLE` = `workspaces_manager`
        - `WORKSPACES_USER_ROLE` = `workspaces_user`
        - `CHATBOT_USER_ROLE` = `chatbot_user`
    """

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

    def approved_roles(self, roles: []):
        """Validates the user calling the endpoint
        has a user role set that is approved for the endpoint

        Args:
            roles (list): list of roles that are approved for the endpoint

        Valid Roles:
            - `ADMIN_ROLE` = `admin`
            - `WORKSPACES_MANAGER_ROLE` = `workspaces_manager`
            - `WORKSPACES_USER_ROLE` = `workspaces_user`
            - `CHATBOT_USER_ROLE` = `chatbot_user`

        Returns:
            function: If the user is approved, the function being called will be returned for execution
            dict: If the user is not approved, a response of `{"ok": False, "error": "Unauthorized"}` will be returned
            as the response.

        Examples:
        ```
            from aws_lambda_powertools.event_handler.api_gateway import Router
            from genai_core.auth import UserPermissions

            router = Router()
            permissions = UserPermissions(router)

            @router.get("/sample/endpoint")
            @permissions.approved_roles(
                [
                    permissions.ADMIN_ROLE,
                    permissions.WORKSPACES_MANAGER_ROLE
                ]
            )
            def sample_endpoint():
                pass
        ```
        """

        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kargs):
                user_role = self.__get_user_role()
                if user_role in roles:
                    return func(*args, **kargs)
                else:
                    return {"ok": False, "error": "Unauthorized"}

            return wrapper

        return decorator
