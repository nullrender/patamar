/* Monta o index.html: junta os arquivos de src/ dentro do template. Rode: node build.js */
const fs = require('fs'), path = require('path');
const ORDEM = ['core.js', 'draw.js', 'detail.js', 'r3d.js', 'problemas.js', 'explain.js', 'ui.js'];
const js = ORDEM.map(f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8').replace(/if \(typeof module !== 'undefined'\)[^\n]*\n?/, '')).join('\n');
new Function(js); /* para o build se houver erro de sintaxe */
const html = fs.readFileSync(path.join(__dirname, 'src', 'template.html'), 'utf8').replace('/*__SCRIPT__*/', () => js);
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html', html.length, 'bytes');
