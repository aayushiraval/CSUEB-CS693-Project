import React from 'react';
import { Link } from 'react-router-dom';

import { withStyles } from '@material-ui/core/styles';
import { compose } from 'recompose';

import { LECTURES_ENDPOINT } from '../api';
import useApiHook from '../apiHook';
import columns from './classTableColumns';
import { withSearch, PaginatedTable } from '../search';
import ScheduleClassButton from '../classes/scheduleClassButton';

const styles = theme => ({
});

function ClassList(props) {
  const {
    location, match, updateURLQueryParams, currPageIndex, currPageSize, selectedFilters, labelMaps
  } = props;
  const [ loading, lecturesResponse ] = useApiHook(LECTURES_ENDPOINT, location.search);

  const projectName = selectedFilters.get('project_name');

  const idButtonColumn = {
    Header: 'ID',
      accessor: 'id',
      Cell: row => (
        <Link
          to={{
            pathname: `${match.path}/${row.value}`,
            search: location.search,
            state: { index: row.index, isModal: true, ...lecturesResponse }
          }}
        >
          {row.value}
        </Link>
      ),
      width: 225
  };
    const meetingLinkColumn = {
        Header: 'Meeting Link',
        accessor: 'meeting_link',
        Cell: row => (
            <Link
                to={{
                    pathname: row.value
                }}
                target={"_blank"}
            >
                {row.value}
            </Link>
        ),
        width: 225
    };
  return (
    <React.Fragment>
      <ScheduleClassButton
        title='Schedule a Class'
        subtitle='Create a Meeting Link for the Class'
        btnTitle='Schedule Class'
      />
      <PaginatedTable
        loading={loading}
        location={location}
        columns={[
            idButtonColumn,
            meetingLinkColumn,
            ...columns,
        ]}
        currPageIndex={currPageIndex}
        currPageSize={currPageSize}
        updateURLQueryParams={updateURLQueryParams}
        totalResults={lecturesResponse.total_count}
        {...lecturesResponse}
      />
    </React.Fragment>
  )
}

export default compose(
  withStyles(styles),
  withSearch,
)(ClassList);
