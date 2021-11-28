import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';

import {compose} from 'recompose';

const styles = theme => ({
  root: {
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  background: {
    maxWidth: '100%',
  }
});


class Home extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { classes } = this.props;
    const backgroundImageURL = `../static/images/landing.png`
    return <img className={classes.background} src={backgroundImageURL} />
  }
}

export default compose(
  withStyles(styles),
)(Home);
