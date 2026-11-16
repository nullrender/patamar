const {calc,TIPOS,fmt}=require('./carregar.js');
let bad=0;
function eq(a,b,m,tol=1e-6){ if(Math.abs(a-b)>tol){console.log('FALHOU',m,a,b);bad++;} }
for(const t of TIPOS){
  for(const lado of ['dir','esq']){
    for(const H of [260,280,300,340]){
      const R=calc({tipo:t.id,lado,H});
      // heights: each poly k, last k should be <= T and count
      eq(R.polys.length,R.T,`${t.id} ${lado} H${H} n polys vs T`);
      eq(R.e*R.N,H,'e*N=H');
      // ordem das alturas
      R.polys.forEach((p,i)=>eq(p.k,i+1,'k seq'));
      // sem NaN
      R.polys.forEach(p=>p.pts.forEach(q=>{ if(!isFinite(q[0])||!isFinite(q[1])){console.log('NaN',t.id);bad++;} }));
    }
  }
  const R=calc({tipo:t.id});
  console.log(t.id.padEnd(13),'N',R.N,'e',fmt(R.e,2),'p',fmt(R.p,1),'bl',fmt(R.bl,1),'a/b',R.a,R.b,'bbox',R.bbox.map(v=>Math.round(v)).join(','),
    'checks',R.checks.map(c=>c.id+':'+c.status[0]).join(' '));
}
// continuidade: último poly adjacente ao arrival e polys consecutivos compartilham aresta (L e U)
function cont(t){
  const R=calc({tipo:t,H:280});
  // compare centro do polígono k com k+1: distância razoável
  const cen=p=>{let x=0,y=0;p.pts.forEach(q=>{x+=q[0];y+=q[1]});return [x/p.pts.length,y/p.pts.length];};
  let maxd=0;
  for(let i=0;i<R.polys.length-1;i++){const a=cen(R.polys[i]),b=cen(R.polys[i+1]);maxd=Math.max(maxd,Math.hypot(a[0]-b[0],a[1]-b[1]));}
  console.log('salto max entre centros',t,fmt(maxd,1));
}
['reta','reta-patamar','l-patamar','l-leque','u-patamar','u-leque'].forEach(cont);
// áreas de leque somam área do quadrado L*L
{
 const R=calc({tipo:'l-leque',L:100,H:280});
 const ar=pts=>{let s=0;for(let i=0;i<pts.length;i++){const q=pts[i],r=pts[(i+1)%pts.length];s+=q[0]*r[1]-r[0]*q[1];}return Math.abs(s)/2;};
 const w=R.polys.filter(p=>p.kind==='leque').reduce((s,p)=>s+ar(p.pts),0);
 eq(w,100*100,'área leques = L²',1e-3);
 const R2=calc({tipo:'u-leque',L:100,H:300,nMeio:2});
 const w2=R2.polys.filter(p=>p.kind==='leque').reduce((s,p)=>s+ar(p.pts),0);
 eq(w2,2*100*100,'área leques U = 2L²',1e-3);
}
// valores conhecidos: H=280 -> N=16, e=17.5, p=29
const R=calc({tipo:'reta',H:280});
eq(R.N,16,'N');eq(R.e,17.5,'e');eq(R.p,29,'p');
console.log(R.memo.join('\n'));
console.log('falhas:',bad);
