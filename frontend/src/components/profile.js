import React, {Component} from 'react';

import {withStyles} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import {compose} from 'recompose';
import {withSnackbar} from 'notistack';
import {withAuth} from './authContainer';
import {fetchData, handleFetchDataError} from './util';
import ReactTooltip from 'react-tooltip'
import SimpleBreadcrumbs from './breadcrumbs';
import {USER_ME_ENDPOINT} from './api';
import {ROLE_ADMIN} from './constants';

const styles = theme => ({
  root: {
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    margin: theme.spacing.unit,
    textTransform: 'none'
  },
  input: {
    display: 'none',
  },
});

class Profile extends Component {

  constructor(props) {
    super(props);
    this.state = {
      user: {},
      loading: false
    };
    this.fetchUser = this.fetchUser.bind(this);
    this.requestOfflineAccess = this.requestOfflineAccess.bind(this);
    this.abortController = new AbortController();
  }

  requestOfflineAccess() {
    const { auth, enqueueSnackbar } = this.props;
    const { user } = this.state;
    // Note: the UI will crash if the Profile component gets unmounted before
    // this call returns. There does not seem to be any way around it for now.
    // https://github.com/google/google-api-javascript-client/issues/389
    auth.grantOfflineAccess().then(body => {
      user.oauth_refresh_token = body.refresh_token;
      this.setState({ user });
    }).catch(error => {
      enqueueSnackbar(error.message, {
        variant: 'error',
      });
    });
  }

  fetchUser() {
    this.setState({ loading: true })
    // Note: an AbortError is gracefully handled here but the UI will still
    // crash if the component gets unmounted before the Google API request
    // returns (see requestOfflineAccess() in this class).
    fetchData(USER_ME_ENDPOINT, null, this.abortController.signal)
      .then(user => this.setState({ user, loading: false }))
      .catch(error => handleFetchDataError(error));
  }

  componentDidMount() {
    this.fetchUser();
  }

  componentWillUnmount() {
    this.abortController.abort()
  }

  render() {
    const { auth, classes } = this.props;
    const { user, loading } = this.state;

    const crumbs = [
      {
        label: 'Profile',
        href: '/profile'
      }
    ]

    const hasTokenPermission = auth.hasRole(ROLE_ADMIN);
    const role_readonly = "READ ONLY";
    const roles = user.roles ? user.roles.length > 0 ? user.roles: role_readonly: role_readonly;

    return (
      <div className={classes.root}>
        <SimpleBreadcrumbs crumbs={crumbs}></SimpleBreadcrumbs>
        <div>
          <h2>{user.first_name} {user.last_name} ({user.id})</h2>
          <h4>{user.email}</h4>
          <p><b>roles</b>: {roles}</p>
          <hr></hr>
          <h4>Offline Access Credentials</h4>
          { user.oauth_refresh_token ?
          <div>
            <p>Save this JSON locally to ~/.elearning/credentials.{ENV_NAME}.json to use the offline auth tokens:</p>
            <pre>
              <code>{JSON.stringify({REFRESH_TOKEN: user.oauth_refresh_token})}</code>
            </pre>
          </div> :
          <div>
            <ReactTooltip/>
            <span data-tip="You need at least the 'machine_learning' role to request offline access">
              <Button id="offine_access" variant="outlined" disabled={loading || !hasTokenPermission} className={classes.button} onClick={this.requestOfflineAccess}>
                Request Offline Access
              </Button>
            </span>
          </div>}
        </div>
      </div>
    );
  }
}

export default compose(
  withStyles(styles),
  withSnackbar,
  withAuth
)(Profile);
