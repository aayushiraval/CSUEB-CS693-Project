import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from 'notistack';
import { compose } from 'recompose';
import { submitAPIData, convertToAPIFilters } from '../util';
import { withAuth } from '../authContainer';
import { ROLE_ADMIN } from '../constants';
import { LECTURES_ENDPOINT } from '../api';
import DatetimeRangePicker from "react-datetime-range-picker";

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

class ScheduleClassButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false,
      loading: false,
      name: null,
      description: null,
      provenance_url: null,
    }
    this.addLecture = this.addLecture.bind(this);
    this.onDialogOpen = this.onDialogOpen.bind(this);
    this.onDialogClose = this.onDialogClose.bind(this);
    this.onDateChange = this.onDateChange.bind(this);
  }

  addLecture() {
    const { enqueueSnackbar } = this.props;
    const { name, description, startDate, endDate } = this.state;
    const data = { name, description, start_date: startDate, end_date: endDate};

    this.setState({ loading: true });
    submitAPIData(LECTURES_ENDPOINT, data)
      .then(response => {
        enqueueSnackbar(
          `Class successfully scheduled."`,
          { variant: 'success' }
        );
        this.setState({ dialogOpen: false, datasetId: response.id });
      }).catch(error => {
        enqueueSnackbar(error.message, { variant: 'error' });
        this.setState({ datasetId: null });
      }).finally(() => {
        this.setState({ loading: false });
      });
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
    console.log(this.state);
  }


  render() {
    const {
       classes, selectedFilters = [], auth, totalResults = 0,
        datasetKind,
      title, subtitle, btnTitle
    } = this.props;
    const { startDate, endDate, dialogOpen, loading } = this.state;

    let tooltipMessage = '';

    return (
      <React.Fragment>
        { auth.hasRole(ROLE_ADMIN) ?
          <span data-tip={tooltipMessage}>
            <Button
                variant="contained"
                color="primary"
                className={classes.button}
                onClick={this.onDialogOpen}>
              {`${btnTitle}`}
            </Button>
          </span> : null
        }
        <Dialog classes={{ paper: classes.dialogPaper }}
          open={dialogOpen}
          onClose={this.onDialogClose}
          scroll="paper"
          fullWidth>
          <DialogTitle> {title} </DialogTitle>
          <DialogContent>
            <DialogContentText>
                {subtitle}
            </DialogContentText>
            <TextField
              fullWidth
              required
              onChange={(event) => this.setState({ name: event.target.value })}
              label="Name"/>
            <TextField
              fullWidth
              multiline
              onChange={(event) => this.setState({ description: event.target.value })}
              label="Description"/>
            <DatetimeRangePicker onChange={this.onDateChange}/>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.onDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={this.addLecture} color="primary" disabled={loading}>
              {btnTitle}
            </Button>
          </DialogActions>
        </Dialog>
      </React.Fragment>
    )
  }
}

export default compose(
  withSnackbar,
  withStyles(styles),
  withAuth
)(ScheduleClassButton);
