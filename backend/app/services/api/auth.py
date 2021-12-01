from functools import wraps

import requests
from flask import request
from mongoengine.errors import NotUniqueError

from app import config
from app.db.models import User
from app.services.api.util import error
from app.util import logger


OAUTH_TOKENINFO_API_URL = \
    'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={access_token}'

OAUTH_USERINFO_API_URL = \
    'https://www.googleapis.com/oauth2/v1/userinfo?access_token={access_token}'


def require_oauth_token(api_method):  # noqa: C901
    """Authenticate the Bearer token from the Authorization header.

    Note - The following scopes are needed for user authentication:
        https://www.googleapis.com/auth/userinfo.email

    Args:
        api_method (function): A Flask Restful Resource request handler method.

    Returns:
        If authentication succeeded, the api_method's result, otherwise a 401
        Unauthorized response.
    """
    @wraps(api_method)
    def api_method_wrapper(handler, *args, **kwargs):
        # Make sure we have the credentials we need to validate an OAuth token.
        credential_key = 'OAUTH_CLIENT_ID'
        oauth_client_id = getattr(config.credentials, credential_key, None)
        if not oauth_client_id:
            return error(f"Credential not found: {credential_key}", 500)

        # Get the "Authorization: Bearer <access_token>" header.
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return error("Missing OAuth Authorization header", 401)

        try:
            # Parse the access token from the Authorization header.
            access_token = auth_header.split('Bearer ')[1]
            # Get the access token information from Google.
            token_info = get_oauth_token_info(access_token)
        except IndexError:
            # There was an exception trying to parse the header,
            # or retrieving the token information.
            return error("Invalid OAuth Authorization header", 401)

        if not token_info:
            # The token validation failed.
            return error("Invalid OAuth access token", 401)

        # Get the token information needed to validate it.
        token_email = token_info.get('email')
        token_audience = token_info.get('audience')
        token_expires_in = token_info.get('expires_in')
        token_user_id = token_info.get('user_id')

        token_properties = (
            token_email,
            token_audience,
            token_expires_in,
            token_user_id)

        # Invalid token conditions.
        wrong_app = token_audience != oauth_client_id
        token_expired = token_expires_in <= 0

        if any(map(lambda x: not x, token_properties)) or wrong_app or token_expired:
            # The token validation failed.
             return error("Invalid OAuth access token", 401)

        # Try to get the user by google_user_id first, then email address.
        user = None
        try:
            user = User.objects.get(google_user_id=token_user_id)
        except User.DoesNotExist:
            # Get the User by the token email address.
            try:
                user = User.objects.get(email=token_email)
                # Update the google_user_id
                user.google_user_id = token_user_id
                user.save()
            except User.DoesNotExist:
                logger.info(token_email)
                # if not token_email.endswith("csueastbay.edu"):
                #     return error("Invalid OAuth access token email", 401)
        if user is None:
            # Make the read-only user.
            user_info = get_oauth_user_info(access_token)
            if not user_info:
                # The token validation failed.
                return error("Invalid OAuth access token", 401)

            first_name = user_info.get('given_name', 'first_name')
            last_name = user_info.get('family_name', 'last_name')
            try:
                user = User(
                    email=token_email,
                    first_name=first_name,
                    last_name=last_name,
                    google_user_id=token_user_id)
                user.save()
            except NotUniqueError:
                # This exception can arise from a race condition wherein we
                # incorrectly believe the user does not exist. Rollback and get
                # the user from the google_user_id.
                try:
                    user = User.objects.get(google_user_id=token_user_id)
                except User.DoesNotExist:
                    return error('Authenticated User not found', 401)
        elif user.email != token_email:
            # The email address has changed, update our records.
            try:
                user.email = token_email
                user.save()
            except NotUniqueError:
                # Somehow we have 2 different google user IDs with the same
                # email. This should never happen.
                return error('Duplicate email address found', 401)

        # Finally, process the request.
        return api_method(handler, auth_user=user, *args, **kwargs)
    return api_method_wrapper


