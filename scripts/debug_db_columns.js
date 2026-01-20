const db = require('../src/config/db');

db.query("SHOW COLUMNS FROM gastos_variaveis", (err, results) => {
    if (err) {
        console.error("Error fetching columns:", err);
        process.exit(1);
    }
    console.log("Columns in gastos_variaveis:");
    results.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
    process.exit(0);
});
