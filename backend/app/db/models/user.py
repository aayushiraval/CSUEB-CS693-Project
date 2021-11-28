from functools import reduce

import mongoengine
import mongoengine_goodjson as gj

from app import config
from app.db import mongonow


class User(gj.Document):
    is_deleted = mongoengine.BooleanField(required=True, default=False)
    created_at = mongoengine.DateTimeField(default=mongonow)

    first_name = mongoengine.StringField(required=True)
    last_name = mongoengine.StringField(required=True)
    email = mongoengine.EmailField(required=True, unique=True)

    # The google_user_id should remain constant even if the user's email
    # address changes. While they look like ints, Google's docs always treat it
    # as a string.
    google_user_id = mongoengine.StringField(required=False, unique=True, sparse=True)
    oauth_refresh_token = mongoengine.StringField()
    roles = mongoengine.ListField(mongoengine.StringField(choices=config.RBAC_ROLES))

    meta = {
        'indexes': [
            'is_deleted',
        ],
        'ordering': ['+_id']
    }

    # Model methods

    def has_permission(self, permission_name):
        """Checks whether a given user has a role, this checks through the tree of
        parent roles and child permissions to determine if the role that a given user
        has is represented as a parent of the given permission.

        Args:
            user (app.db.models.user.User): The user entity.
            permission_name (str): The permission to check

        Returns:
            Boolean - Has permission or not
        """
        if not self.roles:
            return False

        if self.is_deleted:
            return False

        user_permissions = set(
            reduce(lambda x, y: x + y,
                   [config.RBAC_ROLE_PERMISSIONS[role] for role in self.roles]))
        return permission_name in user_permissions
