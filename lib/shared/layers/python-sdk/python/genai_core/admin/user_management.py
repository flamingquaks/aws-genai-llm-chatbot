import boto3
import genai_core.auth
import os

COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID")

idp = boto3.client("cognito-idp")


def create_user(name, email, role):
    if role in genai_core.auth.UserPermissions.VALID_ROLES:
        response = idp.admin_create_user(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=email,
            UserAttributes=[
                {"Name": "email", "Value": email},
                {"Name": "name", "Value": name},
                {"Name": "custom:role", "Value": role},
            ],
        )
        if response["ResponseMetadata"]["HTTPStatusCode"] == 200:
            return True
        else:
            raise Exception("Error creating user" + str(response))
    else:
        raise Exception("Invalid role")


def list_users():
    response = idp.list_users(
        UserPoolId=COGNITO_USER_POOL_ID,
    )
    users = []
    for user in response["Users"]:
        user_data = {}
        for attribute in user['Attributes']:
            if attribute["Name"] == "name":
                user_data["name"] = attribute["Value"]
            if attribute["Name"] == "email":
                user_data["email"] = attribute["Value"]
            if attribute["Name"] == "phone_number":
                user_data["phoneNumber"] = attribute["Value"]
            if attribute["Name"] == "custom:userRole":
                user_data["role"] = attribute["Value"]
        user_data["enabled"] = user["Enabled"]
        user_data["userStatus"] = user["UserStatus"]
        users.append(user_data)
    return users


def get_user(email):
    response = idp.admin_get_user(UserPoolId=COGNITO_USER_POOL_ID, Username=email)
    if response["ResponseMetadata"]["HTTPStatusCode"] == 200:
        user_data = {}
        for attribute in response['Attributes']:
            if attribute["Name"] == "name":
                user_data["name"] = attribute["Value"]
            if attribute["Name"] == "email":
                user_data["email"] = attribute["Value"]
            if attribute["Name"] == "phone_number":
                user_data["phoneNumber"] = attribute["Value"]
            if attribute["Name"] == "custom:userRole":
                user_data["role"] = attribute["Value"]
        user_data["enabled"] = response["Enabled"]
        user_data["userStatus"] = response["UserStatus"]
    return user_data


def delete_user(email):
    user_details_response = idp.admin_get_user(
        UserPoolId=COGNITO_USER_POOL_ID, Username=email
    )
    if user_details_response["Enabled"] == False:
        idp.admin_delete_user(UserPoolId=COGNITO_USER_POOL_ID, Username=email)
        return True
    else:
        return False


def disable_user(email):
    idp.admin_disable_user(UserPoolId=COGNITO_USER_POOL_ID, Username=email)
    return True


def enable_user(email):
    idp.admin_enable_user(UserPoolId=COGNITO_USER_POOL_ID, Username=email)
    return True


def update_user_details(current_email, **kwargs):
    attribute = []
    if "name" in kwargs:
        attribute.append({"Name": "name", "Value": kwargs["name"]})
    if "email" in kwargs:
        attribute.append({"Name": "email", "Value": kwargs["email"]})
        attribute.append({"Name": "email_verified", "Value": "true"})
    if "phone_number" in kwargs:
        attribute.append({"Name": "phone_number", "Value": kwargs["phone_number"]})
        attribute.append({"Name": "phone_number_verified", "Value": "true"})
    if (
        "role" in kwargs
        and kwargs["role"] in genai_core.auth.UserPermissions.VALID_ROLES
    ):
        attribute.append({"Name": "custom:role", "Value": kwargs["role"]})
    idp.admin_update_user_attributes(
        UserPoolId=COGNITO_USER_POOL_ID,
        Username=current_email,
        UserAttributes=attribute,
    )
    return True


def reset_user_password(email):
    idp.admin_reset_user_password(UserPoolId=COGNITO_USER_POOL_ID, Username=email)
    return True
