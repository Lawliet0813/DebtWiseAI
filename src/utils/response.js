function sendJson(res, statusCode, payload) {
  const data = payload === undefined ? null : payload;
  const body = data === null ? '' : JSON.stringify(data);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (body.length > 0) {
    res.end(body);
  } else {
    res.end();
  }
}

function sendError(res, error) {
  const status = error.statusCode || 500;
  const payload = {
    error: {
      message: error.message || 'Unexpected error occurred.',
    },
  };
  if (error.details) {
    payload.error.details = error.details;
  }
  sendJson(res, status, payload);
}

export {
  sendJson,
  sendError,
};
