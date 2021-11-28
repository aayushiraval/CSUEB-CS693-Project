from datetime import datetime, timedelta
from functools import wraps
import re

from flask import request
from werkzeug.datastructures import ImmutableMultiDict

from app.util import logger

API_PAGE_SIZE_DEFAULT = 50


def error(message, status=500, log=True):
    """Return an API error response.

    Args:
        message (str): The error message.
        status (int, 500): The response status.
        log(bool, True): Whether to log the error or not.

    Returns:
        tuple(dict, int) - The error response object.
    """
    if log:
        logger.error(message)
    return {'message': message}, status


def add_datetime_filter(filters_dict, attr_key, attr_val, raw=False):
    """Parses a datetime filter string from the request arguments, and
    adds the correct begin/end interval filter to the given filters dictionary.
    """
    # Depending on whether this was called on a Dict or an ImmutableMultiDict,
    # The attr_val may be a string or a list.
    if attr_val and isinstance(attr_val, list):
        attr_val = attr_val[0]

    match = re.search(r'^(\d{13})?,(\d{13})?$', attr_val) \
        if attr_val else None
    if attr_val and not match:
        # Invalid datetime filter.
        raise ValueError(f"'{attr_key}': {attr_val}")
    if not match:
        return

    start, end = match.groups()
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    start_datetime = datetime.fromtimestamp(int(start) / 1000) \
        if start else datetime.min
    end_datetime = datetime.fromtimestamp(int(end) / 1000) \
        if end else today + timedelta(days=1)
    if raw:
        filters_dict[attr_key] = {
            '$gte': start_datetime,
            '$lte': end_datetime
        }
    else:
        filters_dict[f'{attr_key}__gte'] = start_datetime
        filters_dict[f'{attr_key}__lte'] = end_datetime


def prepare_filters(request_args):
    """Transform the Flask request arguments into a MongoEngine query filter dictionary.

    Args:
        request_args (werkzeug.datastructures.ImmutableMultiDict): The Flask request.args.
    Returns:
        dict - MongoEngine query filter keys and values (using the __in operator).
    """
    if isinstance(request_args, ImmutableMultiDict):
        # Convert the multidict to a dictionary.
        args = request_args.to_dict(flat=False)
    else:
        args = request_args
    # Remove the pagination parameters.
    args.pop('count', None)
    args.pop('page', None)
    args.pop('key', None)

    created_at = args.pop('created_at', None)

    # Prepare the filters keys for mongoengine filtering with the __in operator.
    filters = {
        f'{k}__in': v
        for k, v in args.items()
    }
    add_datetime_filter(filters, 'created_at', created_at)

    return filters


def paginate_query(model, filters, count, page, order_by=None):
    """Return a page of model documents.

    Args:
        model (mongoengine Document model): The Document model.
        count (int): The page size.
        page (int): The page number.
        order_by (str): The attributes to sort by. see
            http://docs.mongoengine.org/apireference.html#mongoengine.queryset.QuerySet.order_by

    Returns:
        dict - A page dictionary object:
            data (list<dict>): The documents JSON list.
            prev_page (int): The previous page number.
            next_page (int): The next page number.
            total_count (int): The total queryset count.
    """
    if hasattr(model, 'is_deleted'):
        filters['is_deleted'] = False
    cursor = model.objects(**filters)
    if order_by:
        cursor = cursor.order_by(order_by)
    cursor = cursor[count * page: count * (page + 1)]
    total_count = cursor.count()
    prev_page = page - 1 if page > 0 else None
    next_page = page + 1 if count * (page + 1) < total_count else None
    return cursor, next_page, prev_page, total_count


def with_pagination(api_method):
    """Decorator to parse the pagination parameters and inject them into the method parameters.

    Args:
        api_method (func): The Flask API handler method.
    """

    @wraps(api_method)
    def api_method_wrapper(handler, *args, **kwargs):
        # Get the count and last_id query parameter values.
        kwargs['count'] = int(request.args.get('count', API_PAGE_SIZE_DEFAULT))
        kwargs['page'] = int(request.args.get('page', 0))
        # Finally, process the request.
        return api_method(handler, *args, **kwargs)

    return api_method_wrapper
