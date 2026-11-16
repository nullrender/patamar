const {calc,planSVG,sectionSVG,explicacao,buildFaces}=require('./carregar.js');
const C={paper:'#fff',ink:'#000',muted:'#666',line:'#ccc',accent:'#f60',info:'#06f',tread:'#ddd',winder:'#fdc',patamar:'#cfc',piso:'#eee',t3:'#ddd',w3:'#fdc',p3:'#cfc',f3:'#eee',ground:'#ccc'};
let fail=0; const ok=(c,m)=>{console.log((c?'PASSA ':'FALHA ')+m); if(!c)fail++;};
const st=(R,id)=>(R.checks.find(c=>c.id===id)||{}).status;
ok(st(calc({H:288.64,nAuto:false,N:16}),'e')==='bad','e = 18,04 cm dá "não atende"');
ok(st(calc({tipo:'helicoidal',D:160,Dc:20}),'L')==='bad','helicoidal D 160 / pilar 20: largura "não atende"');
const h=calc({tipo:'helicoidal'}); ok(!/soma/.test(h.memo.join(' ')),'memória da helicoidal sem "soma"');
ok(!calc({tipo:'helicoidal',norma:'acess',D:300}).checks.some(c=>c.id==='dw'),'NBR, D 300: sem aviso de linha reduzida');
const ex=explicacao(h,h.st,C)+explicacao(calc({}),calc({}).st,C);
ok(!/borda externa|nada deixa|menor altura livre da escada/.test(ex),'textos antigos removidos');
['l-leque','u-leque'].forEach(t=>ok(/NBR 9077/.test((calc({tipo:t}).checks.find(c=>c.id==='colo')||{}).regra||''),t+': aviso cita a NBR 9077'));
/* corrimão sem degrau vertical: extrai polylines do corrimão no perfil */
const R=calc({}); const sv=sectionSVG(R,{},C);
const pls=[...sv.matchAll(/<polyline points="([^"]+)"/g)].map(m=>m[1].split(' ').map(p=>p.split(',').map(Number)));
const rail=pls.filter(p=>p.length>5).find(p=>Math.abs(-p[0][1]-(R.e+92))<0.5);
let salto=false; if(rail) for(let i=1;i<rail.length;i++){ if(Math.abs(rail[i][0]-rail[i-1][0])<1e-6 && Math.abs(rail[i][1]-rail[i-1][1])>1) salto=true; }
ok(rail && !salto,'corrimão sem degrau vertical no patamar');
/* cor do patamar não passa do intradorso */
const pat=R.polys.find(p=>p.kind==='patamar'); const z=pat.k*R.e;
const rect=[...sv.matchAll(/<rect x="([^"]+)" y="([^"]+)" width="[^"]+" height="([^"]+)" fill="#cfc"/g)][0];
ok(rect && Math.abs(Number(rect[3])-R.st.tLaje)<0.01,'cor do patamar limitada à laje ('+(rect&&rect[3])+' cm)');
/* planta superior U H=700: números e linha dentro do clip */
const U=calc({tipo:'u-patamar',H:700}); const ps=planSVG(U,{modo:'sup'},C);
const gi=ps.indexOf('<g clip-path'), g2=ps.indexOf('<g clip-path',gi+5), endg=ps.lastIndexOf('</g>');
ok(g2>0 && ps.indexOf('>1</text>')>g2,'U H 700: números dentro do recorte da abertura');
/* laje da helicoidal fora do furo */
const minR=Math.min(...h.slab.pts.map(q=>Math.hypot(q[0],q[1])));
/* distância mínima das cordas ao centro */
const sp=h.slab.arc.inner; let dmin=Infinity; for(let i=1;i<sp.length;i++){const a=sp[i-1],b=sp[i];const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;dmin=Math.min(dmin,Math.hypot(mx,my));}
ok(dmin>=h.helix.R-1e-6,'laje helicoidal: cordas fora do furo ('+dmin.toFixed(2)+' ≥ '+h.helix.R+')');

const shel=sectionSVG(h,{},C); const slabs=[...shel.matchAll(/<rect x="([^"]+)" y="-280" width="([^"]+)" height="[^"]+" fill="url\(#hch\)"/g)];
ok(slabs.length===1 && Number(slabs[0][1])>=h.Wtot-1,'perfil helicoidal: laje só depois da chegada');
const f3=buildFaces(h,C).length, f3b=buildFaces(Object.assign({},h,{hel:false}),C).length; ok(f3>f3b,'3D helicoidal inclui a placa de chegada');
/* varredura */
let n=0,bug=0;for(const t of ['reta','reta-patamar','l-patamar','l-leque','u-patamar','u-leque','helicoidal'])for(const no of ['res','acess'])for(const H of [20,100,280,450,700])for(const lado of ['dir','esq']){try{const X=calc({tipo:t,norma:no,H,L:120,lado});const x=explicacao(X,X.st,C)+planSVG(X,{},C)+planSVG(X,{modo:'sup'},C)+sectionSVG(X,{},C);buildFaces(X,C);if(/NaN|undefined|Infinity/.test(x)){bug++;console.log('RUIM',t,no,H)}n++}catch(e){if(!e.patamar){bug++;console.log('BUG',t,no,H,e.message)}}}
ok(bug===0,'varredura: '+n+' casos sem NaN nem erro de código');
console.log(fail?fail+' falha(s)':'todos passaram');
