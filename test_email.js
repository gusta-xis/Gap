require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testando conexão SMTP...');

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
    }
});

transporter.verify(function (error, success) {
    if (error) {
        console.error("❌ Erro na conexão SMTP:");
        console.error(error);
        process.exit(1);
    } else {
        console.log("✅ Conexão SMTP estabelecida com sucesso! As credenciais estão corretas.");
        process.exit(0);
    }
});
