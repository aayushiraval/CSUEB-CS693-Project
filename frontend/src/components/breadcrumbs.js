import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Breadcrumbs from '@material-ui/lab/Breadcrumbs';
import {Link} from 'react-router-dom';

const styles = theme => ({
  root: {
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingBottom: `${theme.spacing.unit}px`
  },
  paper: {
    backgroundColor: '#004190',
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
  },
  linkText: {
    color: '#FFFFFF',
    fontSize: 16,
    textTransfor: 'capitalize'
  },
});

function SimpleBreadcrumbs(props) {
  const { classes, crumbs } = props;

  const links = crumbs.map(({ label, href }) => {
    return <Link key={href} color="inherit" to={href}>
      <span className={classes.linkText}>{label}</span>
    </Link>
  })

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <Breadcrumbs aria-label="Breadcrumb">
          {links}
        </Breadcrumbs>
      </Paper>
    </div>
  );
}

SimpleBreadcrumbs.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SimpleBreadcrumbs);
