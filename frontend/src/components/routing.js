import React from "react";
import { Redirect, Route } from "react-router-dom";

import { Subscribe } from 'unstated';

import authContainer from './authContainer';

export const PrivateRoute = props => {
  const { ...routeProps } = props;
  return (
    <Subscribe to={[authContainer]}>
      { auth => {
        return auth.isSignedIn() ?
          <Route {...routeProps} /> :
          <Redirect to="/" from={routeProps.path}/>
      }}
    </Subscribe>
  );
}

export const Page404 = ({ location }) => (
  <div>
    <h2>We couldn't find the page you were looking for: <code>{location.pathname}</code></h2>
    <h2>Sorry about that!</h2>
  </div>
);
