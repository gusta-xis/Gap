require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('--- Iniciando Teste de Email ---');
    console.log('Carregando configurações do .env...');
    console.log(`HOST: ${process.env.EMAIL_HOST}`);
    console.log(`USER: ${process.env.EMAIL_USER}`);
    console.log(`PASS: ${process.env.EMAIL_PASS ? '****** (Carregado)' : 'NÃO CARREGADO'}`);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // Nodemailer remove espacos automaticamente se necessario ou aceita string com espacos
        },
        tls: { rejectUnauthorized: false }
    });

    try {
        console.log('Tentando enviar email de teste...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Envia para si mesmo
            subject: 'Teste de Configuração GAP',
            text: 'Se você recebeu este email, sua configuração SMTP está funcionado corretamente!',
            html: '<h3>Teste Sucedido!</h3><p>Se você recebeu este email, sua configuração SMTP está funcionado corretamente!</p>'
        });

        console.log('✅ SUCESSO! Email enviado.');
        console.log(`ID da Mensagem: ${info.messageId}`);
    } catch (error) {
        console.error('❌ FALHA no envio.');
        console.error('Erro detalhado:', error);
    }
}

testEmail();
