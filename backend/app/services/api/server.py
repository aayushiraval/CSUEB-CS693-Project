from flask import Flask
from flask_cors import CORS, cross_origin
from mongoengine import errors

from app import config
from app.services.api import handlers
from app.util import logger


# API App Setup
_app = Flask(__name__)

# Setup CORS
CORS(_app)

# Set Secret Key for Session Encryption
_app.secret_key = config.credentials.FLASK_SECRET_KEY

# Add the Gunicorn error logging handler
_app.logger.handlers = logger.handlers
_app.logger.setLevel(logger.level)


# Error handlers
@_app.errorhandler(KeyError)
def missing_request_parameter(error):
    """API Error handler for a missing parameter.
    """
    message = f'Missing request parameter: {str(error)}'
    logger.error(message)
    return {'message': message}, 400


@_app.errorhandler(errors.ValidationError)
@_app.errorhandler(errors.FieldDoesNotExist)
@_app.errorhandler(errors.NotUniqueError)
@_app.errorhandler(ValueError)
@_app.errorhandler(IndexError)
def invalid_request_parameter(error):
    """API Error handler for an invalid parameter key (usually ignored) or value.
    """
    message = f'Invalid request parameter: {str(error)}'
    logger.error(message)
    return {'message': message}, 400


@_app.errorhandler(errors.DoesNotExist)
def entity_does_not_exist(error):
    """Generic message API Error handler.
    """
    message = str(error)
    logger.error(message)
    return {'message': message}, 400


#### API handler routes

# OAuth
_app.add_url_rule(
    '/oauth/code',
    view_func=handlers.OAuthCodeAPI.as_view('oauth_exchange_code'))
_app.add_url_rule(
    '/oauth/token',
    view_func=handlers.OAuthTokenAPI.as_view('oauth_exchange_refresh_token'))

# Users
_app.add_url_rule(
    '/users/me',
    view_func=handlers.UserMeAPI.as_view('user_me_api'))
_app.add_url_rule(
    '/users/<user_id>',
    view_func=handlers.UserAPI.as_view('user_api'))
_app.add_url_rule(
    '/users',
    view_func=handlers.UserListAPI.as_view('user_list_api'))


# Lectures
_app.add_url_rule(
    '/lectures',
    view_func=handlers.LectureListAPI.as_view('lecture_list_api')
)
_app.add_url_rule(
    '/lectures/<lecture_id>',
    view_func=handlers.LectureAPI.as_view('lecture_api')
)

# Health Check
_app.add_url_rule(
    '/health',
    view_func=handlers.HealthCheckAPI.as_view('health_check_api'))