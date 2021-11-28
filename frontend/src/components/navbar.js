import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import { compose } from 'recompose';

import { withAuth } from './authContainer';
import logo from '../static/images/logo.png';

const styles = theme => ({
  flexGrow: {
    flexGrow: 1
  },
  appBar: {
    backgroundColor: '#333333',
  },
  button: {
    margin: theme.spacing.unit,
    textTransform: 'none',
    color: '#FFFFFF'
  },
  logo: {
    height: 38,
    width: 151,
  },
  tab: {
    fontSize: 18,
    textTransform: 'capitalize',
    '&:hover': {
      backgroundColor: '#004190'
    }
  },
  floatRight: {
    float: 'right'
  }
});

class NavBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: false
    };
    this.setTab = this.setTab.bind(this);
    this.unsetTab = this.unsetTab.bind(this);
  }

  setTab(event, value) {
    this.setState({ activeTab: value });
  }

  unsetTab() {
    this.setState({ activeTab: false });
  }

  render() {
    const { classes, auth } = this.props;
    const { activeTab } = this.state;

    const signInOrSignOut = auth.isSignedIn() ?
      <Button id="logout" variant="outlined" className={classes.button} onClick={() => auth.handleSignOut()}>
        Sign out
      </Button> :
      <Button id="login" variant="outlined" className={classes.button} onClick={() => auth.handleSignIn()}>
        Sign in with Google
      </Button>;

    return <AppBar position="static" className={classes.appBar}>
      <Toolbar>
        <Link to="/" replace>
          <img src={logo} crossOrigin='anonymous' className={classes.logo} />
        </Link>
        <span className={classes.flexGrow}></span>
        {signInOrSignOut}
      </Toolbar>
      {auth.isSignedIn() ?
        <Tabs value={activeTab} onChange={this.setTab}>
          <Tab
            className={classes.tab}
            component={Link}
            label="Classes"
            to="/classes"
            value="/classes"
          />
          <Tab
            className={classes.tab}
            component={Link}
            label="Profile"
            to="/profile"
            value="/profile"
          />
        </Tabs> : null}
    </AppBar>;
  }
}

NavBar.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default compose(
  withStyles(styles),
  withAuth
)(NavBar);
