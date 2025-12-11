function maskSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const masked = JSON.parse(JSON.stringify(obj));
  const sensitiveFields = [
    'senha',
    'password',
    'pin',
    'credit_card',
    'ssn',
    'token',
    'refreshToken',
    'secret',
    'api_key',
    'apiKey'
  ];

  function maskValue(value) {
    if (typeof value === 'string' && value.length > 4) {
      return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
    }
    return '***MASKED***';
  }

  function walkObject(obj) {
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = maskValue(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        walkObject(obj[key]);
      }
    }
  }

  walkObject(masked);
  return masked;
}

module.exports = (req, res, next) => {
  req.startTime = Date.now();

  const timestamp = new Date().toLocaleTimeString();

  console.log(`\n========================================`);
  console.log(`🏁 [${timestamp}] INÍCIO: ${req.method} ${req.url}`);

  req.passo = (icone, mensagem) => {
    const agora = Date.now();
    const decorrido = agora - req.startTime;
    console.log(`   ${icone}  [+${decorrido}ms] ${mensagem}`);
  };

  if (req.body && Object.keys(req.body).length > 0) {
    const maskedBody = maskSensitiveData(req.body);
    console.log(`   📦  Payload:`, JSON.stringify(maskedBody));
  }

  res.on('finish', () => {
    const total = Date.now() - req.startTime;
    const status = res.statusCode;

    const icon = status >= 400 ? '❌' : '🏁';

    console.log(
      `   ${icon}  [+${total}ms] RESPOSTA ENVIADA (Status ${status})`
    );
    console.log(`========================================\n`);
  });

  next();
};
