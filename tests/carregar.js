/* Carrega núcleo, desenhos, 3D e explicação (sem a interface) para os testes rodarem no Node */
const fs = require('fs'), path = require('path');
const src = ['core.js', 'draw.js', 'detail.js', 'r3d.js', 'problemas.js', 'explain.js', 'dxf.js', 'prancha.js'].map(f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8').replace(/if \(typeof module !== 'undefined'\)[^\n]*\n?/, '')).join('\n');
module.exports = new Function(src + '\nreturn { calc, NORMAS, TIPOS, DEFAULTS, fmt, escolherN, faixaP, planSVG, sectionSVG, explicacao, buildFaces, detalheSVG, render3D, corteSVG, cortesDe, elevacaoSVG, problemasHTML, dxfDe, dxfBytes, pranchaSVG, montarPrancha };')();
