from datetime import datetime

import mongoengine

MONGO_CONNECTION_PARAMETERS = {
    'host': 'mongodb://elearning-mongo-mongodb.default.svc.cluster.local',
    'port': 27017,
    'db': 'admin',
    'username': 'root',
    'password': 'root',
}


def mongonow():
    return datetime.utcnow()


def connect():
    """Connect to the MongoDB Database"""
    mongoengine.connect(**MONGO_CONNECTION_PARAMETERS)


def disconnect():
    """Disconnect from the MongoDB Database
    #! This is currently only used by the unit tests to reset the mock mongo database.
    """
    mongoengine.disconnect()


connect()
