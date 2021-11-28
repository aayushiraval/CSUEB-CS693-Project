/**
 * Bundles the response status and the response body into one Promise
 * @param {Promise} response The fetch response.
 * @returns {Promise} A Promise that, when resolved, contains status and body.
 */
export function resolveFetchPromises(response) {
  return new Promise((resolve) => {
    response.json()
    .then((json) => {
      resolve({ status: response.status, ok: response.ok, json });
    });
  });
}


/**
 * Generic error handling - lets us handle errors in `.catch()`.
 * @param {Promise} response The resolved promise returned by resolveFetchPromises
 * @returns {Object} Data, if the response was successful (status code 200-299)
 * @throws {Error} with message `error.reason` (APIError)
 */
export function handleAPIResponse(response) {
  if (response.ok) {
    return response.json;
  } else {
    throw new Error(`${response.json.message}`);
  }
}

export function handleFetchDataError(error) {
  if (error.name == 'AbortError') {
    console.log('Request Aborted');
    return null;
  }
  // It should not be possible to reach this line since fetch() in fetchData()
  // catches every error and sends an alert() – except for AbortError exceptions
  throw error;
}

export function fetchData(endpoint, params, signal, additionalOptions) {
  const currentUser = gapi.auth2.getAuthInstance().currentUser.get();

  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${currentUser.getAuthResponse().access_token}`
    },
    ...(signal && { signal }),
    ...additionalOptions
  }

  let url = new URL(endpoint, API_HOST);
  if (params) {
    url.search = params;
  }

  return fetch(url, options)
  .then(resolveFetchPromises)
  .then(handleAPIResponse)
  .catch(error => {
    if (error.name == 'AbortError') {
      // Throw the error to catch it in fetchData() and prevent then() from
      // being run and potentially modify an unmounted component
      throw error;
    }
    alert(error);
  });
}

export function submitAPIData(endpoint, data, signal, method) {
  const currentUser = gapi.auth2.getAuthInstance().currentUser.get();
  const url = new URL(endpoint, API_HOST);

  const options = {
    method: method || "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentUser.getAuthResponse().access_token}`
    },
    body: JSON.stringify(data)
  }

  if (signal) {
    options['signal'] = signal;
  }

  return fetch(url, options)
    .then(resolveFetchPromises)
    .then(handleAPIResponse);
}

// added because {} is not falsy in Javascript
export function isObjEmpty(obj) {
  return Object.entries(obj).length === 0 && obj.constructor === Object;
}

export function convertDate(dateStr) {
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short'
  };
  if (dateStr.slice(-1) !== 'Z') {
    // Assume that the ISO timestamp is in UTC time, as all DB
    // timestamps should be.

    // Add the Zulu time locale to the date string.
    dateStr += 'Z';
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", options);
}