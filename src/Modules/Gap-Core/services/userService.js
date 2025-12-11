// ========================================================
// USER SERVICE - COM REFRESH TOKEN SEGURO
// Access Token: 15 minutos | Refresh Token: 7 dias
// ========================================================

const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = {
  /**
   * Login - Retorna Access Token + Refresh Token
   */
  login: (email, senha, callback) => {
    userModel.findByEmail(email, (err, user) => {
      if (err) {
        console.error('❌ Erro ao buscar usuário:', err.message);
        return callback({ 
          status: 500, 
          message: 'Erro ao processar login' 
        });
      }

      if (!user) {
        return callback({ 
          status: 401, 
          message: 'Credenciais inválidas' 
        });
      }

      // Compara o hash da senha armazenada com a senha fornecida
      bcrypt.compare(senha, user.senha, (compareErr, same) => {
        if (compareErr) {
          console.error('❌ Erro ao verificar senha:', compareErr.message);
          return callback({ 
            status: 500, 
            message: 'Erro ao processar login' 
          });
        }

        if (!same) {
          return callback({ 
            status: 401, 
            message: 'Credenciais inválidas' 
          });
        }

        // ===== GERAR ACCESS TOKEN (15 MINUTOS) =====
        const accessToken = jwt.sign(
          { 
            id: user.id, 
            email: user.email,
            type: 'access'
          },
          process.env.JWT_SECRET,
          { expiresIn: '15m' } // Alterado de '1h' para '15m'
        );

        // ===== GERAR REFRESH TOKEN (7 DIAS) =====
        const refreshToken = jwt.sign(
          { 
            id: user.id, 
            email: user.email,
            type: 'refresh'
          },
          process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
          { expiresIn: '7d' }
        );

        callback(null, {
          accessToken,
          refreshToken,
          user: { 
            id: user.id, 
            nome: user.nome, 
            email: user.email 
          },
        });
      });
    });
  },

  /**
   * Refresh Token - Gera novo Access Token
   */
  refreshAccessToken: (refreshToken, callback) => {
    try {
      // Verifica o refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
      );

      // Verifica se é realmente um refresh token
      if (decoded.type !== 'refresh') {
        return callback({
          status: 403,
          message: 'Token inválido para refresh'
        });
      }

      // Gera novo access token
      const newAccessToken = jwt.sign(
        { 
          id: decoded.id, 
          email: decoded.email,
          type: 'access'
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      callback(null, {
        accessToken: newAccessToken,
        refreshToken // Refresh token continua o mesmo
      });
    } catch (err) {
      console.error('❌ Erro ao fazer refresh do token:', err.message);
      return callback({
        status: 401,
        message: 'Refresh token inválido ou expirado'
      });
    }
  },

  /**
   * Cria novo usuário (com hash de senha)
   */
  create: (data, cb) => {
    // Se for uma lista, hashear todas as senhas antes de inserir
    if (Array.isArray(data)) {
      // Usa Promise.all para hashear em paralelo
      Promise.all(
        data.map((u) =>
          bcrypt.hash(u.senha, 10).then((hash) => ({ ...u, senha: hash }))
        )
      )
        .then((hashedList) => userModel.createMany(hashedList, cb))
        .catch((err) => {
          console.error('❌ Erro ao fazer hash das senhas:', err.message);
          cb(err);
        });
      return;
    }

    // Caso único
    bcrypt.hash(data.senha, 10, (err, hash) => {
      if (err) {
        console.error('❌ Erro ao fazer hash da senha:', err.message);
        return cb(err);
      }

      const toSave = { ...data, senha: hash };
      userModel.create(toSave, cb);
    });
  },

  /**
   * Encontra todos os usuários
   */
  findAll: (cb) => userModel.findAll(cb),

  /**
   * Encontra usuário por ID
   */
  findById: (id, cb) => userModel.findById(id, cb),

  /**
   * Atualiza usuário
   */
  update: (id, data, cb) => userModel.update(id, data, cb),

  /**
   * Deleta usuário
   */
  delete: (id, cb) => userModel.remove(id, cb),

  /**
   * Gera token de recuperação de senha (válido por 1 hora)
   */
  generatePasswordResetToken: (email, callback) => {
    userModel.findByEmail(email, (err, user) => {
      if (err) {
        console.error('❌ Erro ao buscar usuário:', err.message);
        return callback({ 
          status: 500, 
          message: 'Erro ao processar recuperação' 
        });
      }

      // Por segurança, não revelamos se o email existe ou não
      if (!user) {
        // Retorna sucesso mesmo se usuário não existe (previne enumeração de emails)
        return callback(null, { 
          message: 'Se o email existir, um link será enviado.' 
        });
      }

      // Gera token de reset válido por 1 hora
      const resetToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          type: 'reset'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Em produção, aqui você enviaria o email com o link
      // Por ora, retornamos o token para teste
      callback(null, { 
        token: resetToken,
        message: 'Token de recuperação gerado'
      });
    });
  },

  /**
   * Reseta senha usando token de recuperação
   */
  resetPassword: (token, newPassword, callback) => {
    // Verifica se o token é válido
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return callback({ 
          status: 401, 
          message: 'Token inválido ou expirado' 
        });
      }

      // Verifica se é um token de reset
      if (decoded.type !== 'reset') {
        return callback({ 
          status: 401, 
          message: 'Token inválido' 
        });
      }

      // Hash da nova senha
      bcrypt.hash(newPassword, 10, (hashErr, hash) => {
        if (hashErr) {
          console.error('❌ Erro ao gerar hash:', hashErr.message);
          return callback({ 
            status: 500, 
            message: 'Erro ao processar nova senha' 
          });
        }

        // Atualiza a senha no banco
        userModel.updatePassword(decoded.id, hash, (updateErr) => {
          if (updateErr) {
            return callback({ 
              status: 500, 
              message: 'Erro ao atualizar senha' 
            });
          }

          callback(null, { 
            message: 'Senha redefinida com sucesso' 
          });
        });
      });
    });
  },
};
