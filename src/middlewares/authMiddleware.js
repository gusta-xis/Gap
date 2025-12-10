const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // 1. Se não tiver token, avisa o Logger e barra
  if (!authHeader) {
    console.log('❌ Sem Authorization header');
    if (req.passo) req.passo('🚫', 'Auth falhou: Token não fornecido');
    return res.status(401).json({ error: 'Token não fornecido!' });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('🔍 Token recebido:', token.substring(0, 20) + '...');
  console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET);

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    // 2. Se token for falso/vencido, avisa o Logger e barra
    if (err) {
      console.log('❌ JWT Verify Error:', err.message);
      if (req.passo) req.passo('🚫', 'Auth falhou: Token inválido/expirado');
      return res.status(403).json({ error: 'Token inválido!' });
    }

    console.log('✅ Token válido para user:', decoded.id);
    // 3. Sucesso!
    req.user = decoded;

    if (req.passo)
      req.passo('🔑', `Auth OK: Usuário ${decoded.id || '?'} liberado`);

    next();
  });
};
