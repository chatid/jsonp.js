// [jsonp.js](http://neocotic.com/jsonp.js) 1.0.0
// (c) 2012 Alasdair Mercer
// Freely distributable under the MIT license.
// For all details and documentation:
// <http://neocotic.com/jsonp.js>

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define('jsonp', factory);
  else root.JSON = factory();
}(this, function() {

  // Private variables
  // -----------------

  var
    // Initially the current time but incremented by each call to `get` in order
    // to ensure unique identifiers.
    id            = (new Date()).getTime(),
    // Timeout IDs for removing callback functions where the `timeout` setting
    // has been set.
    // IDs should be removed once either the callback is called or the request
    // has timed out (as specified by the `timeout` setting).
    timers        = {},
    head          = document.head || document.getElementsByTagName('head')[0] ||
                    document.documentElement

  // Private functions
  // -----------------

  // Simplest method for appending parameters to an existing query string.
  function paramify(data) {
    var query = '';
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        query += '&' + key + '=' + data[key];
      }
    }
    return query;
  }

  function cleanup(id, script) {
    // Clear any timeout.
    clearTimeout(timers[id]);
    // Delete all references.
    delete timers[id];
    delete JSONP.__callbacks__[id];
    // Remove the script element from head.
    if (head && script.parentNode) head.removeChild(script);
    script = null;
  }

  // JSONP setup
  // -----------

  // Build the publicly exposed API.
  var JSONP = window.__cidf_jsonp = {

    // Public Constants
    // ----------------

    // Current version of `JSONP`.
    VERSION: '1.0.0',

    // Public Variables
    // ----------------

    // Callback functions for activate JSONP requests.
    // Functions should removed once they have been called. If the `timeout`
    // setting has been set and the function has not yet been called, that
    // function will be removed.
    // This property must be public since the callback is called in global
    // context.
    __callbacks__: {},

    // Name of the callback parameter included in the query string.
    callbackName: 'callback',

    // Timeout (in milliseconds) for the request. Requests will only be timed
    // out if this is greater than zero.
    timeout: 0,

    // JSONP functions
    // ---------------

    // Send the data provided to the URL and pass the callback function as a
    // parameter to be called under the specified context.
    // Only the `url` argument is required.
    get: function (url, data, callback) {
      var options = {},
          success = callback || function(){},
          error = function(){},
          context = this;

      if (typeof url === 'object') {
        options = url;
        url = options.url;
        data = options.data;
        success = options.success || success;
        error = options.error || error;
        context = options.context || context;
      }

      var script = document.createElement('script');

      id++;

      JSONP.__callbacks__[id] = function() {
        cleanup(id, script);
        success.apply(context, arguments);
      };

      // Build query string.
      url += (url.indexOf('?') === -1) ? '?' : '&';
      url += JSONP.callbackName + '=' +
             encodeURIComponent('__cidf_jsonp.__callbacks__[' + id + ']');
      url += paramify(data);

      if (url.length >= 2083) return;

      script.src = url;

      // Add script element to head, while preventing IE6 bug.
      head.insertBefore(script, head.firstChild);

      // Create timer if `timeout` setting is set.
      (function(id, script, error, context) {
        if (!JSONP.timeout) return;
        timers[id] = setTimeout(function() {
          cleanup(id, script);
          error.call(context, 'timeout');
        }, JSONP.timeout);
      })(id, script, error, context);
    }

  };

  // Support
  // -------

  return JSONP;

}));
