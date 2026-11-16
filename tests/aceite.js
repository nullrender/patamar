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
['l-leque','u-leque'].forEach(t=>['bal','conv'].forEach(lq=>{const c=calc({tipo:t,leque:lq,H:340}).checks.find(c=>c.id==='ponta')||{};ok(/NBR 9077/.test(c.nota||''),t+' '+lq+': verificação da ponta cita a NBR 9077');}));
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

const shel=sectionSVG(h,{},C); const slabs=[...shel.matchAll(/<rect x="([^"]+)" y="-280" width="([^"]+)" height="[^"]+" fill="url\(#hch\d+\)"/g)];
ok(slabs.length===1 && Number(slabs[0][1])>=h.Wtot-1,'perfil helicoidal: laje só depois da chegada');
const f3=buildFaces(h,C).length, f3b=buildFaces(Object.assign({},h,{hel:false}),C).length; ok(f3>f3b,'3D helicoidal inclui a placa de chegada');
/* v5: leques balanceados */
{
  const B=calc({tipo:'l-leque'});
  ok(B.bal && B.polys.every(q=>Math.abs(q.wlen-B.p)<1e-9),'L balanceado: piso igual na linha de caminhamento em todos os degraus');
  ok(st(B,'ponta')==='ok' && Math.min(...B.polys.filter(q=>q.kind==='leque').map(q=>q.wIn))>=15-1e-6,'L balanceado padrão: ponta ≥ 15 cm');
  ok(st(calc({tipo:'l-leque',leque:'conv'}),'ponta')==='bad','leques convergentes: ponta 0 "não atende"');
  ok(st(calc({tipo:'u-leque',H:180}),'ponta')==='bad' && st(calc({tipo:'u-leque',H:450,nMeio:3}),'ponta')==='ok','U balanceado: H 180 não chega a 15 cm, H 450 com 3 pisos no meio chega');
  /* revisão: escada curta balanceada desenha (ponta "não atende") em vez de dar erro */
  [{tipo:'u-leque',H:180},{tipo:'l-leque',L:100,H:100,kLeque:3},{tipo:'l-leque',L:100,H:100,kLeque:5}].forEach(o=>{let R=null;try{R=calc(o);}catch(e){} ok(R && R.polys.length===R.T,'escada curta balanceada desenha: '+JSON.stringify(o));});
  const k2=calc({tipo:'l-leque',kLeque:2}); ok(k2.kw>=k2.kwMin && st(k2,'kw')==='info','pedir menos arestas que o mínimo: app sobe e avisa');
  let erroLq=false; try{calc({norma:'custom',cLq:-1});}catch(e){erroLq=!!e.patamar;} ok(erroLq,'ponta mínima personalizada negativa dá erro de entrada');
  ok(st(calc({norma:'custom',tipo:'l-leque',cLq:25}),'ponta')==='bad','ponta mínima personalizada de 25 cm é respeitada');
}
/* v5: lance mínimo, fórmula do patamar, linha no eixo, pilar da helicoidal */
ok(st(calc({tipo:'reta-patamar',n1Auto:false,n1:1}),'lanco')==='bad','lance com 2 espelhos "não atende"');
ok(st(calc({tipo:'reta-patamar'}),'lanco')==='ok','lances divididos ao meio atendem o mínimo de 3');
ok(st(calc({tipo:'reta-patamar'}),'patform')==='info','reta com patamar mostra a fórmula do patamar da NBR 9077');
ok(st(calc({L:90}),'dw')==='info','escada estreita: linha no eixo é informação, não alerta');
ok(st(calc({tipo:'helicoidal'}),'pilar')==='warn','helicoidal: piso junto ao pilar em atenção');
/* v5: corrimão prolongado 30 cm no perfil NBR 9050; ids de hachura únicos */
{
  const A=calc({norma:'acess',tipo:'reta-patamar',L:120}); const sa=sectionSVG(A,{},C);
  const rails=[...sa.matchAll(/<polyline points="([^"]+)"/g)].map(m=>m[1].split(' ').map(p=>p.split(',').map(Number))).filter(p=>p.length>5);
  ok(rails.some(r=>Math.abs(r[0][0]+30)<0.01),'NBR 9050: corrimão começa 30 cm antes do primeiro degrau');
  const s1=sectionSVG(A,{},C), s2=sectionSVG(A,{},C); ok(s1.match(/pattern id="([^"]+)"/)[1]!==s2.match(/pattern id="([^"]+)"/)[1],'dois perfis na mesma página têm hachuras com ids diferentes');
}
/* v5: explicação */
{
  const X=calc({tipo:'l-leque'}); const ex2=explicacao(X,X.st,C);
  ok(/edição nova em 16\/07\/2025/.test(ex2),'explicação avisa da NBR 9077:2025 não lida');
  ok(/piso p \(cm\)/.test(ex2) && /sua escada/.test(ex2),'explicação tem o gráfico de Blondel');
  ok(/Borda interna/.test(ex2) && /progressão aritmética/.test(ex2),'explicação do balanceamento com tabela');
  ok(/Tales/.test(ex2) && /1:50/.test(ex2),'roteiro de desenho à mão');
}
/* revisão v5 (achados confirmados) */
{
  ok(calc({tipo:'l-leque',norma:'custom',cDw:120,L:240,H:450}).kw===7,'kw pode passar de 6 (a interface gera opções até kw)');
  const E=calc({tipo:'l-leque',norma:'res',L:120}); ok(E.dw===55,'perfil Estudo: linha a 55 cm (NBR 9077:2001, 3.32)');
  ok(calc({tipo:'l-leque',norma:'res',L:104}).dw===52,'L 104: linha no eixo (nota do 3.32)');
  const P=calc({tipo:'reta-patamar',norma:'res',L:120,H:300,LpAuto:false,Lp:100});
  ok(st(P,'patprof')==='ok','Estudo, patamar reto 100 cm com L 120: atende a fórmula da NBR 9077 (não exige = largura)');
  ok(st(calc({tipo:'reta-patamar',norma:'res',LpAuto:false,Lp:80}),'patprof')==='bad','patamar reto abaixo da fórmula com n = 1 não atende');
  ok(st(calc({tipo:'reta-patamar',norma:'acess',L:150,H:700}),'patprof')==='ok' && calc({tipo:'reta-patamar',norma:'acess',L:150,H:700}).patRetoMin===120,'NBR 9050: patamar reto mínimo de 120 cm');
  const L1=calc({tipo:'reta-patamar',norma:'res',H:300,nAuto:false,N:17,n1Auto:false,n1:1}); const nl=(L1.checks.find(c=>c.id==='lanco')||{}).nota||'';
  ok(/manda evitar/.test(nl) && !/tropeça/.test(nl),'lance mínimo: texto fiel à NBR 9050 6.7.2');
  const PT=calc({tipo:'reta-patamar',H:700,norma:'acess',L:150}); ok(!/use um tipo com patamar/.test((PT.checks.find(c=>c.id==='patamar')||{}).nota||''),'tipo com patamar não manda "usar um tipo com patamar"');
  const exl=explicacao(calc({tipo:'l-leque'}),calc({tipo:'l-leque'}).st,C);
  ok(/Esta é uma <b>escada em L com leques<\/b>/.test(exl),'resumo começa com "escada em L com leques"');
  ok(!/caem dentro da curva|cabem nela/.test(exl+calc({tipo:'l-leque'}).memo.join(' ')),'não afirma quantas arestas caem no arco');
  ok(!/6492 recomenda/.test(exl),'NBR 6492 não conferida não é citada como se fosse');
  const cu=calc({tipo:'reta',norma:'custom',cEmin:16.5,cEmax:18.5,cPmin:27.5,cPmax:31,cBmin:63.1,cBmax:64.3}); const exc=(explicacao(cu,cu.st,C)+cu.memo.join(' ')+cu.checks.map(c=>c.regra+' '+c.nota).join(' ')).replace(/<svg[\s\S]*?<\/svg>/g,'');
  ok(!/16\.5|18\.5|27\.5|63\.1|64\.3|1\.1999/.test(exc) && /16,5/.test(exc),'limites personalizados com vírgula, sem erro de ponto flutuante');
  ok(/10,03/.test(explicacao(calc({tipo:'reta',H:180.5}),calc({tipo:'reta',H:180.5}).st,C)),'quociente H ÷ eMax com 2 casas');
  const hx=calc({tipo:'helicoidal',H:450}); ok(!/exatamente o desnível/.test(explicacao(hx,hx.st,C)),'divisão não exata não diz "exatamente"');
  ok(!/arredondado e dentro/.test(calc({tipo:'reta',nAuto:false,N:14}).memo.join(' ')),'piso preso ao limite não é chamado de arredondado');
  ok(/120 cm do piso/.test(explicacao(calc({tipo:'reta',zCorte:120}),calc({tipo:'reta',zCorte:120}).st,C)),'roteiro usa a altura de corte escolhida');
  ok(/topo da vertical/.test(exl),'Tales: roteiro diz qual vertical e qual ponto ligar');
}
/* varredura */
let n=0,bug=0;for(const t of ['reta','reta-patamar','l-patamar','l-leque','u-patamar','u-leque','helicoidal'])for(const no of ['res','acess'])for(const H of [20,100,280,450,700])for(const lado of ['dir','esq'])for(const leque of ['bal','conv']){try{const X=calc({tipo:t,norma:no,H,L:120,lado,leque});const x=explicacao(X,X.st,C)+planSVG(X,{},C)+planSVG(X,{modo:'sup'},C)+sectionSVG(X,{},C);buildFaces(X,C);if(/NaN|undefined|Infinity/.test(x)){bug++;console.log('RUIM',t,no,H)}n++}catch(e){if(!e.patamar){bug++;console.log('BUG',t,no,H,e.message)}}}
ok(bug===0,'varredura: '+n+' casos sem NaN nem erro de código');
console.log(fail?fail+' falha(s)':'todos passaram');
