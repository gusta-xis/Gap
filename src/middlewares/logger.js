module.exports = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString();

  console.log(`\n[${timestamp}] ${req.method} ${req.url}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const icon = status >= 400 ? '❌' : '✅';

    console.log(`  ${icon} Status: ${status} (${duration}ms)`);
  });

  next();
};
