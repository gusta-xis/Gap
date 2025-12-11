const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

let isConnected = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function establishConnection() {
  db.connect((err) => {
    if (err) {
      console.error('❌ Erro ao conectar no banco de dados.');
      
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`   Tentando reconectar (${reconnectAttempts}/${maxReconnectAttempts})...`);
        setTimeout(establishConnection, 5000);
      } else {
        console.error('❌ Máximo de tentativas de reconexão atingido.');
      }
      return;
    }

    isConnected = true;
    reconnectAttempts = 0;
    console.log('✅ Banco de dados conectado com sucesso!');
  });

  db.on('error', (err) => {
    console.error('❌ Erro de conexão com banco:', err.code);
    isConnected = false;

    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Reconectando ao banco...');
      establishConnection();
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.log('Banco de dados sobrecarregado. Tentando reconectar...');
      setTimeout(establishConnection, 5000);
    }
    if (err.code === 'ECONNREFUSED') {
      console.log('Conexão recusada. Verificando banco de dados...');
      setTimeout(establishConnection, 5000);
    }
  });
}

establishConnection();

db.checkConnection = () => isConnected;

module.exports = db;
