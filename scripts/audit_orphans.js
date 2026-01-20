require('dotenv').config();
const db = require('../src/config/db');

async function checkOrphans() {
    console.log('🔍 Buscando despesas órfãs (meta_id inválido)...');

    // Find expenses with meta_id that DOES NOT EXIST in metas table
    const query = `
        SELECT g.id, g.descricao, g.meta_id 
        FROM gastos_variaveis g 
        LEFT JOIN metas m ON g.meta_id = m.id 
        WHERE g.meta_id IS NOT NULL AND m.id IS NULL
    `;

    const orphans = await new Promise((r) => db.query(query, (err, res) => r(res || [])));

    if (orphans.length > 0) {
        console.log(`⚠️ Encontrados ${orphans.length} gastos com meta_id inválido!`);
        orphans.forEach(o => console.log(`   - ID ${o.id} "${o.descricao}" -> Meta ${o.meta_id} (Não existe)`));

        console.log('🧹 Limpando dados órfãos...');
        const ids = orphans.map(o => o.id);

        await new Promise((r) => db.query("UPDATE gastos_variaveis SET meta_id = NULL WHERE id IN (?)", [ids], r));
        console.log('✅ Links inválidos removidos.');
    } else {
        console.log('✅ Nenhum dado órfão encontrado.');
    }

    process.exit(0);
}

checkOrphans().catch(console.error);
