import React, { Component } from 'react';
import { Container, Subscribe } from 'unstated';

import { fetchData, submitAPIData, handleFetchDataError } from "./util";
import { USER_ME_ENDPOINT, OAUTH_CODE_ENDPOINT } from './api';
import * as constants from './constants';

export class AuthContainer extends Container {

  constructor({ signedIn, userRoles } = {}) {
    super();
    this.state = {
      signedIn: (signedIn !== undefined) ? signedIn : gapi.auth2.getAuthInstance().isSignedIn.get(),
      userRoles: userRoles || []
    };
    this.abortController = new AbortController();
  }

  fetchMe() {
    return fetchData(USER_ME_ENDPOINT, null, this.abortController.signal)
        .then(response => {
          this.state.userRoles = response.roles;
          return [response.id, this.state.userRoles];
        })
        .catch(error => handleFetchDataError(error));
  }

  isSignedIn() {
    return !!this.state.signedIn;
  }

  hasRole(role) {
    let { userRoles = [], signedIn } = this.state;
    return signedIn && (userRoles.includes(role) || userRoles.includes(constants.ROLE_ADMIN))
  }

  generateAccessToken() {
    return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
  }

  grantOfflineAccess() {
    const authUser = gapi.auth2.getAuthInstance().currentUser.get();
    return authUser.grantOfflineAccess({
      prompt: 'consent'
    }).then(response => {
      return submitAPIData(
        OAUTH_CODE_ENDPOINT,
        {
          code: encodeURI(response.code)
        },
        this.abortController.signal
      ).catch(error => handleFetchDataError(error));
    });
  }

  handleSignIn() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signIn({
      prompt: 'select_account',
      ux_mode: 'popup'
    }).then(() => {
      this.setState({
        signedIn: auth2.isSignedIn.get()
      }, () => this.fetchMe());
    });
  }

  handleSignOut() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(() => this.setState({
      signedIn: auth2.isSignedIn.get(),
      userRoles: []
    }));
  }

  componentWillUnmount() {
    this.abortController.abort()
  }
}

export function withAuth(WrappedComponent) {
  return class extends Component {
    render() {
      return <Subscribe to={[AuthContainer]}>
        { auth => <WrappedComponent auth={auth} {...this.props} /> }
      </Subscribe>
    }
  }
}

export default AuthContainer;
