import json

from flask import request
from flask.views import MethodView

from app import config
from app.db import models
from app.services.api import auth, util


class UserMeAPI(MethodView):
    """ /users/me """

    @auth.require_oauth_token
    def get(self, auth_user):
        return json.loads(auth_user.to_json())


class UserListAPI(MethodView):
    """ /users """

    @util.with_pagination
    @auth.require_oauth_token
    def get(self, auth_user, count, page):
        """ Return a page of Users """
        filters = util.prepare_filters(request.args)
        cursor, next_page, prev_page, total_count = \
            util.paginate_query(
                models.User,
                filters=filters,
                count=count,
                page=page)
        user_jsons = []
        for user in cursor:
            user_json = json.loads(user.to_json())
            # We don't want to return a User's refresh token to other Users.
            user_json.pop('oauth_refresh_token', None)
            user_jsons.append(user_json)
        return {
            'data': user_jsons,
            'next_page': next_page,
            'prev_page': prev_page,
            'total_count': total_count
        }

    @auth.require_oauth_token
    @auth.require_permission(config.RBAC_PERMISSION_WRITE_USER)
    def post(self, auth_user):
        """ Create a User """
        body = request.get_json()
        user = models.User(
            email=body['email'].lower(),
            first_name=body['first_name'].lower(),
            last_name=body['last_name'].lower(),
            oauth_refresh_token=body.get('oauth_refresh_token'),
            roles=body.get('roles'))
        user.save()
        user_json = json.loads(user.to_json())
        # We don't want to return a User's refresh token to other Users.
        user_json.pop('oauth_refresh_token', None)
        return user_json, 201


class UserAPI(MethodView):
    """ /users/<id> """

    @auth.require_oauth_token
    def get(self, auth_user, user_id):
        """ Get a specific User """
        user = models.User.objects.get(id=user_id)
        user_json = json.loads(user.to_json())
        # We don't want to return a User's refresh token to other Users.
        user_json.pop('oauth_refresh_token', None)
        return user_json

    @auth.require_oauth_token
    def patch(self, auth_user, user_id):
        """ Update/modify a User"""
        user = models.User.objects.get(id=user_id)

        body = request.get_json()
        for k, v in body.items():
            setattr(user, k, v)
        user.save()
        user_json = json.loads(user.to_json())
        # We don't want to return a User's refresh token to other Users.
        user_json.pop('oauth_refresh_token', None)
        return user_json

    @auth.require_oauth_token
    @auth.require_permission(config.RBAC_PERMISSION_WRITE_USER)
    def delete(self, auth_user, user_id):
        """ Delete an User """
        user = models.User.objects.get(id=user_id)
        user.is_deleted = True
        user.save()
        return {}, 204
