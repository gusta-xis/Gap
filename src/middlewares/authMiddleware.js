const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    console.log('❌ Sem Authorization header');

    return res.status(401).json({ error: 'Token não fornecido!' });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    console.log('❌ Token vazio ou inválido');

    return res.status(401).json({ error: 'Token inválido!' });
  }

  console.log('🔍 Token recebido e validando...');

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('❌ JWT Verify Error:', err.message);


      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
      }

      return res.status(403).json({ error: 'Token inválido!' });
    }

    console.log('✅ Token válido e autenticado');

    req.user = decoded;



    next();
  });
};
