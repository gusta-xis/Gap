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

  generatePasswordResetToken: (email, callback) => {
    userModel.findByEmail(email, (err, user) => {
      if (err) {
        console.error('❌ Erro ao buscar usuário:', err.message);
        return callback({
          status: 500,
          message: 'Erro ao processar recuperação'
        });
      }

      if (!user) {
        return callback(null, {
          message: 'Se o email existir, um link será enviado.'
        });
      }

      const resetToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          type: 'reset'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      callback(null, {
        token: resetToken,
        message: 'Token de recuperação gerado'
      });
    });
  },

  resetPassword: (token, newPassword, callback) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return callback({
          status: 401,
          message: 'Token inválido ou expirado'
        });
      }

      if (decoded.type !== 'reset') {
        return callback({
          status: 401,
          message: 'Token inválido'
        });
      }

      bcrypt.hash(newPassword, 10, (hashErr, hash) => {
        if (hashErr) {
          console.error('❌ Erro ao gerar hash:', hashErr.message);
          return callback({
            status: 500,
            message: 'Erro ao processar nova senha'
          });
        }

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
