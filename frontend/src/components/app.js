import React, {Component} from 'react';
import {Route, Switch} from 'react-router-dom';
import {withStyles} from '@material-ui/core/styles';
import {compose} from 'recompose';
import {withAuth} from './authContainer';

import ClassList from './classes/classList';
import Home from './home';
import NavBar from './navbar';
import Profile from './profile';
import {Page404, PrivateRoute} from './routing';
import {handleFetchDataError} from './util';
import SelectRoleDialogue from "./classes/selectRoleDialogue";

const styles = theme => ({
  body: {
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit
  }
});


class App extends(Component) {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      labelMaps: undefined,
      userRoles : [],
    };
    this.abortController = new AbortController()
  }

  componentDidMount() {
    const {auth} = this.props;
    const finishLoading = () => this.setState({loading: false});
    if (auth.isSignedIn()) {
      Promise.all([
        auth.fetchMe()
      ]).then(([userRoles]) => {
        this.state.userRoles = userRoles[1];
      }).catch(error => {
        handleFetchDataError(error)
      }).finally(finishLoading);
    } else {
      finishLoading();
    }
  }

  componentWillUnmount() {
    this.abortController.abort()
  }

  render() {
    const { classes } = this.props;
    const { loading, labelMaps = [], userRoles } = this.state;

    return (
      <React.Fragment>
        <NavBar />
        { (!loading) ?
          <div className={classes.body}>
            <Switch>
              <Route
                exact
                path="/"
                component={Home}
              />
              <PrivateRoute
                path="/classes"
                strict
                render={(props) => {
                  const { location, match } = props;
                  const isModal = userRoles.length == 0;
                  if (!isModal) {
                  return (
                    <React.Fragment>
                        <ClassList labelMaps={labelMaps} {...props}/>
                    </React.Fragment>
                  )}
                  else {
                    return (<SelectRoleDialogue
                        title='Are you a Student or Professor?'
                    />)
                  }
                }}
              />
              <PrivateRoute
                exact
                strict
                path="/profile"
                component={Profile}
              />
              <Route
                exact
                path="/health"
              />
              <Route
                component={Page404}
              />
            </Switch>
          </div> : null
        }
      </React.Fragment>
    );
  }
}

export default compose(
  withStyles(styles),
  withAuth
)(App);
