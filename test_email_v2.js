require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('--- INICIANDO TESTE DE EMAIL ---');
console.log('HOST:', process.env.EMAIL_HOST);
console.log('PORT:', process.env.EMAIL_PORT);
console.log('USER:', process.env.EMAIL_USER);
console.log('SECURE:', process.env.EMAIL_SECURE);

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    },
    debug: true, // Show debug output
    logger: true // Log information to console
});

transporter.verify(function (error, success) {
    if (error) {
        console.error("❌ ERRO NA VERIFICAÇÃO SMTP:");
        console.error(error);
    } else {
        console.log("✅ Servidor pronto para receber mensagens");

        // Tentar enviar um email real de teste
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Enviar para si mesmo
            subject: 'Teste de Diagnóstico GAP',
            text: 'Se você recebeu isso, a configuração está correta.'
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("❌ Erro ao enviar email de teste:", err);
            } else {
                console.log("✅ Email de teste enviado com sucesso!", info.messageId);
            }
        });
    }
});
