import httplib2

from flask import request
from flask.views import MethodView
from oauth2client.client import Error as OAuthClientError
from oauth2client.client import GoogleCredentials, credentials_from_code

from app import config
from app.services.api import auth, util


OAUTH_TOKEN_URI = 'https://www.googleapis.com/oauth2/v4/token'
OAUTH_SCOPES = 'openid email profile'


class OAuthCodeAPI(MethodView):
    """ /oauth/code """

    @auth.require_oauth_token
    def post(self, auth_user):
        """ Exchange the OAuth code for a refresh token and save it to the User entity. """
        body = request.get_json() or {}
        if not auth_user.oauth_refresh_token:
            try:
                # Exchange the code for a refresh token and update the User.
                auth_user.oauth_refresh_token = get_refresh_token(body['code'])
                auth_user.save()
            except OAuthClientError as e:
                return util.error(f'Error exchanging OAuth authorization code: {e}', 400)

        return {'refresh_token': auth_user.oauth_refresh_token}


class OAuthTokenAPI(MethodView):
    """ /oauth/token """

    def post(self):
        """ Exchange the User's refresh token for an access token. """
        body = request.get_json() or {}
        try:
            access_token = get_access_token(body['refresh_token'])
        except OAuthClientError as e:
            return util.error(f'Error exchanging refresh token: {e}', 400)

        return {'access_token': access_token}


def get_access_token(refresh_token):
    """Request an access token for a refresh token from google.

    Args:
        refresh_token (str): The refresh token.
    Returns:
        str: The access token for the next hour.
    """
    # Setting the token to None triggers google to generate it from the refresh token
    credentials = GoogleCredentials(
        None,
        client_id=config.credentials.OAUTH_CLIENT_ID,
        client_secret=config.credentials.OAUTH_CLIENT_SECRET,
        refresh_token=refresh_token,
        token_expiry=None,
        user_agent="elearning",
        token_uri=OAUTH_TOKEN_URI)
    http = credentials.authorize(httplib2.Http())
    credentials.refresh(http)
    return credentials.access_token


def get_refresh_token(code):
    """Request a refresh token for a code provided by oauth validation from gapi.

    Args:
        code (str): The code provided by google oauth.
    Returns:
        str: The refresh token to use in offline requests.
    """
    credentials = credentials_from_code(
        config.credentials.OAUTH_CLIENT_ID,
        config.credentials.OAUTH_CLIENT_SECRET,
        OAUTH_SCOPES,
        code)
    return credentials.refresh_token
