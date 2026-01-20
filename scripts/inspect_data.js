require('dotenv').config();
const db = require('../src/config/db');

async function inspectData() {
    console.log('🔍 Inspecionando dados brutos...');

    const metas = await new Promise((r) => db.query("SELECT * FROM metas", (err, res) => r(res || [])));
    const gastos = await new Promise((r) => db.query("SELECT id, descricao, valor, meta_id, user_id FROM gastos_variaveis", (err, res) => r(res || [])));

    console.log('\n--- METAS ---');
    metas.forEach(m => console.log(`[${m.id}] ${m.nome} | Valor Atual: ${m.valor_atual} | Alvo: ${m.valor_alvo}`));

    console.log('\n--- GASTOS (Últimos 10) ---');
    gastos.slice(-10).forEach(g => {
        const linked = g.meta_id ? `-> LINKED TO META [${g.meta_id}]` : '(Sem Meta)';
        console.log(`[${g.id}] ${g.descricao} | R$ ${g.valor} | ${linked}`);
    });

    process.exit(0);
}

inspectData().catch(console.error);
