import React, { Component } from 'react';

import ReactTable from 'react-table';
import 'react-table/react-table.css';

class PaginatedTable extends Component {
  constructor(props) {
    super(props);
    this.onPageChange = this.onPageChange.bind(this);
    this.onPageSizeChange = this.onPageSizeChange.bind(this)
  }

  onPageChange(pageIndex) {
    // `next_page` and `prev_page` come from the API response
    const { location, next_page, prev_page, currPageIndex, updateURLQueryParams } = this.props;
    const pageId = pageIndex > currPageIndex ? next_page : prev_page;
    let params = new URLSearchParams(location.search);
    params.set('page', pageId);
    updateURLQueryParams(params);
  }

  onPageSizeChange(pageSize) {
    const { location, currPageIndex, currPageSize, updateURLQueryParams } = this.props;
    let params = new URLSearchParams(location.search);
    // maintain approximate spot in data
    const pageIndex = Math.floor(currPageIndex * currPageSize / pageSize);
    params.set('page', pageIndex);
    params.set('count', pageSize);
    updateURLQueryParams(params);
  }

  render() {
    const {
      currPageIndex, currPageSize, columns, loading, data, totalResults = 0,
      ...tableOptionOverrides
    } = this.props;
    return (
      <ReactTable
        manual
        columns={columns}
        keyField='id'
        pages={Math.ceil(totalResults / currPageSize)}
        page={currPageIndex}
        onPageChange={this.onPageChange}
        pageSizeOptions={[5, 10, 25, 50]}
        pageSize={currPageSize}
        onPageSizeChange={this.onPageSizeChange}
        showPageJump={false}
        loading={loading}
        data={data}
        {...tableOptionOverrides}/>
    );
  }
}

export default PaginatedTable;
