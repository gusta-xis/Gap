require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('--- Iniciando Teste de Email ---');
    console.log(`Host: ${process.env.EMAIL_HOST}`);
    console.log(`Port: ${process.env.EMAIL_PORT}`);
    console.log(`User: ${process.env.EMAIL_USER}`);
    console.log(`Secure: ${process.env.EMAIL_SECURE}`);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Tentando enviar email de teste...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Envia para si mesmo
            subject: 'Teste de Configuração GAP',
            text: 'Se você recebeu este email, sua configuração SMTP está correta!',
            html: '<h1>Sucesso!</h1><p>Se você recebeu este email, sua configuração SMTP está correta!</p>'
        });

        console.log('✅ SUCESSO! Email enviado.');
        console.log('ID da mensagem:', info.messageId);
        console.log('Response:', info.response);
    } catch (error) {
        console.error('❌ ERRO AO ENVIAR:');
        console.error(error);
    }
}

testEmail();
