// Central error handler. Route handlers should call next(err) on failure
// rather than shaping error responses themselves, so the response shape
// (and future logging/observability hooks — see spec section 56) stays
// in one place.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[SERVER ERROR]', err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({ error: message });
}

function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

module.exports = { errorHandler, notFound };
