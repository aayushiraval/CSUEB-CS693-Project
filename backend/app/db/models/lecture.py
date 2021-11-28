import mongoengine
import mongoengine_goodjson as gj

from app.db import mongonow


class Lecture(gj.Document):
    start_date = mongoengine.DateTimeField(required=True)
    end_date = mongoengine.DateTimeField(required=True)
    instructor_name = mongoengine.StringField(required=True)
    created_by = mongoengine.ReferenceField('User', required=True)
    name = mongoengine.StringField(required=True, unique=True)
    description = mongoengine.StringField(required=True)
    meeting_link = mongoengine.StringField(required=True, unique=True)
    created_at = mongoengine.DateTimeField(required=True, default=mongonow())
    updated_at = mongoengine.DateTimeField(default=mongonow())

    meta = {
        'indexes': [
            {
                'name': 'TTL_index',
                'fields': ['end_date'],
                'expireAfterSeconds': 0
            }
        ]
    }

    def modify(query=None, **update):
        """
        The modify call skips all validation. Overriding it here to block
        un-validated updates from being saved.
        """
        raise NotImplementedError('Please use save() to trigger proper validation.')

    def save(self, *args, **kwargs):
        self.instructor_name = f"{self.created_by.first_name} {self.created_by.last_name}"
        return super().save(*args, **kwargs)
