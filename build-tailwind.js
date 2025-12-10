const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'styles', 'tailwind.css');
const outputPath = path.join(__dirname, 'public', 'styles', 'output.css');

const css = fs.readFileSync(inputPath, 'utf8');

postcss([
  tailwindcss,
])
  .process(css, { from: inputPath, to: outputPath })
  .then((result) => {
    fs.writeFileSync(outputPath, result.css);
    if (result.map) {
      fs.writeFileSync(outputPath + '.map', result.map.toString());
    }
    console.log('✅ Tailwind CSS compilado com sucesso!');
    console.log(`📄 Output salvo em: ${outputPath}`);
  })
  .catch((err) => {
    console.error('❌ Erro ao compilar Tailwind CSS:');
    console.error(err);
    process.exit(1);
  });
