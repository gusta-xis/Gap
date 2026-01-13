const db = require('../src/config/db');

function migrate() {
    console.log('🔄 Iniciando migração: Adicionar meta_id em gastos_variaveis...');

    const query = `
        ALTER TABLE gastos_variaveis 
        ADD COLUMN meta_id INT DEFAULT NULL,
        ADD CONSTRAINT fk_gastos_metas 
        FOREIGN KEY (meta_id) REFERENCES metas(id) 
        ON DELETE SET NULL;
    `;

    db.query(query, (err, result) => {
        if (err) {
            // Se o erro for de coluna existente, ignoramos
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ Coluna meta_id já existe.');
            } else {
                console.error('❌ Erro na migração:', err);
            }
        } else {
            console.log('✅ Migração concluída: Coluna meta_id adicionada.');
        }
        process.exit(0);
    });
}

migrate();
