module.exports = (err, req, res, next) => {
  console.error('🔥 Erro detalhado:', err.stack);



  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(status).json({
    sucesso: false,
    erro: message,
  });
};
