require('dotenv').config(); // Load from CWD (project root)
const db = require('../src/config/db');

async function runMigration() {
    console.log('🚀 Iniciando migração de precisão decimal...');

    const queries = [
        // Ensure Metas values are decimal
        "ALTER TABLE metas MODIFY COLUMN valor_alvo DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE metas MODIFY COLUMN valor_atual DECIMAL(12, 2) NOT NULL DEFAULT 0.00",

        // Ensure Gastos Variaveis values are decimal
        "ALTER TABLE gastos_variaveis MODIFY COLUMN valor DECIMAL(12, 2) NOT NULL DEFAULT 0.00",

        // Ensure Gastos Fixos values are decimal (just in case)
        "ALTER TABLE gastos_fixos MODIFY COLUMN valor DECIMAL(12, 2) NOT NULL DEFAULT 0.00",

        // Ensure Salarios values are decimal
        "ALTER TABLE salarios MODIFY COLUMN valor DECIMAL(12, 2) NOT NULL DEFAULT 0.00"
    ];

    for (const sql of queries) {
        try {
            await new Promise((resolve, reject) => {
                db.query(sql, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            console.log(`✅ Sucesso: ${sql.split('MODIFY')[1] || sql}`);
        } catch (error) {
            console.error(`❌ Erro ao executar: ${sql}`, error.code, error.sqlMessage);
            // We continue even if error, maybe column doesn't exist or already correct
        }
    }

    console.log('🏁 Migração concluída.');
    process.exit(0);
}

runMigration();
