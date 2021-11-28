import React from 'react';

import PaginatedTable from './paginatedTable';

/**
 * A component wrapper for paginating with filters.
 * Required props:
 *   location (from react router)
 *   history (from react router)
 *   match (from react router)
 */
export function withSearch(WrappedComponent) {
  return function SearchHOC(props) {
    const { history, location } = props;

    const updateURLQueryParams = (params) => {
      history.push({ search: params.toString() });
    }

    let selectedFilters = new URLSearchParams(location.search);
    const currPageIndex = parseInt(selectedFilters.get('page')) || 0;
    const currPageSize = parseInt(selectedFilters.get('count')) || 50;
    // semantics - selectedFilters is used throughout expecting pagination params to be absent
    selectedFilters.delete('page');
    selectedFilters.delete('count')

    return (
      <WrappedComponent
        {...props}
        selectedFilters={selectedFilters}
        currPageIndex={currPageIndex}
        currPageSize={currPageSize}
        updateURLQueryParams={updateURLQueryParams}
      />
    );
  }
}

export { PaginatedTable };
