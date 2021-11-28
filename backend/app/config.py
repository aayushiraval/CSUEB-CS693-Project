import os
import re
from pathlib import Path

ENV_LOCAL = 'local'
ENVS = (
    ENV_LOCAL,
)
ENV_DEFAULT = ENV_LOCAL

ENV = os.environ.get('APP_ENV') or ENV_DEFAULT

# Generic Configuration Variables
DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S.%fZ'

# RBAC Permissions
RBAC_PERMISSIONS_WRITE_LECTURE = 'write_lecture'
RBAC_PERMISSION_WRITE_USER = 'write_user'
RBAC_PERMISSIONS = (
    RBAC_PERMISSION_WRITE_USER,
    RBAC_PERMISSIONS_WRITE_LECTURE
)

# RBAC Roles
RBAC_ROLE_ADMIN = 'admin'
RBAC_ROLE_STUDENT = 'student'

RBAC_ROLES = (
    RBAC_ROLE_ADMIN,
    RBAC_ROLE_STUDENT
)

# ROLE PERMISSIONS
RBAC_ROLE_PERMISSIONS = {
    # Admin
    RBAC_ROLE_ADMIN: RBAC_PERMISSIONS,
}

### Environment Specific Configuration Variables
volume_root = '/'
if "TELEPRESENCE_ROOT" in os.environ:
    volume_root = os.environ["TELEPRESENCE_ROOT"]
CREDENTIALS_SECRET_DIR = os.path.join(volume_root, 'etc/secrets/credentials')

### GLOBAL Secret Credentials
credentials = None  # CredentialsLoader


def read_credentials_secrets(dir_path):
    """Read in the K8S secret credentials from the mounted secret volume.

    Args:
        dir_path (str): The credentials secret's volume mount path (probably /etc/secrets)
    Returns:
        dict - A dictionary mapping of credential name to credential value.
    """
    cred_dict = {}

    cred_fps = [fp for fp in Path(dir_path).iterdir() if fp.is_file()]
    # Read each credentials file in the directory.
    for cred_fp in cred_fps:
        match = re.match(f'^{CREDENTIALS_SECRET_DIR}/(.*)$', str(cred_fp))
        if not match or not match.groups():
            continue
        # Find the name of the credential
        cred_name = match.groups()[0]
        with cred_fp.open() as f:
            # Add the credential to the dictionary
            cred_dict[cred_name] = f.readline()

    return cred_dict


class CredentialsLoader:
    """An object for storing application credentials.

    Any credential defined in the credentials K8s secret will be converted as named
    to a `config.credentials` instance attribute.

    e.g. A credentials.<env>.json k8s secret file such as:
    ...
    "stringData": {
        "aws_access_token": "fake-aws-access-token",
        ...
    }
    ...

    when loaded with `config.load_credentials` will populate
    `config.credentials.aws_access_token` with `"fake-aws-access-token"`.
    """

    def __init__(self, credentials_path):
        credentials_dict = read_credentials_secrets(CREDENTIALS_SECRET_DIR)
        # Pull over json keys/values to instance attributes.
        for k, v in credentials_dict.items():
            setattr(self, k, v)


def load_credentials():
    """Loads credentials from a file into the config credentials global object,
    also loads the Cloudfront RSA Private Key.

    Raises:
        Exception if the credentials file is missing or could not be read.
    """
    global credentials
    credentials = CredentialsLoader(CREDENTIALS_SECRET_DIR)


# Automatically load credentials when this module is imported.
load_credentials()
