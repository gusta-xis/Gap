const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // 1. Se não tiver token, barra a requisição
  if (!authHeader) {
    console.log('❌ Sem Authorization header');
    if (req.passo) req.passo('🚫', 'Auth falhou: Token não fornecido');
    return res.status(401).json({ error: 'Token não fornecido!' });
  }

  // Extrai o token do header
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    console.log('❌ Token vazio ou inválido');
    if (req.passo) req.passo('🚫', 'Auth falhou: Token inválido');
    return res.status(401).json({ error: 'Token inválido!' });
  }

  console.log('🔍 Token recebido e validando...');

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    // 2. Se token for falso/vencido, barra
    if (err) {
      console.log('❌ JWT Verify Error:', err.message);
      if (req.passo) req.passo('🚫', 'Auth falhou: Token inválido/expirado');
      
      // Diferencia entre token vencido e inválido
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
      }
      
      return res.status(403).json({ error: 'Token inválido!' });
    }

    console.log('✅ Token válido e autenticado');
    
    // 3. Sucesso! Salva o usuário decodificado no request
    req.user = decoded;

    if (req.passo)
      req.passo('🔑', `Auth OK: Usuário autenticado liberado`);

    next();
  });
};