def require_permission(permission):
    """Enforces a RBAC permission for a user for an API request handler method.
    #! Important: This decorator must come after @auth.require_oauth_token, because it
    #! relies on the auth_user being populated already.

    Args:
        permission (str): A permissions needed for a specific API operation.
    """
    def real_decorator(api_method):
        """
        Args:
            api_method (function): A Flask Restful Resource request handler method.

        Returns:
            If the user has permission, the api_method's result, otherwise a 403
            Forbidden response.
        """
        @wraps(api_method)
        def api_method_wrapper(handler, *args, **kwargs):
            auth_user = kwargs.get('auth_user')
            if not auth_user or not auth_user.has_permission(permission):
                # Unable to authenticate user or user permission for this API method.
                return error("Forbidden", 403)
            return api_method(handler, *args, **kwargs)
        return api_method_wrapper
    return real_decorator


def get_oauth_token_info(access_token):
    """Get the token info for a given Google OAuth2 access token.

    Args:
        access_token (str): The Google Oauth2 access token.

    Returns:
        dict: The token information.
        or None if the Google OAuth2 API response was bad.

    Example of valid token information:
    {
        'access_type': 'offline'
        'audience': '255974607945-j2o12lkad7afpkh7ogmeuh57ge1joru3.apps.googleusercontent.com',
        'email': 'alex.jolicoeur@bluerivert.com',
        'expires_in': 3330,
        'issued_to': '255974607945-j2o12lkad7afpkh7ogmeuh57ge1joru3.apps.googleusercontent.com',
        'scope': 'https://www.googleapis.com/auth/userinfo.email
                  https://www.googleapis.com/auth/userinfo.profile',
        'user_id': '354778096031016196626',
        'verified_email': True,
    }
    #
    """
    try:
        response = requests.get(OAUTH_TOKENINFO_API_URL.format(access_token=access_token))
    except requests.exceptions.RequestException as e:
        logger.error(str(e))
        return None

    if response.status_code != 200:
        # Not-OK response from OAuth2 TokenInfo API.
        logger.warning(f'{response.status_code}: {response.content}')
        return None

    return response.json()


def get_oauth_user_info(access_token):
    """Get the user info for a given Google OAuth2 access token.

    Args:
        access_token (str): The Google Oauth2 access token.

    Returns:
        dict: The user information.
        or None if the Google OAuth2 API response was bad.

    Example of valid user information:
    {
        "id": "113727034627148388878",
        "name": "Taylor Ritenour",
        "given_name": "Taylor",
        "family_name": "Ritenour",
        "link": "https://plus.google.com/113727034627148388878",
        "picture": "https://lh5.googleusercontent.com/.../.../.../.../mo/photo.jpg",
        "locale": "en"
    }
    """
    try:
        response = requests.get(OAUTH_USERINFO_API_URL.format(access_token=access_token))
    except requests.exceptions.RequestException as e:
        logger.error(str(e))
        return None

    if response.status_code != 200:
        # Not-OK response from OAuth2 TokenInfo API.
        logger.warning(f'{response.status_code}: {response.content}')
        return None

    return response.json()


def require_oauth_token_or_api_key(api_method):
    """Authenticate either an API Key or OAuth token. If both are present, use the API key
    Args:
        api_method (function): A Flask Restful Resource request handler method.

    Returns:
        If authentication succeeded, the api_method's result, otherwise a 401
        Unauthorized response.
    """

    @wraps(api_method)
    def api_method_wrapper(handler, *args, **kwargs):
        # Get the "Authorization: Bearer <access_token>" header if it exists.
        auth_header = request.headers.get('Authorization')

        # Determine appropriate auth method
        if auth_header is not None and auth_header:
            return require_oauth_token(api_method)(handler, *args, **kwargs)
        else:
            return error('Should not reach', 500)

    return api_method_wrapper
