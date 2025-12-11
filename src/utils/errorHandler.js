function sendError(res, err) {
  const status = err && err.status ? err.status : 500;
  const message = err && err.message ? err.message : 'Erro interno do servidor';
  return res.status(status).json({ error: message });
}

module.exports = { sendError };
