import React, {Component} from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import {withStyles} from "@material-ui/core/styles";
import {withSnackbar} from 'notistack';
import {compose} from 'recompose';
import {withAuth} from '../authContainer';
import {METHOD_PATCH, USER_ENDPOINT} from '../api';

import {ROLE_ADMIN, ROLE_STUDENT} from "../constants";
import ListItem from "@material-ui/core/ListItem";
import {Avatar, ListItemAvatar} from "@material-ui/core";
import List from "@material-ui/core/List/List";
import ListItemText from "@material-ui/core/ListItemText/ListItemText";
import {blue} from "@material-ui/core/colors";

const styles = theme => ({
  dialogPaper: {
    minHeight: '40vh',
    maxHeight: '40vh',
  },
  dialogContent: {
    overflow: 'visible'
  },
  button: {
    margin: theme.spacing.unit
  }
});

const roles = [ROLE_ADMIN, ROLE_STUDENT];

class SelectRoleDialogue extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: true,
      loading: false
    }
    this.submitRole = this.submitRole.bind(this);
    this.onDialogOpen = this.onDialogOpen.bind(this);
    this.onDialogClose = this.onDialogClose.bind(this);
    this.onDateChange = this.onDateChange.bind(this);
  }

  submitRole(role) {
    const {enqueueSnackbar} = this.props;
    Promise.all([
      this.props.auth.fetchMe()
    ]).then(([user]) => {
      var userId = user[0];
      console.log(userId);

      this.setState({loading: true});
      var data = {
        "roles": [role]
      }
      console.log(JSON.stringify(data));
      const endpoint = new URL(USER_ENDPOINT(userId), API_HOST);
      fetch(endpoint, {
        method: METHOD_PATCH,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.props.auth.generateAccessToken()}`
        },
        body: JSON.stringify(data)
      }).then(response => {
        enqueueSnackbar(
            `User Role Updated.`,
            {variant: 'success'}
        );
        this.setState({dialogOpen: false});
      }).catch(error => {
        enqueueSnackbar(error.message, {variant: 'error'});
      }).finally(() => {
        this.setState({loading: false});
      });
    })
  }

  onDialogOpen() {
    this.setState({ dialogOpen: true });
  }

  onDialogClose() {
    this.setState({ dialogOpen: false });
  }

  onDateChange(selectedDate) {
    this.setState({
          startDate: selectedDate.start,
          endDate: selectedDate.end
        }
    )
  }

  render() {
    const {
       classes, title
    } = this.props;
    const { dialogOpen, loading } = this.state;

    return (
      <React.Fragment>

        <Dialog classes={{ paper: classes.dialogPaper }}
          open={dialogOpen}
          onClose={this.onDialogClose}
          scroll="paper"
          fullWidth>
          <DialogTitle> {title} </DialogTitle>
          <DialogContent>
            <List sx={{ pt: 0 }}>
              {roles.map((role) => (
                <ListItem button onClick={() => this.submitRole(role)} key={role}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={role} />
                </ListItem>
              ))}
            </List>
          </DialogContent>
        </Dialog>
      </React.Fragment>
    )
  }
}

export default compose(
  withSnackbar,
  withStyles(styles),
  withAuth
)(SelectRoleDialogue);
