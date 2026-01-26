const auditService = require('./auditService');
const emailService = require('./emailService');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = {
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

        const accessToken = jwt.sign(
          {
            id: user.id,
            email: user.email,
            type: 'access'
          },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );

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

  refreshAccessToken: (refreshToken, callback) => {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
      );

      if (decoded.type !== 'refresh') {
        return callback({
          status: 403,
          message: 'Token inválido para refresh'
        });
      }

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
        refreshToken
      });
    } catch (err) {
      console.error('❌ Erro ao fazer refresh do token:', err.message);
      return callback({
        status: 401,
        message: 'Refresh token inválido ou expirado'
      });
    }
  },

  create: (data, cb) => {
    if (Array.isArray(data)) {
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

    bcrypt.hash(data.senha, 10, (err, hash) => {
      if (err) {
        console.error('❌ Erro ao fazer hash da senha:', err.message);
        return cb(err);
      }

      const toSave = { ...data, senha: hash };
      userModel.create(toSave, cb);
    });
  },

  findAll: (cb) => userModel.findAll(cb),

  findById: (id, cb) => userModel.findById(id, cb),

  update: (id, data, callback) => {
    // Se não for atualizar senha, segue fluxo normal
    if (!data.senha) {
      return userModel.update(id, data, callback);
    }

    // Se for atualizar senha, exige senhaAtual
    if (!data.senhaAtual) {
      return callback({
        status: 400,
        message: 'Senha atual é obrigatória para definir uma nova senha'
      });
    }

    // Busca usuário para comparar hash
    userModel.findById(id, (err, user) => {
      // Nota: findById do model atual pode não retornar a senha (segurança).
      // Vamos usar findByEmail se necessário ou garantir que temos acesso ao hash.
      // O model findById retorna: id, nome, email. NÃO retorna senha.
      // Precisamos buscar a senha.

      // Solução: Usar findByEmail (que retorna senha) se tivermos o email, 
      // mas aqui só temos o ID. 
      // Vamos criar um método privado ou query direta aqui? 
      // Melhor: userModel.findByEmail exige email.
      // Vamos fazer uma query direta pelo ID para pegar a senha APENAS neste caso,
      // ou melhorar o model.

      // Como não quero alterar o model agora se possível, vou tentar:
      // 1. Pegar user pelo ID (já feito acima, mas sem senha).
      // 2. Pegar user pelo Email (que retorna senha).

      if (err) return callback(err);
      if (!user) return callback({ status: 404, message: 'Usuário não encontrado' });

      userModel.findByEmail(user.email, (err2, userWithPass) => {
        if (err2) return callback(err2);

        bcrypt.compare(data.senhaAtual, userWithPass.senha, (compareErr, same) => {
          if (compareErr) return callback(compareErr);
          if (!same) {
            return callback({ status: 401, message: 'Senha atual incorreta' });
          }

          // Senha ok, hash da nova senha
          bcrypt.hash(data.senha, 10, (hashErr, hash) => {
            if (hashErr) return callback(hashErr);
            const toUpdate = { ...data, senha: hash };
            delete toUpdate.senhaAtual; // remove campo auxiliar
            userModel.update(id, toUpdate, callback);
          });
        });
      });
    });
  },

  delete: (id, cb) => userModel.remove(id, cb),

  generatePasswordResetCode: (email, callback) => {
    userModel.findByEmail(email, (err, user) => {
      if (err) {
        console.error('❌ Erro ao buscar usuário:', err.message);
        return callback({ status: 500, message: 'Erro ao processar recuperação' });
      }

      if (!user) {
        // Auditoria de tentativa falha (email não existe) - opcional
        // auditService.log(null, 'PASSWORD_RESET_REQUEST_FAILED', 'UNKNOWN', `Email not found: ${email}`);

        // Retornamos sucesso vago por segurança
        return callback(null, { message: 'Se o email existir, um código de recuperação será enviado.' });
      }

      // Gera código de 6 dígitos aleatório
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Expira em 1 hora
      const expires = new Date(Date.now() + 3600000);

      userModel.saveResetCode(email, code, expires, async (err) => {
        if (err) {
          console.error('❌ Erro ao salvar código:', err.message);
          return callback({ status: 500, message: 'Erro ao gerar código' });
        }

        // Auditoria
        auditService.log(user.id, 'PASSWORD_RESET_REQUEST', 'UNKNOWN', 'Code generated');

        // Envia email
        try {
          await emailService.sendResetCode(email, code);
          callback(null, { message: 'Se o email existir, um código de recuperação será enviado.' });
        } catch (emailErr) {
          console.error('❌ Erro no envio de email:', emailErr);
          // Ainda retornamos sucesso para o usuário não saber que falhou o email (ou retornar erro 500?)
          // Melhor retornar erro genérico
          callback({ status: 500, message: 'Erro ao enviar email de recuperação' });
        }
      });
    });
  },

  verifyResetCode: (email, code, callback) => {
    userModel.validateResetCode(email, code, (err, user) => {
      if (err) return callback(err);

      if (!user) {
        auditService.log(null, 'CODE_VERIFICATION_FAILED', 'UNKNOWN', `Email: ${email}`);
        return callback({ status: 400, message: 'Código inválido ou expirado' });
      }

      auditService.log(user.id, 'CODE_VERIFICATION_SUCCESS', 'UNKNOWN', 'Code verified');
      callback(null, { valid: true });
    });
  },

  resetPassword: (email, code, newPassword, ipAddress, callback) => {
    userModel.validateResetCode(email, code, (err, user) => {
      if (err) return callback({ status: 500, message: 'Erro interno' });

      if (!user) {
        auditService.log(null, 'PASSWORD_RESET_FAILED', ipAddress, `Invalid code/email: ${email}`);
        return callback({ status: 400, message: 'Código inválido ou expirado' });
      }

      bcrypt.hash(newPassword, 10, (hashErr, hash) => {
        if (hashErr) return callback({ status: 500, message: 'Erro ao processar senha' });

        userModel.updatePassword(user.id, hash, (updateErr) => {
          if (updateErr) return callback({ status: 500, message: 'Erro ao atualizar senha' });

          // Limpa o código usado
          userModel.clearResetCode(email, () => { });

          auditService.log(user.id, 'PASSWORD_RESET_SUCCESS', ipAddress, 'Password changed');

          callback(null, { message: 'Senha redefinida com sucesso' });
        });
      });
    });
  },
};
