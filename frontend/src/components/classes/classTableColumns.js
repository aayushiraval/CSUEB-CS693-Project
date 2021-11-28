import { convertDate } from '../util';

const columns = [
  {
    Header: 'Class Name',
    accessor: 'name',
  }, {
    Header: 'Description',
    accessor: 'description',
  }, {
    Header: 'Instructor Name',
    accessor: 'instructor_name'
  }, {
    Header: 'Start Date',
    id: 'start_date',
    accessor: row => convertDate(row.start_date)
  }, {
    Header: 'End Date',
    id: 'end_date',
    accessor: row => convertDate(row.end_date)
  }
];

export default columns;
