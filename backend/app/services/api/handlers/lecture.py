import json

from flask import request
from flask.views import MethodView

import app.config
from app import config
from app.db import models
from app.services.api import auth, util


class LectureListAPI(MethodView):
    """ /lectures """

    @util.with_pagination
    @auth.require_oauth_token
    def get(self, auth_user, count, page):
        """ Return a page of Lectures """
        filters = util.prepare_filters(request.args)
        cursor, next_page, prev_page, total_count = \
            util.paginate_query(
                models.Lecture,
                filters=filters,
                count=count,
                page=page)
        return {
            'data': [json.loads(lecture.to_json()) for lecture in cursor],
            'next_page': next_page,
            'prev_page': prev_page,
            'total_count': total_count
        }

    @auth.require_oauth_token
    @auth.require_permission(config.RBAC_PERMISSIONS_WRITE_LECTURE)
    def post(self, auth_user):
        """ Create a Lecture """
        body = request.get_json()
        body['meeting_link'] = f"{app.config.credentials.MEETING_APP_LINK}?m={body['name']}"
        lecture = models.Lecture(
            created_by=auth_user,
            **body)
        lecture.save()
        return lecture.to_json(), 201


class LectureAPI(MethodView):
    """ /lectures/<id> """

    @auth.require_oauth_token
    def get(self, auth_user, lecture_id):
        """ Get a specific User """
        lecture = models.Lecture.objects.get(id=lecture_id)
        return lecture.to_json()

    @auth.require_oauth_token
    @auth.require_permission(config.RBAC_PERMISSIONS_WRITE_LECTURE)
    def delete(self, auth_user, lecture_id):
        """ Delete an User """
        lecture = models.Lecture.objects.get(id=lecture_id)
        lecture.delete()
        return {}, 204
