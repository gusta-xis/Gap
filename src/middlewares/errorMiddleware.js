module.exports = (err, req, res, next) => {
  // 1. Log técnico detalhado (para você corrigir o bug)
  console.error('🔥 Erro detalhado:', err.stack);

  // 2. Log visual no seu Logger (para ver no cronômetro)
  // Mostra a mensagem curta do erro
  if (req.passo) req.passo('💥', `ERRO CRÍTICO: ${err.message}`);

  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(status).json({
    sucesso: false,
    erro: message,
  });
};
