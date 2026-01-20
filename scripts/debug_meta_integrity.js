require('dotenv').config();
const db = require('../src/config/db');

async function checkIntegrity() {
    console.log('🔍 Verificando integridade das Metas...');

    // 1. Get all metas
    const metas = await new Promise((resolve, reject) => {
        db.query("SELECT id, nome, valor_atual, user_id FROM metas", (err, res) => err ? reject(err) : resolve(res));
    });

    console.log(`📋 Encontradas ${metas.length} metas.`);

    for (const meta of metas) {
        // 2. Sum expenses for this meta
        const sumResult = await new Promise((resolve, reject) => {
            db.query(
                "SELECT SUM(valor) as total FROM gastos_variaveis WHERE meta_id = ?",
                [meta.id],
                (err, res) => err ? reject(err) : resolve(res)
            );
        });

        const realTotal = parseFloat(sumResult[0].total || 0);
        const storedTotal = parseFloat(meta.valor_atual || 0);
        const diff = realTotal - storedTotal;

        if (Math.abs(diff) > 0.01) {
            console.log(`❌ DISCREPÂNCIA NA META [${meta.id}] "${meta.nome}":`);
            console.log(`   - Valor Armazenado (metas.valor_atual): R$ ${storedTotal.toFixed(2)}`);
            console.log(`   - Soma Real (gastos_variaveis):         R$ ${realTotal.toFixed(2)}`);
            console.log(`   - Diferença:                            R$ ${diff.toFixed(2)}`);
            console.log(`   💡 A meta deve ser atualizada para R$ ${realTotal.toFixed(2)}`);
        } else {
            console.log(`✅ Meta [${meta.id}] "${meta.nome}" está correta (R$ ${realTotal.toFixed(2)}).`);
        }
    }

    process.exit(0);
}

checkIntegrity().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
