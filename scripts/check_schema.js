const db = require('../src/config/db');

async function checkSchema() {
    const query = (sql) => new Promise((resolve, reject) => {
        db.query(sql, (err, res) => err ? reject(err) : resolve(res));
    });

    try {
        console.log('--- METAS ---');
        const metasCols = await query("SHOW COLUMNS FROM metas");
        metasCols.forEach(c => console.log(`${c.Field}: ${c.Type} (Default: ${c.Default})`));

        console.log('\n--- GASTOS_VARIAVEIS ---');
        const gastosCols = await query("SHOW COLUMNS FROM gastos_variaveis");
        gastosCols.forEach(c => console.log(`${c.Field}: ${c.Type}`));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkSchema();
