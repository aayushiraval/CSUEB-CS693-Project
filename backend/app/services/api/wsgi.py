from app.services.api.server import _app as application

if __name__ == '__main__':
    # Run the flask app.
    application.run(host='0.0.0.0', port=80, ssl_context='adhoc')
