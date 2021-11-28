import { useState, useEffect } from 'react';

import { fetchData, handleFetchDataError } from './util';

export default function useApiHook(endpoint, params) {
  const [ response, setResponse ] = useState({});
  const [ loading, setLoading ] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    setLoading(true);
    fetchData(endpoint, params, signal).then(res => {
      setResponse(res);
      setLoading(false);
    }).catch(error => handleFetchDataError(error));

    return function cleanup() {
      abortController.abort();
    }
  }, [ endpoint, params ]);

  return [ loading, response ];
}
