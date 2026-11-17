const {calc,planSVG,sectionSVG,explicacao,buildFaces,corteSVG,detalheSVG,elevacaoSVG}=require('./carregar.js');
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
/* v6: degraus por volta escolhidos; tipos C e Z */
{
  const h10=calc({tipo:'helicoidal',nPerAuto:false,nPer:10}); ok(h10.helix.nPer===10 && st(h10,'altura')==='bad','helicoidal com 10 degraus por volta: piso largo e altura livre "não atende"');
  ok(calc({tipo:'helicoidal'}).helix.nPerAuto===true && calc({tipo:'helicoidal'}).helix.nPer===13,'helicoidal automática continua com 13 por volta');
  let eP=false; try{calc({tipo:'helicoidal',nPerAuto:false,nPer:2});}catch(e){eP=!!e.patamar;} ok(eP,'degraus por volta fora de 4 a 72 dá erro de entrada');
  ['c-patamar','z-patamar'].forEach(t=>['dir','esq'].forEach(lado=>{const R=calc({tipo:t,lado}); ok(R.polys.length===R.T && R.rises.length===3 && R.nPat===2,t+' '+lado+': 3 lances, 2 patamares, N − 1 superfícies');}));
  const Z=calc({tipo:'z-patamar'}), Rt=calc({tipo:'reta'});
  ok(Math.abs(Z.quant.aEspelhos-Rt.quant.aEspelhos)<1e-6,'Z: área de espelhos = N × e × largura');
}
/* v6: cortes A-A e B-B reais, chamada na planta, quantitativos */
{
  const R=calc({tipo:'reta'});
  const a=corteSVG(R,{},C,'A'), b=corteSVG(R,{},C,'B');
  ok(/CORTE A-A/.test(a) && /CORTE B-B/.test(b),'cortes A-A e B-B têm título');
  const polys=(sv)=>[...sv.matchAll(/<polygon points="([^"]+)" fill="url\(#hcc\d+\)"/g)].map(m=>m[1].split(' ').map(p=>p.split(',').map(Number)));
  const pa=polys(a), pd=pa.filter(p=>p.length>4), pdente=pa.filter(p=>p.length===4);
  ok(pd.length===1 && Math.abs(Math.min(...pd[0].map(q=>q[1]))+15*17.5)<0.01,'reta, A-A: um só contorno de degraus cortado, do 1º ao 15º (topo a 262,5)');
  ok(pdente.length===1 && Math.abs(Math.min(...pdente[0].map(q=>q[1]))+(280-12))<0.01 && Math.abs(Math.max(...pdente[0].map(q=>q[1]))+(280-17.5))<0.01,'reta, A-A: dente da chegada cortado de 262,5 a 268 (espelho sob a laje de cima)');
  const pb=polys(b), d8=R.polys[7]; const esp=d8.top-R.zBot(d8,[50,7*29+14.5]);
  ok(pb.length===1 && Math.abs((Math.max(...pb[0].map(q=>q[1]))-Math.min(...pb[0].map(q=>q[1])))-esp)<0.01,'reta, B-B: corta o degrau 8 com a espessura real ('+esp.toFixed(1)+' cm)');
  const pl=planSVG(R,{},C); ok((pl.match(/font-weight="700">A</g)||[]).length===2 && (pl.match(/font-weight="700">B</g)||[]).length===2,'planta: chamadas A e B nas duas pontas');
  ok(!/font-weight="700">A</.test(planSVG(calc({showCortes:false}),{},C)),'planta: chamadas somem com "cortes" desligado');
  ok(!/font-weight="700">A</.test(planSVG(R,{modo:'sup'},C)),'planta do pavimento superior sem chamadas');
  const h=calc({tipo:'helicoidal'}); ok(/fill="url\(#hcc\d+\)" stroke="[^"]+" stroke-width="2"/.test(corteSVG(h,{},C,'A').replace(/<polygon[^>]+>/g,'')),'helicoidal, A-A: pilar cortado');
  const d=calc({tipo:'reta',corteA:30}); ok(corteSVG(d,{},C,'A')!==a,'deslocar a linha muda o corte');
  let nanC=0; for(const t of ['reta','reta-patamar','l-patamar','l-leque','u-patamar','u-leque','c-patamar','z-patamar','helicoidal'])for(const lado of ['dir','esq'])for(const q of ['A','B'])for(const leque of ['bal','conv']){const X=calc({tipo:t,lado,leque});const sv=corteSVG(X,{},C,q)+planSVG(X,{},C);if(/NaN|undefined|Infinity/.test(sv))nanC++;}
  ok(nanC===0,'cortes e chamadas sem NaN nos 9 tipos, dos dois lados');
  const e=17.5,p=29,tl=10,L=100,sup=(15*e*p/2+15*Math.hypot(p,e)*tl)*L;
  ok(R.quant.volConc<=sup+1 && R.quant.volConc>=0.95*sup,'reta: volume de concreto confere com a conta à mão ('+(R.quant.volConc/1e6).toFixed(3)+' m³)');
  ok(Math.abs(R.quant.aEspelhos-16*17.5*100)<1e-6 && Math.abs(R.quant.aPisos-15*29*100)<1e-6,'reta: área de espelhos e de pisos');
}
/* v6: detalhe do degrau e 3D com fundo real */
{
  let ruimD=0, ruim3=0;
  for(const t of ['reta','reta-patamar','l-patamar','l-leque','u-patamar','u-leque','c-patamar','z-patamar','helicoidal'])for(const no of ['res','acess'])for(const lado of ['dir','esq']){
    const X=calc({tipo:t,norma:no,lado}); const d=detalheSVG(X,{},C);
    if(!/DETALHE DO DEGRAU/.test(d)||/NaN|undefined|Infinity/.test(d)) ruimD++;
    const fc=buildFaces(X,C); if(fc.some(f=>f.tris.some(tr=>tr.some(v=>v.some(c=>!isFinite(c)))))) ruim3++;
  }
  ok(ruimD===0,'detalhe do degrau nos 9 tipos, sem NaN');
  ok(ruim3===0,'3D nos 9 tipos, sem coordenada inválida');
  ok(/4\.8\.2\.3/.test(detalheSVG(calc({}),{},C)) && /bocel 1,5/.test(detalheSVG(calc({}),{},C)),'detalhe cita o diâmetro do corrimão (NBR 9077 4.8.2.3) e o bocel de 1,5 cm');
  const R=calc({}); const fc=buildFaces(R,C); const d3=R.polys[7];
  const zs=fc.filter(f=>f.kind==='side').flatMap(f=>f.tris.flat().map(v=>v[2]));
  ok(zs.some(z=>Math.abs(z-R.zBot(d3,[50,7*29]))<0.01),'3D: fundo dos degraus segue o intradorso (zBot)');
}
/* revisão v6 (achados confirmados) */
{
  ['reta-patamar','l-patamar','u-patamar','c-patamar','z-patamar'].forEach(t=>{const R=calc({tipo:t}); R.polys.forEach((pl,i)=>{ if(pl.kind!=='patamar')return; const a=pl.entry[0],b=pl.entry[1],m=[(a[0]+b[0])/2,(a[1]+b[1])/2], pv=R.polys[i-1];
    ok(R.zBot(pl,m)<=pv.top+1e-6 && Math.abs(R.zBot(pl,m)-R.zBot(pv,m))<0.01, t+': patamar '+pl.k+' encosta no lance que chega (joelho da laje, sem vão)');});});
  const Z=calc({tipo:'z-patamar',L:150}); const ult=Z.walk[Z.walk.length-1]; const p3=Z.polys[Z.polys.length-1];
  const dl=(q,A,B)=>{const dx=B[0]-A[0],dy=B[1]-A[1];return Math.abs((q[0]-A[0])*dy-(q[1]-A[1])*dx)/Math.hypot(dx,dy);};
  const dIn=dl(p3.entry[0],ult[0],ult[1]), dOut=dl(p3.entry[1],ult[0],ult[1]);
  ok(Math.abs(Math.min(dIn,dOut)-55)<0.5 && Math.abs(Math.max(dIn,dOut)-95)<0.5,'Z: no 3º lance a linha de caminhamento fica a 55 cm da borda interna (troca de lado)');
  let eM=false; try{calc({tipo:'c-patamar',nMeioPAuto:false,nMeioP:50});}catch(e){eM=!!e.patamar;} ok(eM,'pisos no lance do meio acima do disponível dá erro (não corrige em silêncio)');
  ok(/escolhido por você/.test(calc({tipo:'helicoidal',nPerAuto:false,nPer:10}).memo.join(' ')),'helicoidal com degraus por volta escolhidos: a memória diz que foi escolha');
  ok(/lance do meio/.test(calc({tipo:'c-patamar',nMeioPAuto:false,nMeioP:1}).checks.find(c=>c.id==='lanco').nota),'C com lance do meio curto: aviso aponta o campo certo');
  ok(!/um patamar só/.test(calc({tipo:'c-patamar',H:1000}).checks.find(c=>c.id==='patamar').nota),'C: aviso de desnível não diz "um patamar só"');
  const hp=calc({tipo:'helicoidal',Dc:60,corteA:-50}); const sv=corteSVG(hp,{},C,'A'); const iP=sv.indexOf('width="60" height="268" fill="#fff"'), iC=sv.indexOf('fill="url(#hcc');
  ok(iP>0 && iP<iC,'helicoidal: pilar além do plano entra em vista antes do que é cortado (não cobre os degraus)');
  const rb=corteSVG(calc({tipo:'reta'}),{},C,'B'); ok((rb.match(/<polyline/g)||[]).length>=2,'reta, B-B: os dois corrimãos aparecem em vista');
  ok(/não passa pela escada/.test(corteSVG(calc({tipo:'reta',corteB:1000}),{},C,'B')),'corte fora da escada avisa');
  const far=planSVG(calc({tipo:'reta',corteA:300}),{},C); const vb=far.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  ok(vb[0]+vb[2]>350,'planta inclui a chamada deslocada no desenho');
}
{
  const da=detalheSVG(calc({tipo:'reta',norma:'acess',L:120}),{},C);
  ok(/3,0 a 4,5/.test(da) && /4\.6\.5/.test(da) && !/3,8 a 6,5/.test(da),'detalhe no perfil NBR 9050: corrimão Ø 3,0 a 4,5 cm (4.6.5)');
  ok(!/1:10/.test(detalheSVG(calc({}),{},C)),'detalhe não afirma escala 1:10 (só escala gráfica)');
  const pl=planSVG(calc({showCortes:false}),{modo:'inf',cortes:true},C); ok((pl.match(/font-weight="700">A</g)||[]).length===2,'relatório: planta com as chamadas mesmo com "cortes" desligado');
  const fc=buildFaces(calc({}),C); ok(fc.some(f=>f.kind==='top'&&f.tris.some(t=>t.some(v=>Math.abs(v[2]-(280-12))<1e-6))) ,'3D: dente da chegada sob a laje de cima');
}
{ const hc=corteSVG(calc({tipo:'helicoidal'}),{},C,'A'); const pp=[...hc.matchAll(/<polygon points="([^"]+)" fill="url\(#hcc\d+\)"/g)].map(m=>m[1].split(' ').map(p=>p.split(',').map(Number))); const top1=p=>{const ys=p.map(q=>q[1]),mn=Math.min(...ys);return ys.filter(y=>Math.abs(y-mn)<1e-6).length===2;}; ok(pp.length>1 && pp.every(top1),'helicoidal: cada degrau cortado é uma placa solta (sem espelho ligando)'); }
/* v6.1: borda do degrau (bocel, espelho inclinado, sem saliência) */
{
  ok(st(calc({}),'bocel')==='ok','padrão: bocel de 1,5 cm atende o perfil Estudo');
  ok(st(calc({bocel:'sem'}),'bocel')==='bad' && st(calc({avanco:1}),'bocel')==='bad','Estudo (NBR 9077): sem saliência ou bocel de 1 cm não atende (mín. 1,5)');
  ok(st(calc({bocel:'inclinado',avanco:2}),'bocel')==='ok','Estudo: espelho inclinado com quina de 2 cm atende');
  ok(st(calc({norma:'acess',L:120,bocel:'sem'}),'bocel')==='ok' && st(calc({norma:'acess',L:120,avanco:2}),'bocel')==='bad','NBR 9050: sem saliência atende; bocel de 2 cm não (máx. 1,5)');
  ok(st(calc({norma:'custom',avanco:3}),'bocel')==='info','perfil personalizado: borda só informada');
  let eA=false; try{calc({avanco:0});}catch(e){eA=!!e.patamar;} ok(eA,'avanço de bocel zero com "bocel" escolhido dá erro de entrada');
  let eS=true; try{calc({bocel:'sem',avanco:'abc'});}catch(e){eS=false;} ok(eS,'sem saliência ignora o campo de avanço');
  const dB=detalheSVG(calc({avanco:2.5}),{},C), dI=detalheSVG(calc({bocel:'inclinado'}),{},C), dS=detalheSVG(calc({bocel:'sem'}),{},C);
  ok(/bocel 2,5/.test(dB) && /quina 1,5/.test(dI) && /sem saliência/.test(dS),'detalhe desenha e cota cada tipo de borda');
  ok(/espelho reto, sem saliência/.test(explicacao(calc({bocel:'sem'}),calc({bocel:'sem'}).st,C)),'explicação cita a borda escolhida');
}
/* revisão da borda do degrau */
{
  ok(/1,45/.test(calc({avanco:1.45}).checks.find(c=>c.id==='bocel').valor),'avanço 1,45 aparece como 1,45 (não arredonda para 1,5 ao lado do mínimo)');
  let e1=false; try{calc({bocel:'xyz'});}catch(e){e1=!!e.patamar;} ok(e1,'modo de borda inválido dá erro (não vira bocel em silêncio)');
  let e2=false; try{calc({tipo:'helicoidal',bocel:'inclinado'});}catch(e){e2=!!e.patamar&&/placas soltas/.test(e.message);} ok(e2,'helicoidal não aceita espelho inclinado');
  const hs=calc({tipo:'helicoidal',bocel:'sem'}).checks.find(c=>c.id==='bocel'); ok(/placas/.test(hs.valor) && !/espelho inclinado/.test(hs.nota),'helicoidal: borda descrita como placas, sem falar de espelho inclinado');
  let e3=''; try{calc({bocel:'inclinado',avanco:0});}catch(e){e3=e.message;} ok(/Avanço sobre o degrau de baixo/.test(e3) && /Sem saliência/.test(e3),'avanço zero: mensagem com o nome do campo e a sugestão de "Sem saliência"');
  ok(/nota do 3\.10/.test(calc({bocel:'sem'}).checks.find(c=>c.id==='bocel').nota),'espelho inclinado citado pela nota do 3.10 da NBR 9077:2001');
}
/* elevação */
{
  let ruim=0; for(const t of ['reta','reta-patamar','l-patamar','l-leque','u-patamar','u-leque','c-patamar','z-patamar','helicoidal'])for(const l of ['frente','direita','esquerda','fundos'])for(const lado of ['dir','esq']){const sv=elevacaoSVG(calc({tipo:t,lado}),{},C,l); if(/NaN|undefined|Infinity/.test(sv)||/url\(#hcc/.test(sv)||!/ELEVAÇÃO/.test(sv)) ruim++;}
  ok(ruim===0,'elevação nos 9 tipos e 4 lados: sem NaN e sem nada hachurado (nada é cortado)');
  const ev=elevacaoSVG(calc({tipo:'reta'}),{},C,'direita'); ok((ev.match(/<polygon/g)||[]).length>=15 && /LADO DIREITO/.test(ev),'reta, elevação lateral: os 15 degraus em vista');
}
/* varredura */
let n=0,bug=0;for(const t of ['reta','reta-patamar','l-patamar','l-leque','u-patamar','u-leque','c-patamar','z-patamar','helicoidal'])for(const no of ['res','acess'])for(const H of [20,100,280,450,700])for(const lado of ['dir','esq'])for(const leque of ['bal','conv']){try{const X=calc({tipo:t,norma:no,H,L:120,lado,leque});const x=explicacao(X,X.st,C)+planSVG(X,{},C)+planSVG(X,{modo:'sup'},C)+sectionSVG(X,{},C);buildFaces(X,C);if(/NaN|undefined|Infinity/.test(x)){bug++;console.log('RUIM',t,no,H)}n++}catch(e){if(!e.patamar){bug++;console.log('BUG',t,no,H,e.message)}}}
ok(bug===0,'varredura: '+n+' casos sem NaN nem erro de código');
console.log(fail?fail+' falha(s)':'todos passaram');
