const nodemailer = require('nodemailer');

// Configuração do transporter usando variáveis de ambiente
// O usuário deve configurar EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS no .env
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para outros
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false // Em desenvolvimento/teste pode ajudar com certificados auto-assinados
    },
    debug: true, // Log detalhado do SMTP
    logger: true // Log no console
});

/**
 * Envia o código de recuperação por e-mail
 * @param {string} toEmail - Email do destinatário
 * @param {string} code - Código de 6 dígitos
 */
const sendResetCode = async (toEmail, code) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ Credenciais de email não configuradas no .env. Email não será enviado pelo nodemailer.');
        console.log(`📧 [SIMULAÇÃO] Para: ${toEmail} | Código: ${code}`);
        return;
    }

    const mailOptions = {
        from: `"Sistemas GAP" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Recuperação de Senha - Código de Verificação',
        html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #A0430A; text-align: center;">Recuperação de Senha</h2>
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no GAP.</p>
        <p>Use o código abaixo para completar o processo:</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${code}</span>
        </div>

        <p>Este código expira em 1 hora.</p>
        <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">Sistemas GAP - Sua gestão, sempre com você.</p>
      </div>
    `,
    };

    try {
        console.log(`📤 Tentando enviar email para: ${toEmail} via ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email enviado com sucesso: ${info.messageId}`);

        return info;
    } catch (error) {
        console.error('❌ Erro CRÍTICO ao enviar email:', error);
        console.error('🔍 Verifique suas credenciais no arquivo .env (EMAIL_USER, EMAIL_PASS)');
        throw error;
    }
};

module.exports = {
    sendResetCode,
};
