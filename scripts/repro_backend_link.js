require('dotenv').config();
const db = require('../src/config/db');
const variaveisController = require('../src/Modules/Gap-Finance/controllers/variaveisController');

// Mock request/response
function mockReq(body, params, user) {
    return {
        body: body || {},
        params: params || {},
        user: user || { id: 1 } // Assume user 1 exists, or we fetch one
    };
}

function mockRes(resolve, reject) {
    return {
        status: (code) => ({
            json: (data) => resolve({ code, data })
        }),
        json: (data) => resolve({ code: 200, data })
    };
}

async function runTest() {
    console.log('🧪 Iniciando teste de Backend (Link Expense)...');

    try {
        // 1. Get a valid user
        const user = await new Promise(r => db.query("SELECT id FROM users LIMIT 1", (err, res) => r(res[0])));
        if (!user) throw new Error("Sem usuários para teste");
        console.log(`👤 User ID: ${user.id}`);

        // 2. Create a test Meta
        const metaId = await new Promise((resolve, reject) => {
            db.query("INSERT INTO metas (nome, valor_alvo, prazo, valor_atual, user_id) VALUES (?, ?, ?, ?, ?)",
                ['Meta Teste Repro', 1000.00, '2025-12-31', 0.00, user.id],
                (err, res) => err ? reject(err) : resolve(res.insertId)
            );
        });
        console.log(`🎯 Meta Criada: ID ${metaId}`);

        // 3. Create an unlinked Expense directly via DB (to simulate old state)
        const expenseId = await new Promise((resolve, reject) => {
            db.query("INSERT INTO gastos_variaveis (descricao, valor, data_gasto, tipo, user_id, meta_id) VALUES (?, ?, ?, ?, ?, NULL)",
                ['Gasto Teste Repro', 100.00, '2025-01-01', 'saida', user.id],
                (err, res) => err ? reject(err) : resolve(res.insertId)
            );
        });
        console.log(`💸 Despesa Criada (Unlinked): ID ${expenseId}`);

        // 4. Call Controller Update to LINK expense to meta
        console.log('🔄 Executando update via Controller...');
        const req = mockReq({ meta_id: metaId, valor: 100.00 }, { id: expenseId }, user);

        await new Promise((resolve, reject) => {
            const res = mockRes(resolve, reject);
            // We need to bind the context or ensuring required modules are loaded inside controller
            // The controller requires modules internally so it should work
            try {
                variaveisController.update(req, res);
            } catch (e) { reject(e); }
        });

        // 5. Verify Meta Balance
        const meta = await new Promise(r => db.query("SELECT * FROM metas WHERE id = ?", [metaId], (err, res) => r(res[0])));
        console.log(`🧐 Resultado Meta: Valor Atual = ${meta.valor_atual}`);

        if (Math.abs(meta.valor_atual - 100.00) < 0.01) {
            console.log('✅ SUCESSO: Meta atualizada corretamente para 100.00');
        } else {
            console.error(`❌ FALHA: Esperado 100.00, encontrou ${meta.valor_atual}`);
        }

        // Cleanup
        await new Promise(r => db.query("DELETE FROM gastos_variaveis WHERE id = ?", [expenseId], r));
        await new Promise(r => db.query("DELETE FROM metas WHERE id = ?", [metaId], r));

    } catch (e) {
        console.error('❌ ERRO NO TESTE:', e);
    }
    process.exit(0);
}

runTest();
