module.exports = (req, res, next) => {
    // 1. Inicia o cronômetro global da requisição
    req.startTime = Date.now();

    // 2. Pega hora legível
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`\n========================================`);
    console.log(`🏁 [${timestamp}] INÍCIO: ${req.method} ${req.url}`);

    // 3. Cria a função mágica que os outros arquivos vão usar
    // Ela calcula quanto tempo passou desde o início
    req.passo = (icone, mensagem) => {
        const agora = Date.now();
        const decorrido = agora - req.startTime;
        // Exibe:  🔑 [15ms] Autenticação realizada
        console.log(`   ${icone}  [+${decorrido}ms] ${mensagem}`);
    };

    // 4. Mostra o Body se tiver (ajuda a debuggar)
    if (req.body && Object.keys(req.body).length > 0) {
        // Mostra só as chaves para não poluir, ou o objeto todo se preferir
        console.log(`   📦  Payload:`, JSON.stringify(req.body));
    }

    // 5. Monitora o final da resposta (Quando o res.json é chamado)
    res.on('finish', () => {
        const total = Date.now() - req.startTime;
        const status = res.statusCode;
        
        // Ícone muda se for erro ou sucesso
        const icon = status >= 400 ? '❌' : '🏁';
        
        console.log(`   ${icon}  [+${total}ms] RESPOSTA ENVIADA (Status ${status})`);
        console.log(`========================================\n`);
    });

    next();
};