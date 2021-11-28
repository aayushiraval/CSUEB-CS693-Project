import logging
from app import config

# This logger assumes we are using gunicorn for our services
# and will therefore use the gunicorn logger and logging handlers.
logging.basicConfig(format=f'%(asctime)s - %(name)s ({config.ENV}) - %(levelname)s: %(message)s')
formatter = logging.Formatter()
logger = logging.getLogger('gunicorn.error')
if config.ENV == config.ENV_LOCAL:
    logger.setLevel(logging.INFO)
