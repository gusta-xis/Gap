const jwt = require('jsonwebtoken');

/**
 * Middleware para proteger páginas HTML (server-side)
 * Verifica se o usuário está autenticado através do JWT no sessionStorage/cookie
 */
const authPageMiddleware = (req, res, next) => {
  try {
    // Tenta obter o token do header Authorization
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Se não encontrou no header, tenta nos cookies
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies.accessToken;
    }

    // Se não tem token, redireciona para login
    if (!token) {
      console.warn('⚠️ Acesso negado: Token não fornecido');
      return res.redirect('/login');
    }

    // Verifica se o token é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adiciona os dados do usuário na requisição
    req.user = decoded;

    // Permite continuar para a rota
    next();
  } catch (error) {
    console.error('❌ Erro na autenticação de página:', error.message);

    // Se o token é inválido ou expirado, redireciona para login
    return res.redirect('/login');
  }
};

/**
 * Middleware para verificar token de reset de senha
 * Valida se o token de reset é válido antes de permitir acesso à página
 */
const authResetPasswordMiddleware = (req, res, next) => {
  try {
    // Obtém o token da query string (?token=xxx)
    const resetToken = req.query.token;

    if (!resetToken) {
      console.warn('⚠️ Tentativa de acessar reset de senha sem token');
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Token Inválido - GAP</title>
          <style>
            body { font-family: 'Manrope', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f7f6; }
            .error-box { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 400px; }
            .error-box h1 { color: #A0430A; margin: 0 0 10px 0; }
            .error-box p { color: #666; margin-bottom: 20px; }
            .error-box a { display: inline-block; padding: 12px 24px; background: #A0430A; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .error-box a:hover { background: #8a3808; }
          </style>
        </head>
        <body>
          <div class="error-box">
            <h1>⚠️ Token Inválido</h1>
            <p>O link de redefinição de senha é inválido ou está incompleto.</p>
            <a href="/login">Voltar para Login</a>
          </div>
        </body>
        </html>
      `);
    }

    // Verifica se o token de reset é válido
    try {
      const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

      // Verifica se o token é especificamente para reset de senha
      if (decoded.type !== 'password-reset') {
        throw new Error('Token não é de reset de senha');
      }

      // Adiciona informações na requisição
      req.resetToken = resetToken;
      req.resetUserId = decoded.userId;

      next();
    } catch (jwtError) {
      console.warn('⚠️ Token de reset inválido ou expirado:', jwtError.message);
      return res.status(401).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Token Expirado - GAP</title>
          <style>
            body { font-family: 'Manrope', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f7f6; }
            .error-box { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 400px; }
            .error-box h1 { color: #A0430A; margin: 0 0 10px 0; }
            .error-box p { color: #666; margin-bottom: 20px; }
            .error-box a { display: inline-block; padding: 12px 24px; background: #A0430A; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .error-box a:hover { background: #8a3808; }
          </style>
        </head>
        <body>
          <div class="error-box">
            <h1>⏱️ Token Expirado</h1>
            <p>O link de redefinição de senha expirou. Solicite um novo link.</p>
            <a href="/login">Voltar para Login</a>
          </div>
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('❌ Erro no middleware de reset de senha:', error.message);
    return res.redirect('/login');
  }
};

module.exports = {
  authPageMiddleware,
  authPageMiddleware
};
