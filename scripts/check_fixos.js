require('dotenv').config();
const db = require('../src/config/db');

async function checkFixos() {
    console.log('🔍 Verificando Gastos Fixos...');

    const fixos = await new Promise((r) => db.query("SELECT id, nome, descricao, valor, user_id FROM gastos_fixos", (err, res) => r(res || [])));

    console.log(`📋 Encontrados ${fixos.length} gastos fixos.`);
    fixos.forEach(f => {
        console.log(`[FIXO] ID ${f.id} | ${f.nome || f.descricao} | R$ ${f.valor}`);
    });

    process.exit(0);
}

checkFixos().catch(console.error);
