import process from 'node:process';

/**
 * Build core parse/fetch APIs shared by CJS and ESM entrypoints.
 *
 * @param {object} options
 * @param {(ics: string, cb?: (error: Error | null, parsedData: object) => void) => object | void} options.parseICSImpl - Calendar parser function.
 * @param {object} options.fsModule - fs module implementation.
 * @param {(url: string, options?: object) => Promise<{ok: boolean, status: number, statusText: string, text: () => Promise<string>}>} [options.fetchImpl] - Fetch implementation (defaults to global fetch).
 * @returns {{
 *   syncApi: object,
 *   asyncApi: object,
 *   autodetectApi: object,
 *   fromURL: (...args: Array<unknown>) => unknown,
 *   parseFile: (...args: Array<unknown>) => unknown,
 *   parseICS: (...args: Array<unknown>) => unknown,
 * }} Shared API object parts.
 */
function createCoreApi({parseICSImpl, fsModule, fetchImpl = fetch}) {
  let callbackDeprecationWarned = false;

  // Bridge promise-based internals to callback APIs while preserving callback error behavior.
  function promiseCallback(promise, callback) {
    if (!callback) {
      return promise;
    }

    const callCallback = (error, result) => {
      try {
        callback(error, result);
      } catch (callbackError) {
        queueMicrotask(() => {
          throw callbackError;
        });
      }
    };

    promise.then(
      returnValue => {
        callCallback(null, returnValue);
      },
      error => {
        callCallback(error, null);
      },
    );
  }

  function parseICSAsync(data) {
    return new Promise((resolve, reject) => {
      parseICSImpl(data, (error, parsedData) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(parsedData);
      });
    });
  }

  function warnCallbackDeprecation() {
    if (callbackDeprecationWarned) {
      return;
    }

    callbackDeprecationWarned = true;
    process.emitWarning(
      'parseICS(data, callback) is deprecated. Use parseICSAsync(data) instead.',
      {code: 'NODE-ICAL-CALLBACK', type: 'DeprecationWarning'},
    );
  }

  async function parseFileAsync(filename) {
    const data = await fsModule.promises.readFile(filename, 'utf8');
    return parseICSAsync(data);
  }

  async function fromURLAsync(url, options) {
    const fetchOptions = (options && typeof options === 'object') ? {...options} : {};
    const response = await fetchImpl(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const data = await response.text();
    return parseICSAsync(data);
  }

  const syncApi = {};
  const asyncApi = {};
  const autodetectApi = {};

  asyncApi.fromURL = function (url, options, callback) {
    if (typeof options === 'function' && callback === undefined) {
      callback = options;
      options = undefined;
    }

    return promiseCallback(fromURLAsync(url, options), callback);
  };

  asyncApi.parseFile = function (filename, callback) {
    return promiseCallback(parseFileAsync(filename), callback);
  };

  asyncApi.parseICS = function (data, callback) {
    return promiseCallback(parseICSAsync(data), callback);
  };

  asyncApi.parseICSAsync = parseICSAsync;

  syncApi.parseFile = function (filename) {
    const data = fsModule.readFileSync(filename, 'utf8');
    return parseICSImpl(data);
  };

  syncApi.parseICS = function (data) {
    return parseICSImpl(data);
  };

  autodetectApi.parseFile = function (filename, callback) {
    if (!callback) {
      return syncApi.parseFile(filename);
    }

    asyncApi.parseFile(filename, callback);
  };

  autodetectApi.parseICS = function (data, callback) {
    if (!callback) {
      return syncApi.parseICS(data);
    }

    warnCallbackDeprecation();
    asyncApi.parseICS(data, callback);
  };

  const {fromURL} = asyncApi;
  const {parseFile, parseICS} = autodetectApi;

  return {
    syncApi,
    asyncApi,
    autodetectApi,
    fromURL,
    parseFile,
    parseICS,
  };
}

export {createCoreApi};
