from flask.views import MethodView


class HealthCheckAPI(MethodView):
    """ /health """

    def get(self):
        return {}, 200
