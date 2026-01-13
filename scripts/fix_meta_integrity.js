require('dotenv').config();
const db = require('../src/config/db');

async function fixIntegrity() {
    console.log('🔧 Iniciando CORREÇÃO de integridade das Metas...');

    // 1. Get all metas
    const metas = await new Promise((resolve, reject) => {
        db.query("SELECT id, nome, valor_atual FROM metas", (err, res) => err ? reject(err) : resolve(res));
    });

    console.log(`📋 Verificando ${metas.length} metas...`);

    let updatedCount = 0;

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
            console.log(`⚠️ CORRIGINDO META [${meta.id}] "${meta.nome}":`);
            console.log(`   * Anterior: R$ ${storedTotal.toFixed(2)} -> Novo: R$ ${realTotal.toFixed(2)}`);

            await new Promise((resolve, reject) => {
                db.query(
                    "UPDATE metas SET valor_atual = ? WHERE id = ?",
                    [realTotal, meta.id],
                    (err, res) => err ? reject(err) : resolve(res)
                );
            });
            console.log(`   ✅ Corrigido.`);
            updatedCount++;
        }
    }

    console.log(`🏁 Concluído. ${updatedCount} metas foram sincronizadas.`);
    process.exit(0);
}

fixIntegrity().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
