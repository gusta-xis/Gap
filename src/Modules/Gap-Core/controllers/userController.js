const userService = require('../services/userService');
const userModel = require('../models/userModel'); // Needed for direct admin access
const bcrypt = require('bcryptjs'); // Needed for direct hashing in admin creation
const jwt = require('jsonwebtoken'); // Needed for token generation
const { sendError } = require('../../../utils/errorHandler');

module.exports = {
  login(req, res) {
    const { login, senha } = req.body; // Aceita 'login' em vez de 'email'

    if (!login || !senha) {
      return res.status(400).json({ error: 'Login e senha são obrigatórios' });
    }

    // Busca por email OU credencial
    userService.findByEmailOrCredential(login, async (err, user) => {
      if (err) return sendError(res, err);

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      if (!user.senha) {
        return res.status(403).json({ error: 'Conta não ativada. Use a opção de Primeiro Acesso (Continuar).' });
      }

      const isMatch = await bcrypt.compare(senha, user.senha);
      if (!isMatch) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, credential: user.credential },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login realizado com sucesso',
        token,
        refreshToken,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          credential: user.credential
        }
      });
    });
  },

  checkCredential(req, res) {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Credencial obrigatória' });

    // Limpa input
    const cred = credential.trim().toUpperCase();

    userModel.findByEmailOrCredential(cred, (err, user) => {
      if (err) return sendError(res, err);

      // Para segurança, se não achar, retornamos 404
      if (!user) return res.status(404).json({ error: 'Credencial não encontrada' });

      // Se achou, verifica se é primeiro acesso (senha null)
      return res.json({
        exists: true,
        firstAccess: user.senha === null,
        nome: user.nome
      });
    });
  },

  activateCredential(req, res) {
    const { credential, newPassword } = req.body;
    if (!credential || !newPassword) return res.status(400).json({ error: 'Dados incompletos' });

    const cred = credential.trim().toUpperCase();

    userModel.findByEmailOrCredential(cred, (err, user) => {
      if (err) return sendError(res, err);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

      // Só permite ativar se senha for NULL
      if (user.senha !== null) {
        return res.status(400).json({ error: 'Esta conta já está ativa. Faça login com senha.' });
      }

      bcrypt.hash(newPassword, 10, (errHash, hashedPassword) => {
        if (errHash) return sendError(res, errHash);

        // Atualiza senha
        userModel.updatePassword(user.id, hashedPassword, (upErr) => {
          if (upErr) return sendError(res, upErr);
          res.json({ message: 'Conta ativada com sucesso! Faça login.' });
        });
      });
    });
  },

  refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token obrigatório'
      });
    }

    userService.refreshAccessToken(refreshToken, (err, result) => {
      if (err) return sendError(res, err);

      return res.json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    });
  },

  create(req, res) {


    userService.create(req.body, (err, result) => {
      if (err) return sendError(res, err);



      return res.status(201).json({
        message: 'Usuário criado com sucesso',
        id: result.insertId
      });
    });
  },

  findAll(req, res) {
    userService.findAll((err, r) => {
      if (err) return sendError(res, err);
      return res.json(r);
    });
  },

  findById(req, res) {
    if (parseInt(req.params.id, 10) !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    userService.findById(req.params.id, (err, r) => {
      if (err) return sendError(res, err);

      if (!r) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      return res.json(r);
    });
  },

  update(req, res) {
    const userId = parseInt(req.params.id, 10);
    userService.update(userId, req.body, (err, r) => {
      if (err) return sendError(res, err);

      return res.json({
        message: 'Usuário atualizado com sucesso'
      });
    });
  },

  delete(req, res) {
    userService.delete(req.params.id, (err, r) => {
      if (err) return sendError(res, err);

      return res.json({
        message: 'Usuário deletado com sucesso'
      });
    });
  },

  forgotPassword(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email obrigatório' });
    }

    userService.generatePasswordResetCode(email, (err, result) => {
      if (err) return sendError(res, err);

      return res.json({
        message: result.message
        // token: result.token (Removido, usamos código por email agora)
      });
    });
  },

  verifyCode(req, res) {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email e código são obrigatórios' });
    }

    userService.verifyResetCode(email, code, (err, result) => {
      if (err) return sendError(res, err);
      return res.json({ valid: true });
    });
  },

  resetPassword(req, res) {
    const { email, code, newPassword } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, código e nova senha são obrigatórios' });
    }

    userService.resetPassword(email, code, newPassword, ipAddress, (err, result) => {
      if (err) return sendError(res, err);

      return res.json({ message: 'Senha redefinida com sucesso' });
    });
  },

  // --- Admin Functions ---

  adminListUsers(req, res) {
    // userService.findAll agora retorna role/credential
    userModel.findAll((err, users) => {
      if (err) return sendError(res, err);
      // Sanitiza
      const cleanUsers = users.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        role: u.role,
        credential: u.credential
      }));
      res.json(cleanUsers);
    });
  },

  adminCreateUser(req, res) {
    const { nome, role, email } = req.body;

    // Validação de Hierarquia
    if (role === 'manager' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Apenas Admin Geral pode criar Gerentes.' });
    }
    if (role === 'admin' && !['manager', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Apenas Gerentes ou Admin Geral podem criar Administradores.' });
    }

    // Users podem ser criados por qualquer um desses cargos (já verificado pelo middleware, mas reforçando)
    if (role === 'user' && !['admin', 'manager', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão insuficiente.' });
    }

    // Admin/Manager novo começa sem senha (ativação no primeiro acesso)
    // Email é obrigatório agora
    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

    const userData = { nome, senha: null, role, email };

    if (role === 'admin' || role === 'manager' || role === 'super_admin') {
      // Cria admin/gerente com credencial
      userModel.createAdmin(userData, (err, result) => {
        if (err) return sendError(res, err);
        res.status(201).json({
          message: `${role === 'manager' ? 'Gerente' : 'Administrador'} criado com sucesso (Aguardando Ativação)`,
          credential: result.credential
        });
      });
    } else {
      // Cria usuário comum
      // Usuário comum ainda precisa de senha? Se for por email, talvez deva ter senha inicial ou fluxo de convite.
      // Por enquanto, mantenho logica antiga para usuario comum ou defino senha padrao?
      // O codigo original recebia senha no body. Vamos manter senha obrigatória para user comum por enquanto
      // para não quebrar fluxo de cadastro publico.
      const { senha } = req.body;
      if (!senha) return res.status(400).json({ error: 'Senha obrigatória para usuários comuns' });

      bcrypt.hash(senha, 10, (errHash, hashedPassword) => {
        if (errHash) return sendError(res, errHash);
        userData.senha = hashedPassword;

        userModel.create(userData, (err, result) => {
          if (err) return sendError(res, err);
          res.status(201).json({ message: 'Usuário criado com sucesso' });
        });
      });
    }
  },

  adminDeleteUser(req, res) {
    const id = parseInt(req.params.id);
    if (id === req.user.id) return res.status(400).json({ error: 'Não pode excluir a si mesmo.' });

    // Verifica alvo antes de excluir
    userModel.findById(id, (err, targetUser) => {
      if (err) return sendError(res, err);
      if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });

      const myRole = req.user.role;
      const targetRole = targetUser.role;

      // Regras de Hierarquia de Exclusão
      let canDelete = false;

      if (myRole === 'super_admin') {
        canDelete = true; // Pode deletar qualquer um (menos a si mesmo, já checado)
      } else if (myRole === 'manager') {
        // Gerente pode deletar Admin e User
        if (['admin', 'user'].includes(targetRole)) canDelete = true;
      } else if (myRole === 'admin') {
        // Admin pode deletar apenas User
        if (targetRole === 'user') canDelete = true;
      }

      if (!canDelete) {
        return res.status(403).json({ error: 'Você não tem permissão para excluir este usuário.' });
      }

      userModel.remove(id, (delErr) => {
        if (delErr) return sendError(res, delErr);
        res.json({ message: 'Usuário excluído com sucesso' });
      });
    });
  },

  adminUpdateRole(req, res) {
    const id = parseInt(req.params.id);
    const { role } = req.body;

    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Permissão insuficiente.' });
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Role inválido.' });

    userModel.update(id, { role }, (err) => {
      if (err) return sendError(res, err);
      res.json({ message: `Role atualizado para ${role}` });
    });
  },
};
