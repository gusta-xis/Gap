function errorMiddleware(err, req, res, next) {
    console.error("Erro capturado pelo middleware:", err);

    const status = err.status || 500;
    const message = err.message || "Erro interno do servidor";

    res.status(status).json({
        sucesso: false,
        erro: message
    });
}

module.exports = errorMiddleware;
