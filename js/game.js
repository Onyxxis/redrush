'use strict';
/* ZED – LOMÉ RUSH — course infinie en pseudo-3D (Canvas 2D), 100 % côté client */
const $=id=>document.getElementById(id), R=Math.random, rr=(a,b)=>a+R()*(b-a), pick=a=>a[R()*a.length|0];
const cv=$('c'), ctx=cv.getContext('2d');
const CHARS=[
 {id:'GOZED',helmet:'#16a34a',stripe:'#ffffff',shirt:'#f8fafc',desc:'Casque vert · rayures blanches'},
 {id:'ALÉ',helmet:'#16a34a',stripe:'#ffd23f',shirt:'#fde047',desc:'Casque vert · rayures jaunes'},
 {id:'SPARO',helmet:'#facc15',stripe:null,shirt:'#38bdf8',desc:'Casque jaune uni'},
 {id:'GOYAN',helmet:'#dc2626',stripe:null,shirt:'#f97316',desc:'Casque rouge'}];
let sel=0, W, H, HOR, RW, state='menu', best=0, G={};
try{best=+localStorage.getItem('zedBest')||0}catch(e){}
const ayImg=new Image(); ayImg.src='assets/ayimolou.png';

/* ---------- Audio ---------- */
let AC,snd=true,eng;
const actx=()=>{if(!AC)try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}return AC};
function tone(f,d,type='square',v=.07,f2,delay=0){if(!snd||!actx())return;const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d)}
const sfx={beep:()=>tone(440,.15),go:()=>tone(880,.5),coin:()=>{tone(660,.1,'triangle',.12);tone(990,.18,'triangle',.12,0,.09)},
 crash:()=>{tone(200,.4,'sawtooth',.18,35);tone(90,.3,'square',.12,30)},smash:()=>tone(300,.2,'sawtooth',.1,80),near:()=>tone(1200,.08,'sine',.06),
 power:()=>[523,659,784,1046,1318].forEach((f,i)=>tone(f,.25,'triangle',.12,0,i*.08)),end:()=>tone(500,.5,'sawtooth',.1,100),
 over:()=>[400,330,260,160].forEach((f,i)=>tone(f,.3,'square',.09,0,i*.2))};
function engine(on){if(eng){try{eng.o.stop()}catch(e){}eng=null}if(on&&snd&&actx()){const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';g.gain.value=.025;o.connect(g);g.connect(AC.destination);o.start();eng={o,g}}}

/* ---------- Dessin : motards, véhicules, décor ---------- */
function bike(g,cx,by,w,o){
 const k=o.front?1:0; g.save();g.translate(cx,by);if(o.lean)g.rotate(o.lean);
 g.fillStyle='#111';g.fillRect(-.11*w,-.45*w,.22*w,.45*w);                       // pneu
 g.fillStyle=o.body||'#2b2f36';g.beginPath();g.roundRect(-.2*w,-.62*w,.4*w,.3*w,6);g.fill(); // carénage
 g.fillStyle=k?'#fffbd0':'#ff2a1f';g.shadowColor=g.fillStyle;g.shadowBlur=o.glow||8;g.fillRect(-.07*w,-.55*w,.14*w,.07*w);g.shadowBlur=0;
 g.fillStyle=o.shirt;g.beginPath();g.moveTo(-.2*w,-.55*w);g.lineTo(.2*w,-.55*w);g.lineTo(.3*w,-1.1*w);g.lineTo(-.3*w,-1.1*w);g.fill();   // buste
 g.fillStyle='rgba(0,0,0,.18)';g.fillRect(-.02*w,-1.05*w,.04*w,.5*w);
 g.strokeStyle=o.shirt;g.lineWidth=.1*w;g.lineCap='round';g.beginPath();g.moveTo(-.27*w,-1.0*w);g.lineTo(-.5*w,-.7*w);g.moveTo(.27*w,-1.0*w);g.lineTo(.5*w,-.7*w);g.stroke();
 g.strokeStyle='#111';g.lineWidth=.045*w;g.beginPath();g.moveTo(-.58*w,-.7*w);g.lineTo(.58*w,-.7*w);g.stroke();
 const hx=0,hy=-1.3*w,hr=.24*w; g.save();g.beginPath();g.arc(hx,hy,hr,0,7);g.clip();g.fillStyle=o.helmet;g.fillRect(hx-hr,hy-hr,hr*2,hr*2);
 if(o.stripe){g.fillStyle=o.stripe;g.fillRect(hx-.09*hr*2,hy-hr,.07*hr*2,hr*2);g.fillRect(hx+.02*hr*2,hy-hr,.07*hr*2,hr*2)}
 g.fillStyle='rgba(255,255,255,.28)';g.beginPath();g.ellipse(hx-hr*.35,hy-hr*.4,hr*.3,hr*.2,-.6,0,7);g.fill();
 if(k){g.fillStyle='#222';g.fillRect(hx-hr,hy-.1*hr,hr*2,hr*.55)}g.restore();
 g.restore()}
function vehicle(g,v,cx,by,U){
 const d=VT[v.t],w=d.w*U,h=d.h*U;g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(cx,by,w*.62,w*.09,0,0,7);g.fill();
 if(v.t=='zemi')return bike(g,cx,by,w*1.2,{shirt:v.shirt,helmet:v.helm,front:v.front,stripe:null});
 const f=v.front,x=cx-w/2,c=v.c;
 g.fillStyle='#16181c';g.fillRect(x+w*.04,by-h*.24,w*.2,h*.24);g.fillRect(x+w*.76,by-h*.24,w*.2,h*.24);
 if(v.t=='bus'){g.fillStyle=c;g.beginPath();g.roundRect(x,by-h*.95,w,h*.8,w*.05);g.fill();g.fillStyle='#fff';g.fillRect(x,by-h*.55,w,h*.1);
  g.fillStyle='#1d3b52';g.fillRect(x+w*.08,by-h*.88,w*.84,h*.28)}
 else{g.fillStyle=c;g.beginPath();g.roundRect(x,by-h*.55,w,h*.38,w*.06);g.fill();
  if(v.t=='pick'){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+w*.06,by-h*.8,w*.88,h*.26);g.fillStyle=c;g.fillRect(x+w*.1,by-h*.95,w*.8,h*.4)}
  else{g.beginPath();g.moveTo(x+w*.1,by-h*.55);g.lineTo(x+w*.22,by-h*.98);g.lineTo(x+w*.78,by-h*.98);g.lineTo(x+w*.9,by-h*.55);g.fill()}
  g.fillStyle='#1d3b52';g.beginPath();g.moveTo(x+w*.2,by-h*.58);g.lineTo(x+w*.27,by-h*.9);g.lineTo(x+w*.73,by-h*.9);g.lineTo(x+w*.8,by-h*.58);g.fill();
  if(v.t=='taxi'){g.fillStyle='#fff';g.fillRect(cx-w*.1,by-h*1.08,w*.2,h*.1)}}
 g.fillStyle=f?'#fffbd0':'#ff2a1f';g.shadowColor=g.fillStyle;g.shadowBlur=10;const ly=by-h*(v.t=='bus'?.3:.4);g.fillRect(x+w*.04,ly,w*.16,h*.08);g.fillRect(x+w*.8,ly,w*.16,h*.08);g.shadowBlur=0;
 g.fillStyle='#f5f5f5';g.fillRect(cx-w*.14,by-h*.3,w*.28,h*.1)}
function scen(g,o,cx,by,U){
 const s=o.sz;switch(o.k){
 case'palm':g.strokeStyle='#6b4a2b';g.lineWidth=U*.05;g.beginPath();g.moveTo(cx,by);g.quadraticCurveTo(cx+U*.1*o.d,by-U*.6,cx+U*.05*o.d,by-U*1.2*s);g.stroke();
  g.strokeStyle='#1f8a3a';g.lineWidth=U*.04;for(let i=0;i<7;i++){const a=i/7*Math.PI*2,tx=cx+U*.05*o.d,ty=by-U*1.2*s;g.beginPath();g.moveTo(tx,ty);g.quadraticCurveTo(tx+Math.cos(a)*U*.3,ty-U*.2+Math.sin(a)*U*.1,tx+Math.cos(a)*U*.5,ty+U*.15+Math.sin(a)*U*.15);g.stroke()}break;
 case'tree':g.fillStyle='#5b3d22';g.fillRect(cx-U*.03,by-U*.5,U*.06,U*.5);g.fillStyle='#2f8f3f';g.beginPath();g.arc(cx,by-U*.7*s,U*.32*s,0,7);g.fill();g.fillStyle='#46b04f';g.beginPath();g.arc(cx-U*.1,by-U*.78*s,U*.2*s,0,7);g.fill();break;
 case'bldg':case'tower':{const w=U*(o.k=='tower'?.5:.6),h=U*o.h;g.fillStyle=o.c;g.fillRect(cx-w/2,by-h,w,h);g.fillStyle='rgba(0,0,0,.14)';g.fillRect(cx+(o.d>0?-w/2:w/2-w*.18),by-h,w*.18,h);
  g.fillStyle=o.k=='tower'?'#cfeefc':'#3b4a5a';const cols=4,rows=Math.max(2,h/(U*.17)|0);for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)g.fillRect(cx-w/2+w*.08+i*w*.23,by-h+U*.06+j*h/rows,w*.14,h/rows*.45);
  if(o.k=='bldg'){g.fillStyle=o.a;g.fillRect(cx-w/2,by-U*.12,w,U*.12)}break}
 case'stall':g.fillStyle='#444';g.fillRect(cx-U*.01,by-U*.36,U*.02,U*.36);g.fillStyle=o.c;g.beginPath();g.arc(cx,by-U*.36,U*.22,Math.PI,0);g.fill();g.fillStyle='#fff8';g.fillRect(cx-U*.22,by-U*.37,U*.44,U*.02);break;
 case'bill':g.fillStyle='#555';g.fillRect(cx-U*.25,by-U*.7,U*.03,U*.7);g.fillRect(cx+U*.22,by-U*.7,U*.03,U*.7);g.fillStyle=o.c;g.fillRect(cx-U*.32,by-U*1.1,U*.64,U*.4);g.fillStyle='#fff';g.font=`900 ${U*.14}px Arial Black,Arial`;g.textAlign='center';g.fillText(o.t,cx,by-U*.83);break;
 case'lamp':g.strokeStyle='#cfd5da';g.lineWidth=U*.025;g.beginPath();g.moveTo(cx,by);g.lineTo(cx,by-U*1.1);g.quadraticCurveTo(cx,by-U*1.25,cx-U*.2*o.d,by-U*1.22);g.stroke();g.fillStyle='#fff6c8';g.fillRect(cx-U*.28*o.d-U*.06,by-U*1.24,U*.12,U*.04);break;
 case'church':{const w=U*.7,h=U*.55;g.fillStyle='#d9778f';g.fillRect(cx-w/2,by-h,w,h);g.fillStyle='#2f8f5a';g.beginPath();g.moveTo(cx-w/2,by-h);g.lineTo(cx,by-h*1.35);g.lineTo(cx+w/2,by-h);g.fill();
  [-1,1].forEach(q=>{g.fillStyle='#c4506f';g.fillRect(cx+q*w*.32-w*.09,by-h*1.4,w*.18,h*1.4);g.fillStyle='#2f8f5a';g.beginPath();g.moveTo(cx+q*w*.32-w*.11,by-h*1.4);g.lineTo(cx+q*w*.32,by-h*2.1);g.lineTo(cx+q*w*.32+w*.11,by-h*1.4);g.fill()});break}
 case'mono':{const w=U*.8,h=U*1.5;g.fillStyle='#8a7766';g.fillRect(cx-w/2,by-h,w*.28,h);g.fillRect(cx+w/2-w*.28,by-h,w*.28,h);g.fillStyle='#6d5d4e';g.fillRect(cx-w*.14,by-h,w*.28,h*.18);
  g.fillStyle='#fff';g.beginPath();g.moveTo(cx,by-h*.9);g.lineTo(cx-w*.1,by-h*.4);g.lineTo(cx+w*.1,by-h*.4);g.fill();g.fillStyle='#fff';g.fillRect(cx-w*.3,by-h*.15,w*.6,U*.04);break}}}
const VT={car:{w:.34,h:.26},taxi:{w:.34,h:.26},bus:{w:.44,h:.5},pick:{w:.36,h:.34},zemi:{w:.15,h:.3}};
const CARC=['#e5e7eb','#9ca3af','#1e3a8a','#b91c1c','#f1f5f9','#374151','#d4a017'];

/* ---------- Projection ---------- */
function proj(x,z){const s=1/(1+z*.09),e=(1-s)*(1-s);return{x:W/2+G.curve*e*W*.4+x*RW*s,y:HOR+(H*.93-HOR)*s,s,U:RW*s}}
function quad(a,b,z0,z1,c){const p=proj(a,z0),q=proj(b,z0),r=proj(b,z1),t=proj(a,z1);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.lineTo(t.x,t.y);ctx.fill()}
function resize(){const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);HOR=H*.4;RW=Math.min(W*(W<H?.62:.4),H*.9)}
addEventListener('resize',resize);resize();

/* ---------- Entrées ---------- */
const K={};let touch=0;
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(e.key.startsWith('Arrow'))e.preventDefault();K[k]=1;if(state=='select'&&k=='enter')startGame()});
addEventListener('keyup',e=>K[e.key.toLowerCase()]=0);
cv.addEventListener('pointerdown',e=>{touch=e.clientX<W/2?-1:1});cv.addEventListener('pointermove',e=>{if(touch)touch=e.clientX<W/2?-1:1});
['pointerup','pointercancel','pointerleave'].forEach(n=>cv.addEventListener(n,()=>touch=0));

/* ---------- Écrans ---------- */
function show(n){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==n));document.body.classList.remove('playing');state=n}
const bg=$('bg');for(let i=1;i<=18;i++){const im=new Image();im.src='assets/photos/lome-'+i+(i==18?'.png':'.webp');bg.appendChild(im)}
let bi=0;function slide(){const a=bg.children;if(!a.length)return;a[bi].classList.remove('on');bi=(bi+1)%a.length;a[bi].classList.add('on')}
bg.children[0].classList.add('on');setInterval(slide,5500);
const cards=$('cards');CHARS.forEach((c,i)=>{const d=document.createElement('div');d.className='card';d.innerHTML=`<canvas width="200" height="230"></canvas><b>${c.id}</b><small>${c.desc}</small>`;d.onclick=()=>{sel=i;actx();sfx.beep();[...cards.children].forEach((x,j)=>x.classList.toggle('sel',j==i))};c.cv=d.firstChild;cards.appendChild(d)});
cards.children[0].classList.add('sel');
const hero=$('hero').getContext('2d');
function drawChar(g,c,t,w,h,sc){g.clearRect(0,0,w,h);g.save();g.translate(0,Math.sin(t*4)*2);
 g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(w/2,h*.88,w*.28,h*.04,0,0,7);g.fill();
 bike(g,w/2,h*.88,w*sc,{shirt:c.shirt,helmet:c.helmet,stripe:c.stripe,lean:Math.sin(t*2)*.05,glow:14});g.restore()}
$('bSnd').onclick=()=>{snd=!snd;$('bSnd').textContent='SON : '+(snd?'ACTIVÉ':'DÉSACTIVÉ');actx();if(!snd)engine(false)};
$('bPlay').onclick=()=>{actx();sfx.beep();show('select')};$('bHow').onclick=()=>show('how');$('bHowBack').onclick=()=>show('menu');$('bSelBack').onclick=()=>show('menu');
$('bGo').onclick=startGame;$('bRetry').onclick=startGame;$('bMenu').onclick=()=>show('menu');

/* ---------- Partie ---------- */
function newScen(o,z){const r=R();o.z=z;o.d=R()<.5?-1:1;o.sz=rr(.8,1.2);o.x=o.d*rr(1.3,1.9);
 if(r<.33){o.k='palm';o.x=o.d*rr(1.2,1.5)}else if(r<.5){o.k='bldg';o.x=o.d*rr(1.7,2.3);o.h=rr(.7,1.5);o.c=pick(['#f4c6b0','#e9d8a6','#cfe3e8','#f2a65a','#d98ea0','#e8e8e8']);o.a=pick(['#7a4','#b33','#36a'])}
 else if(r<.62){o.k='stall';o.x=o.d*rr(1.15,1.4);o.c=pick(['#e63329','#ffd23f','#1fbf5a','#3b82f6','#f97316'])}else if(r<.72){o.k='tree';o.x=o.d*rr(1.3,1.8)}
 else if(r<.8){o.k='bill';o.x=o.d*rr(1.5,1.9);o.c=pick(['#1fbf5a','#e63329','#2563eb','#d97706']);o.t=pick(['LOMÉ','ZED','TOGO','MARCHÉ','GO !'])}
 else if(r<.9){o.k='lamp';o.x=o.d*1.12}else if(r<.95){o.k='tower';o.x=o.d*rr(2,2.6);o.h=rr(2,3);o.c=pick(['#2f9aa8','#3b8fb5','#4aa3a0'])}
 else if(r<.975){o.k='church';o.x=o.d*2.1}else{o.k='mono';o.x=o.d*2.2}return o}
function startGame(){
 actx();sfx.beep();document.body.classList.add('playing');document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
 G={ch:CHARS[sel],px:0,vx:0,speed:0,dist:0,score:0,lives:3,ay:0,t:0,off:0,curve:0,ctarget:0,invuln:0,invT:0,shake:0,vs:[],it:[],sc:[],pa:[],sp:1.2,ap:rr(8,12),nm:0,near:0,ghost:0};
 for(let i=0;i<30;i++)G.sc.push(newScen({},i*2.8));
 state='count';$('light').classList.add('on');$('lr').className='r';$('lg').className='';updHud(true);
 const c=$('cnt');let n=3;const tick=()=>{if(state!='count')return;if(n>0){c.textContent=n;c.classList.remove('tick');void c.offsetWidth;c.classList.add('tick');sfx.beep();n--;setTimeout(tick,850)}
  else{c.textContent='GO !';$('lr').className='';$('lg').className='g';sfx.go();state='play';engine(true);setTimeout(()=>$('light').classList.remove('on'),700)}};tick()}
function popup(t){const p=$('pop');p.textContent=t;p.classList.remove('show');void p.offsetWidth;p.classList.add('show')}
function burst(x,y,col,n=22,sp=300){for(let i=0;i<n;i++){const a=R()*7,v=rr(60,sp);G.pa.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,l:rr(.4,.9),m:.9,c:col,r:rr(2,6)})}}
function spawn(){
 const lanes=[-.75,-.25,.25,.75].sort(()=>R()-.5),n=(G.t>25&&R()<.35+G.t/400)?2:1;
 for(let i=0;i<n;i++){const x=lanes[i],r=R(),t=r<.32?'zemi':r<.5?'taxi':r<.75?'car':r<.88?'pick':'bus';
  const wrong=(t=='zemi'||t=='car')&&R()<.16&&G.t>8;
  const v={t,x,z:72,c:t=='taxi'?'#f5c518':t=='bus'?pick(['#1fa24a','#f1f5f9']):pick(CARC),v:rr(3,8),front:wrong,shirt:pick(['#ffd23f','#facc15','#fde047','#22c55e']),helm:pick(['#111','#eee','#2563eb',null]),sw:0,ph:R()*7,done:0,tx:x};
  if(t=='zemi'&&R()<.4)v.sw=1;G.vs.push(v)}}
function loseLife(){
 if(G.invuln>0||G.invT>0)return;G.lives--;G.invuln=1.8;G.shake=.5;sfx.crash();burst(W/2,H*.8,'#ffb703',30);burst(W/2,H*.8,'#ff3d2e',18);updHud(true);
 if(G.lives<=0)gameOver()}
function gameOver(){state='over';engine(false);sfx.over();const nb=G.score>best;if(nb){best=G.score;try{localStorage.setItem('zedBest',best)}catch(e){}}
 setTimeout(()=>{show('over');$('oWho').textContent='Motard : '+G.ch.id;$('oSc').textContent=G.score.toLocaleString('fr');$('oDi').textContent=Math.floor(G.dist)+' m';$('oBest').textContent=best.toLocaleString('fr');$('oAy').textContent=G.ay;$('newrec').style.display=nb?'block':'none'},900)}
let last={};function setT(id,v){if(last[id]!==v){last[id]=v;const e=$(id);e.textContent=v;if(id!='hSp'){e.classList.add('bump');setTimeout(()=>e.classList.remove('bump'),130)}}}
function updHud(f){setT('hSc',G.score);setT('hDi',Math.floor(G.dist)+' m');setT('hSp',Math.round(G.speed*7)+' km/h');setT('hAy',G.ay);
 if(f||last.l!==G.lives){last.l=G.lives;$('hearts').innerHTML=[0,1,2].map(i=>`<span class="${i<G.lives?'':'off'}">❤️</span>`).join('')}
 const p=G.ay%5,k=p+'|'+G.invT;if(f||last.p!==p){last.p=p;$('pips').innerHTML=[0,1,2,3,4].map(i=>`<i class="${i<p?'f':''}"></i>`).join('')}
 const on=G.invT>0;$('inv').classList.toggle('on',on);if(on){$('invT').textContent=Math.ceil(G.invT);$('invBar').style.width=(G.invT/30*100)+'%'}}
function update(dt){
 G.t+=dt;const L=K.arrowleft||K.a||K.q||touch<0,Rt=K.arrowright||K.d||touch>0;
 const base=Math.min(12+G.t*.2,30);G.speed+=((base+(K.arrowup||K.w||K.z?5:0)-(K.arrowdown||K.s?4:0))-G.speed)*Math.min(1,dt*2.5);
 const tv=((Rt?1:0)-(L?1:0))*1.8;G.vx+=(tv-G.vx)*Math.min(1,dt*9);G.px=Math.max(-.86,Math.min(.86,G.px+G.vx*dt));
 G.dist+=G.speed*dt*1.1;G.sacc=(G.sacc||0)+G.speed*dt*1.1*(G.invT>0?2:1);const si=Math.floor(G.sacc);G.sacc-=si;G.score+=si;
 G.off+=G.speed*dt;G.ctarget=Math.sin(G.dist*.006)*.6+Math.sin(G.dist*.0023)*.4;G.curve+=(G.ctarget-G.curve)*dt*2;
 if(G.invuln>0)G.invuln-=dt;if(G.shake>0)G.shake-=dt;if(G.invT>0){G.invT-=dt;if(G.invT<=0){G.invT=0;sfx.end();popup('Fin de l\'invincibilité')}}
 G.sp-=dt;if(G.sp<=0){spawn();G.sp=Math.max(.42,1.25-G.t*.011)*rr(.7,1.2)}
 G.ap-=dt;if(G.ap<=0){G.it.push({z:72,x:pick([-.75,-.25,.25,.75]),ph:R()*7});G.ap=rr(9,15)}
 G.sc.forEach(o=>{o.z-=G.speed*dt;if(o.z<-3)newScen(o,o.z+84)});
 for(const v of G.vs){v.z-=(v.front?G.speed+9:G.speed-v.v)*dt;
  if(v.sw&&v.z<42&&!v.done){v.done=1;v.tx=Math.max(-.75,Math.min(.75,v.x+pick([-.5,.5])))}if(v.tx!=v.x)v.x+=Math.sign(v.tx-v.x)*Math.min(Math.abs(v.tx-v.x),dt*.45);
  const hw=(VT[v.t].w+.16)/2;
  if(!v.hit&&v.z<.9&&v.z>-.7){if(Math.abs(v.x-G.px)<hw){if(G.invT>0){v.hit=1;v.z=-99;G.score+=100;sfx.smash();burst(W/2+(v.x-G.px)*RW*.5,H*.7,'#7ff',20);popup('+100 BOUM !')}else if(G.invuln<=0){loseLife();v.hit=1;v.vz=1}}
   else if(!v.near&&v.z<.3&&Math.abs(v.x-G.px)<hw+.14){v.near=1;G.score+=50;G.nm++;sfx.near();popup('FRÔLÉ ! +50')}}}
 G.vs=G.vs.filter(v=>v.z>-6);
 for(const a of G.it){a.z-=G.speed*dt;if(!a.got&&a.z<.9&&a.z>-.7&&Math.abs(a.x-G.px)<.2){a.got=1;a.z=-99;G.ay++;G.score+=25;sfx.coin();burst(W/2+(a.x-G.px)*RW*.5,H*.75,'#ffd23f',18);
   if(G.ay%5==0){G.invT=30;sfx.power();popup('INVINCIBLE 30 s !');burst(W/2,H*.8,'#0ff',50,500)}else popup('AYIMOLOU '+(G.ay%5)+'/5')}}
 G.it=G.it.filter(a=>a.z>-6);
 for(const p of G.pa){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;p.l-=dt}G.pa=G.pa.filter(p=>p.l>0);
 if(eng)eng.o.frequency.value=55+G.speed*5.5;updHud()}
/* ---------- Rendu ---------- */
function drawWorld(){
 const g=ctx;g.clearRect(0,0,W,H);
 // décor : chaque objet est positionné via proj(x,z)
 const t=G.t,bl=1.5,k=Math.floor(G.off/bl),fr=G.off%bl;
 let gr=g.createLinearGradient(0,0,0,HOR);gr.addColorStop(0,'#5fb4e6');gr.addColorStop(1,'#f8e3b0');
 g.save();if(G.shake>0)g.translate(rr(-1,1)*G.shake*24,rr(-1,1)*G.shake*24);
 g.fillStyle=gr;g.fillRect(-30,-30,W+60,HOR+30);g.fillStyle='rgba(255,240,190,.6)';g.beginPath();g.arc(W*.72,HOR*.55,H*.07,0,7);g.fill();
 g.fillStyle='#b4c6d4';for(let i=0;i<26;i++){const bx=((i*W/24+G.curve*W*.12)%(W+80)+W+80)%(W+80)-40,bh=((i*7919)%13+4)*H*.006;g.fillRect(bx,HOR-bh,W/28,bh)}
 g.fillStyle='#c7864a';g.fillRect(-30,HOR,W+60,H-HOR+30);
 for(let i=62;i>=0;i--){const z0=i*bl-fr,z1=z0+bl+.03,par=(k+i)&1;
  quad(-1.7,-1,z0,z1,par?'#d8b98a':'#d0b080');quad(1,1.7,z0,z1,par?'#d8b98a':'#d0b080');quad(-1,1,z0,z1,par?'#4b4b52':'#55555c');
  quad(-1,-.97,z0,z1,'#eee');quad(.97,1,z0,z1,'#eee');quad(-.015,.015,z0,z1,'#f5c518');if(par){quad(-.515,-.485,z0,z1,'#fff');quad(.485,.515,z0,z1,'#fff')}
  if(par){quad(-1.7,-1.62,z0,z1,'#e63329');quad(1.62,1.7,z0,z1,'#e63329')}}
 const L=[];
 G.sc.forEach(o=>L.push({z:o.z,x:o.x,f:p=>scen(g,o,p.x,p.y,p.U)}));
 G.vs.forEach(v=>{if(v.z>-5)L.push({z:v.z,x:v.x,f:p=>{vehicle(g,v,p.x,p.y,p.U)}})});
 G.it.forEach(a=>L.push({z:a.z,x:a.x,f:p=>{const r=p.U*.2,y=p.y-r*1.4+Math.sin(t*5+a.ph)*r*.15;g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(p.x,p.y,r*.9,r*.2,0,0,7);g.fill();
  g.shadowColor='#ffd23f';g.shadowBlur=24;g.fillStyle='#ffd23f';g.beginPath();g.arc(p.x,y,r*1.1,0,7);g.fill();g.shadowBlur=0;
  g.save();g.beginPath();g.arc(p.x,y,r,0,7);g.clip();if(ayImg.complete&&ayImg.naturalWidth)g.drawImage(ayImg,p.x-r,y-r,r*2,r*2);else{g.fillStyle='#c0392b';g.fillRect(p.x-r,y-r,r*2,r*2)}g.restore()}}));
 L.sort((a,b)=>b.z-a.z);L.forEach(o=>{if(o.z>-4&&o.z<85)o.f(proj(o.x,o.z))});
 // lignes de vitesse
 if(G.speed>14){g.strokeStyle='rgba(255,255,255,'+Math.min(.35,(G.speed-14)/40)+')';g.lineWidth=2;for(let i=0;i<14;i++){const a=((i*137+G.off*7)%100)/100,sd=i%2?1:-1,x0=W/2+sd*(W*.12+a*W*.4),y0=HOR+a*(H-HOR);g.beginPath();g.moveTo(x0,y0);g.lineTo(x0+sd*a*W*.08,y0+a*H*.12);g.stroke()}}
 // joueur
 const p=proj(G.px,0),U=p.U,by=H*.93;
 if(G.invT>0){const r=U*.42,gg=g.createRadialGradient(p.x,by-U*.2,r*.2,p.x,by-U*.2,r);gg.addColorStop(0,'rgba(0,255,255,0)');gg.addColorStop(.8,'rgba(0,255,255,.25)');gg.addColorStop(1,'rgba(255,230,80,.7)');g.fillStyle=gg;g.beginPath();g.arc(p.x,by-U*.2,r,0,7);g.fill()}
 if(!(G.invuln>0&&Math.floor(G.t*14)%2))bike(g,p.x,by,U*.3,{shirt:G.ch.shirt,helmet:G.ch.helmet,stripe:G.ch.stripe,lean:G.vx*.12,glow:G.invT>0?30:12});
 g.restore();
 for(const q of G.pa){g.globalAlpha=Math.max(0,q.l/q.m);g.fillStyle=q.c;g.beginPath();g.arc(q.x,q.y,q.r,0,7);g.fill()}g.globalAlpha=1}
let lt=0;
function loop(ts){const dt=Math.min(.05,(ts-lt)/1000||0);lt=ts;
 if(state=='play'){update(dt);drawWorld()}else if(state=='count'){G.t+=0;drawWorld();G.off+=0}else if(state=='over'){G.speed*=.96;for(const q of G.pa){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=500*dt;q.l-=dt}drawWorld()}
 const T=ts/1000;
 if(state=='menu')drawChar(hero,CHARS[0],T,360,300,.9);
 if(state=='select')CHARS.forEach((c,i)=>drawChar(c.cv.getContext('2d'),c,T+i,200,230,i==sel?.95:.8));
 requestAnimationFrame(loop)}
requestAnimationFrame(loop);

/* ======== v2 : mode jour/nuit, décors réalistes, monuments ======== */
let night=false;try{night=localStorage.getItem('zedMode')=='night'}catch(e){}
function setMode(n,beep){night=n;try{localStorage.setItem('zedMode',n?'night':'day')}catch(e){}$('bDay').classList.toggle('on',!n);$('bNight').classList.toggle('on',n);if(beep){actx();sfx.beep()}}
$('bDay').onclick=()=>setMode(false,1);$('bNight').onclick=()=>setMode(true,1);setMode(night,0);
function mix(h,a){const n=parseInt(h.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=a<0?0:255,t=Math.abs(a);return`rgb(${Math.round(r+(f-r)*t)},${Math.round(g+(f-g)*t)},${Math.round(b+(f-b)*t)})`}
function grad(g,x0,y0,x1,y1,h,a=.2){const q=g.createLinearGradient(x0,y0,x1,y1);q.addColorStop(0,mix(h,a));q.addColorStop(1,mix(h,-a));return q}
let LT=[];const glow=(x,y,r,c)=>{if(night)LT.push([x,y,r,c])};
const STARS=Array.from({length:150},()=>({x:R(),y:R(),r:rr(.6,1.8),p:R()*7})),CLD=Array.from({length:7},()=>({x:R(),y:rr(.05,.8),s:rr(.6,1.4),v:rr(.004,.01)}));
const LMS=[{k:'mono',n:"Monument de l'Indépendance"},{k:'church',n:'Cathédrale du Sacré-Cœur'}];
const _ns=newScen;newScen=function(o,z){_ns(o,z);o.aw=pick(['#d33a2c','#1fa24a','#e9a400','#2563eb']);
 if(o.k=='mono'||o.k=='church')o.k='palm';else if(R()<.2&&o.k!='tower'){o.k='ped';o.x=o.d*rr(1.08,1.3);o.c=pick(['#e63329','#ffd23f','#2563eb','#fff','#1fbf5a','#f97316']);o.sk=pick(['#5a3825','#7a4a2e','#3d2616'])}return o};
function scen(g,o,cx,by,U){const s=o.sz,d=o.d,T=G.t||0;
 g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(cx+d*U*.08,by,U*.22*s,U*.03,0,0,7);g.fill();
 switch(o.k){
 case'palm':{const tx=cx+U*.07*d,ty=by-U*1.25*s;g.lineCap='round';g.strokeStyle='#7a5632';g.lineWidth=U*.055;g.beginPath();g.moveTo(cx,by);g.quadraticCurveTo(cx+U*.12*d,by-U*.6,tx,ty);g.stroke();
  g.strokeStyle='#a98350';g.lineWidth=U*.012;g.beginPath();g.moveTo(cx-U*.015,by);g.quadraticCurveTo(cx+U*.1*d,by-U*.6,tx-U*.015,ty);g.stroke();
  for(let i=0;i<10;i++){const a=i/10*6.283+.3+Math.sin(T*2+i)*.03,l=U*(.5+.08*(i%2)),ex=tx+Math.cos(a)*l,ey=ty+Math.sin(a)*l*.45+l*.35;g.fillStyle=i%2?'#1c7a35':'#2fa24c';g.beginPath();g.moveTo(tx,ty);g.quadraticCurveTo(tx+Math.cos(a)*l*.5,ty-U*.2+Math.sin(a)*l*.2,ex,ey);g.quadraticCurveTo(tx+Math.cos(a)*l*.5,ty-U*.06+Math.sin(a)*l*.25,tx,ty);g.fill()}
  g.fillStyle='#5b3a1a';g.beginPath();g.arc(tx-U*.02,ty+U*.03,U*.03,0,7);g.arc(tx+U*.03,ty+U*.045,U*.03,0,7);g.fill();break}
 case'tree':g.fillStyle='#5b3d22';g.fillRect(cx-U*.03,by-U*.55,U*.06,U*.55);[['#1f7a35',0,.75,.34],['#2f9a45',-.12,.82,.24],['#49b85a',.1,.88,.2]].forEach(c=>{g.fillStyle=c[0];g.beginPath();g.arc(cx+c[1]*U,by-c[2]*U*s,c[3]*U*s,0,7);g.fill()});break;
 case'bldg':case'tower':{const tw=o.k=='tower',w=U*(tw?.5:.62),h=U*o.h,c=o.c,rows=Math.max(2,h/(U*.2)|0),cols=tw?5:4,fh=h/rows;
  g.fillStyle=grad(g,cx-w/2,0,cx+w/2,0,c,.16);g.fillRect(cx-w/2,by-h,w,h);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(d>0?cx-w/2:cx+w/2-w*.14,by-h,w*.14,h);
  g.fillStyle=mix(c,-.35);g.fillRect(cx-w/2-U*.01,by-h-U*.025,w+U*.02,U*.03);
  for(let j=0;j<rows-(tw?0:1);j++)for(let i=0;i<cols;i++){const lit=night&&((i*7+j*3+(o.h*10|0))%3==0);g.fillStyle=lit?'#ffd98a':(tw?'#bfe6f5':'#31475c');g.fillRect(cx-w/2+w*.07+i*w*.9/cols,by-h+fh*j+fh*.2,w*.9/cols*.6,fh*.48);
   if(!tw&&j>0){g.fillStyle=mix(c,-.4);g.fillRect(cx-w/2,by-h+fh*j,w,U*.014)}}
  if(tw){g.fillStyle='#888';g.fillRect(cx-1,by-h-U*.25,2,U*.25);glow(cx,by-h-U*.25,U*.12,'255,40,30')}
  else{g.fillStyle=o.aw;g.fillRect(cx-w/2,by-fh*.95,w,fh*.28);g.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<8;i++)g.fillRect(cx-w/2+i*w/8,by-fh*.95,w/16,fh*.28);g.fillStyle=night?'#ffd98a':'#222';g.fillRect(cx-w*.3,by-fh*.62,w*.6,fh*.5);glow(cx,by-fh*.4,U*.3,'255,200,110')}break}
 case'stall':g.fillStyle='#444';g.fillRect(cx-U*.01,by-U*.38,U*.02,U*.38);for(let i=0;i<6;i++){g.fillStyle=i%2?'#fff':o.c;g.beginPath();g.moveTo(cx,by-U*.4);g.arc(cx,by-U*.36,U*.24,Math.PI+i*Math.PI/6,Math.PI+(i+1)*Math.PI/6);g.fill()}
  g.fillStyle='#8a5a2b';g.fillRect(cx-U*.15,by-U*.12,U*.3,U*.05);['#e63329','#ffd23f','#1fbf5a'].forEach((c,i)=>{g.fillStyle=c;g.beginPath();g.arc(cx-U*.09+i*U*.09,by-U*.14,U*.03,0,7);g.fill()});glow(cx,by-U*.2,U*.25,'255,190,90');break;
 case'bill':g.fillStyle='#555';g.fillRect(cx-U*.25,by-U*.7,U*.03,U*.7);g.fillRect(cx+U*.22,by-U*.7,U*.03,U*.7);g.fillStyle='#222';g.fillRect(cx-U*.34,by-U*1.12,U*.68,U*.44);g.fillStyle=grad(g,0,by-U*1.1,0,by-U*.7,o.c,.2);g.fillRect(cx-U*.32,by-U*1.1,U*.64,U*.4);g.fillStyle='#fff';g.font=`900 ${U*.14}px Arial Black,Arial`;g.textAlign='center';g.fillText(o.t,cx,by-U*.83);glow(cx,by-U*.9,U*.5,'255,255,255');break;
 case'lamp':g.strokeStyle='#cfd5da';g.lineWidth=U*.025;g.beginPath();g.moveTo(cx,by);g.lineTo(cx,by-U*1.1);g.quadraticCurveTo(cx,by-U*1.25,cx-U*.2*d,by-U*1.22);g.stroke();g.fillStyle='#fff6c8';g.fillRect(cx-U*.3*d-U*.06,by-U*1.24,U*.12,U*.04);glow(cx-U*.3*d,by-U*1.2,U*.7,'255,225,150');break;
 case'ped':{const sw=Math.sin(T*6+o.x*9)*U*.02,hh=U*.3;g.strokeStyle='#223';g.lineWidth=U*.025;g.beginPath();g.moveTo(cx,by-hh*.45);g.lineTo(cx+sw,by);g.moveTo(cx,by-hh*.45);g.lineTo(cx-sw,by);g.stroke();
  g.fillStyle=o.c;g.fillRect(cx-U*.04,by-hh*.85,U*.08,hh*.42);g.fillStyle=o.sk;g.beginPath();g.arc(cx,by-hh*.95,U*.035,0,7);g.fill();break}
 case'church':{const w=U*.7*s,hh=U*.55*s;g.fillStyle=grad(g,cx-w/2,0,cx+w/2,0,'#d9778f',.15);g.fillRect(cx-w/2,by-hh,w,hh);g.fillStyle='#f5e6e0';g.fillRect(cx-w/2,by-hh*.08,w,hh*.08);
  g.fillStyle='#2f8f5a';g.beginPath();g.moveTo(cx-w/2,by-hh);g.lineTo(cx,by-hh*1.35);g.lineTo(cx+w/2,by-hh);g.fill();
  [-1,1].forEach(q=>{const tx=cx+q*w*.32;g.fillStyle=grad(g,tx-w*.09,0,tx+w*.09,0,'#c4506f',.12);g.fillRect(tx-w*.09,by-hh*1.4,w*.18,hh*1.4);g.fillStyle='#2f8f5a';g.beginPath();g.moveTo(tx-w*.11,by-hh*1.4);g.lineTo(tx,by-hh*2.15);g.lineTo(tx+w*.11,by-hh*1.4);g.fill();g.fillStyle=night?'#ffd98a':'#fff';g.beginPath();g.arc(tx,by-hh*1.1,w*.04,0,7);g.fill();g.fillRect(tx-w*.02,by-hh*.8,w*.04,hh*.18)});
  g.fillStyle=night?'#ffd98a':'#5a2a2a';g.beginPath();g.moveTo(cx-w*.1,by);g.lineTo(cx-w*.1,by-hh*.35);g.arc(cx,by-hh*.35,w*.1,Math.PI,0);g.lineTo(cx+w*.1,by);g.fill();glow(cx,by-hh*.3,U*.8,'255,200,120');break}
 case'mono':{const w=U*.8*s,hh=U*1.5*s;g.fillStyle='#9ad06a';g.beginPath();g.ellipse(cx,by,w*.95,w*.1,0,0,7);g.fill();g.fillStyle='#d8cdb8';for(let i=0;i<3;i++)g.fillRect(cx-w*(.6-i*.05),by-hh*.05*(i+1),w*(1.2-i*.1),hh*.05);
  [-1,1].forEach(q=>{const x0=q>0?cx+w*.18:cx-w*.46;g.fillStyle=grad(g,x0,0,x0+w*.28,0,'#8a7766',.18);g.beginPath();g.moveTo(x0,by-hh*.15);g.lineTo(x0,by-hh*(q>0?.97:1.03));g.lineTo(x0+w*.28,by-hh);g.lineTo(x0+w*.28,by-hh*.15);g.fill()});
  g.fillStyle='#6d5d4e';g.fillRect(cx-w*.2,by-hh*.5,w*.4,hh*.07);g.fillStyle='#fafafa';g.beginPath();g.arc(cx,by-hh*.95,w*.05,0,7);g.fill();g.beginPath();g.moveTo(cx-w*.1,by-hh*.5);g.lineTo(cx-w*.04,by-hh*.9);g.lineTo(cx+w*.06,by-hh*.9);g.lineTo(cx+w*.12,by-hh*.5);g.fill();g.fillRect(cx+w*.03,by-hh*1.08,w*.025,hh*.16);
  [-1,1].forEach(q=>glow(cx+q*w*.7,by-hh*.05,U*.6,'255,220,140'));break}}}
const _v=vehicle;vehicle=function(g,v,cx,by,U){_v(g,v,cx,by,U);const d=VT[v.t],w=d.w*U,h=d.h*U;
 if(v.t!='zemi'){g.fillStyle='rgba(255,255,255,.14)';g.fillRect(cx-w/2,by-h*.55,w,h*.1);g.fillStyle='rgba(255,255,255,.2)';g.fillRect(cx-w*.3,by-h*.88,w*.16,h*.25)}
 glow(cx-(v.t=='zemi'?0:w*.4),by-h*.4,w*.55,v.front?'255,250,200':'255,40,30');if(v.t!='zemi')glow(cx+w*.4,by-h*.4,w*.55,v.front?'255,250,200':'255,40,30')};
const _up=update;update=function(dt){_up(dt);if(!G.lm){G.lm=[];G.li=0;G.nextLm=300}
 if(G.dist>G.nextLm){const l=LMS[G.li++%2];G.lm.push({k:l.k,n:l.n,z:80,d:G.li%2?1:-1,sz:1.7,pop:0});G.nextLm=G.dist+rr(450,650)}
 G.lm.forEach(l=>{l.z-=G.speed*dt;if(!l.pop&&l.z<16){l.pop=1;popup('📍 '+l.n)}});G.lm=G.lm.filter(l=>l.z>-8)};
function skyline(col,sc,ph,hh){const g=ctx;for(let i=0;i<30;i++){const bw=W/26,m=W+bw*2,bx=(((i*bw*.9+G.curve*W*sc)%m)+m)%m-bw,bh=(((i+ph)*7919)%13+4)*H*hh;g.fillStyle=col;g.fillRect(bx,HOR-bh,bw,bh);
 if(night){g.fillStyle='#ffd98a';for(let j=0;j<5;j++)if((i*5+j)%3==0)g.fillRect(bx+bw*.2+(j%2)*bw*.4,HOR-bh+bh*(.15+j*.16),bw*.14,bh*.06)}}}
function drawWorld(){
 const g=ctx,t=G.t||0,T=performance.now()/1000,bl=1.5,k=Math.floor(G.off/bl),fr=G.off%bl;LT=[];g.clearRect(0,0,W,H);g.save();if(G.shake>0)g.translate(rr(-1,1)*G.shake*24,rr(-1,1)*G.shake*24);
 const sk=g.createLinearGradient(0,0,0,HOR);
 if(night){sk.addColorStop(0,'#040716');sk.addColorStop(.6,'#1b2152');sk.addColorStop(1,'#7a4f78')}else{sk.addColorStop(0,'#3a8fd6');sk.addColorStop(.6,'#8ccbef');sk.addColorStop(1,'#fbe9c0')}
 g.fillStyle=sk;g.fillRect(-30,-30,W+60,HOR+30);const bx=W*.7,by0=HOR*.3,br=H*.05;let q;
 if(night){STARS.forEach(s=>{g.globalAlpha=.5+.5*Math.sin(T*2+s.p);g.fillStyle='#fff';g.fillRect(s.x*W,s.y*HOR*.75,s.r,s.r)});g.globalAlpha=1;
  q=g.createRadialGradient(bx,by0,br*.5,bx,by0,br*5);q.addColorStop(0,'rgba(190,210,255,.45)');q.addColorStop(1,'rgba(190,210,255,0)');g.fillStyle=q;g.fillRect(bx-br*5,by0-br*5,br*10,br*10);
  q=g.createRadialGradient(bx-br*.3,by0-br*.3,br*.1,bx,by0,br);q.addColorStop(0,'#fffef0');q.addColorStop(1,'#cfd6e6');g.fillStyle=q;g.beginPath();g.arc(bx,by0,br,0,7);g.fill();
  g.fillStyle='rgba(120,130,150,.35)';[[.3,-.2,.22],[-.35,.25,.18],[.1,.45,.12],[-.2,-.4,.1]].forEach(c=>{g.beginPath();g.arc(bx+c[0]*br,by0+c[1]*br,c[2]*br,0,7);g.fill()})}
 else{q=g.createRadialGradient(bx,by0,br*.4,bx,by0,br*7);q.addColorStop(0,'rgba(255,245,190,.9)');q.addColorStop(.25,'rgba(255,225,130,.35)');q.addColorStop(1,'rgba(255,225,130,0)');g.fillStyle=q;g.fillRect(bx-br*7,by0-br*7,br*14,br*14);
  g.strokeStyle='rgba(255,240,170,.35)';g.lineWidth=3;for(let i=0;i<12;i++){const a=i*.5236+T*.1;g.beginPath();g.moveTo(bx+Math.cos(a)*br*1.3,by0+Math.sin(a)*br*1.3);g.lineTo(bx+Math.cos(a)*br*2.2,by0+Math.sin(a)*br*2.2);g.stroke()}
  g.fillStyle='#fffbe0';g.beginPath();g.arc(bx,by0,br,0,7);g.fill();
  CLD.forEach(c=>{const cx=((c.x+T*c.v)%1.3)*W-.15*W,cy=c.y*HOR*.55+HOR*.04,r=H*.028*c.s;g.fillStyle='rgba(255,255,255,.82)';[[0,0,1],[1.1,.2,.8],[-1.1,.25,.75],[.5,-.4,.7]].forEach(e=>{g.beginPath();g.ellipse(cx+e[0]*r*1.2,cy+e[1]*r,r*e[2]*1.4,r*e[2],0,0,7);g.fill()})})}
 skyline(night?'#2a2f62':'#a9bfd0',.06,3,.005);skyline(night?'#1c2048':'#8fa8bb',.1,0,.0042);
 g.fillStyle='#c7864a';g.fillRect(-30,HOR,W+60,H-HOR+30);
 for(let i=62;i>=0;i--){const z0=i*bl-fr,z1=z0+bl+.03,par=(k+i)&1;
  quad(-1.7,-1,z0,z1,par?'#d8b98a':'#d0b080');quad(1,1.7,z0,z1,par?'#d8b98a':'#d0b080');quad(-1,1,z0,z1,par?'#4b4b52':'#55555c');
  quad(-1,-.97,z0,z1,'#eee');quad(.97,1,z0,z1,'#eee');quad(-.015,.015,z0,z1,'#f5c518');if(par){quad(-.515,-.485,z0,z1,'#fff');quad(.485,.515,z0,z1,'#fff');quad(-1.7,-1.62,z0,z1,'#e63329');quad(1.62,1.7,z0,z1,'#e63329')}}
 const L=[];
 G.sc.forEach(o=>L.push({z:o.z,x:o.x,f:p=>scen(g,o,p.x,p.y,p.U)}));
 (G.lm||[]).forEach(l=>L.push({z:l.z,x:l.d*(l.k=='mono'?2.4:2.5),f:p=>scen(g,l,p.x,p.y,p.U)}));
 G.vs.forEach(v=>{if(v.z>-5)L.push({z:v.z,x:v.x,f:p=>vehicle(g,v,p.x,p.y,p.U)})});
 G.it.forEach(a=>L.push({z:a.z,x:a.x,f:p=>{const r=p.U*.2,y=p.y-r*1.4+Math.sin(t*5+a.ph)*r*.15;g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(p.x,p.y,r*.9,r*.2,0,0,7);g.fill();
  g.shadowColor='#ffd23f';g.shadowBlur=24;g.fillStyle='#ffd23f';g.beginPath();g.arc(p.x,y,r*1.1,0,7);g.fill();g.shadowBlur=0;
  g.save();g.beginPath();g.arc(p.x,y,r,0,7);g.clip();if(ayImg.complete&&ayImg.naturalWidth)g.drawImage(ayImg,p.x-r,y-r,r*2,r*2);else{g.fillStyle='#c0392b';g.fillRect(p.x-r,y-r,r*2,r*2)}g.restore()}}));
 L.sort((a,b)=>b.z-a.z);L.forEach(o=>{if(o.z>-4&&o.z<85){g.globalAlpha=Math.max(0,Math.min(1,(84-o.z)/26));o.f(proj(o.x,o.z));g.globalAlpha=1}});
 const hc=night?'120,75,120':'252,232,190';q=g.createLinearGradient(0,HOR-H*.06,0,HOR+H*.2);q.addColorStop(0,`rgba(${hc},0)`);q.addColorStop(.3,`rgba(${hc},.55)`);q.addColorStop(1,`rgba(${hc},0)`);g.fillStyle=q;g.fillRect(-30,HOR-H*.06,W+60,H*.26);
 if(night){q=g.createLinearGradient(0,HOR*.55,0,HOR);q.addColorStop(0,'rgba(8,14,48,0)');q.addColorStop(1,'rgba(8,14,48,.55)');g.fillStyle=q;g.fillRect(-30,HOR*.55,W+60,H);
  g.globalCompositeOperation='lighter';LT.forEach(l=>{q=g.createRadialGradient(l[0],l[1],0,l[0],l[1],l[2]);q.addColorStop(0,`rgba(${l[3]},.7)`);q.addColorStop(1,`rgba(${l[3]},0)`);g.fillStyle=q;g.fillRect(l[0]-l[2],l[1]-l[2],l[2]*2,l[2]*2)});g.globalCompositeOperation='source-over'}
 if(G.speed>14){g.strokeStyle='rgba(255,255,255,'+Math.min(.3,(G.speed-14)/45)+')';g.lineWidth=2;for(let i=0;i<14;i++){const a=((i*137+G.off*7)%100)/100,sd=i%2?1:-1,x0=W/2+sd*(W*.12+a*W*.4),y0=HOR+a*(H-HOR);g.beginPath();g.moveTo(x0,y0);g.lineTo(x0+sd*a*W*.08,y0+a*H*.12);g.stroke()}}
 const p=proj(G.px,0),U=p.U,by=H*.93;
 if(night){g.globalCompositeOperation='lighter';q=g.createLinearGradient(0,by-U*.5,0,HOR+(H-HOR)*.3);q.addColorStop(0,'rgba(255,240,180,.5)');q.addColorStop(1,'rgba(255,240,180,0)');g.fillStyle=q;g.beginPath();g.moveTo(p.x-U*.06,by-U*.5);g.lineTo(p.x+U*.06,by-U*.5);g.lineTo(p.x+U*.5,HOR+(H-HOR)*.3);g.lineTo(p.x-U*.5,HOR+(H-HOR)*.3);g.fill();g.globalCompositeOperation='source-over'}
 if(G.invT>0){const r=U*.42,gg=g.createRadialGradient(p.x,by-U*.2,r*.2,p.x,by-U*.2,r);gg.addColorStop(0,'rgba(0,255,255,0)');gg.addColorStop(.8,'rgba(0,255,255,.25)');gg.addColorStop(1,'rgba(255,230,80,.7)');g.fillStyle=gg;g.beginPath();g.arc(p.x,by-U*.2,r,0,7);g.fill()}
 if(!(G.invuln>0&&Math.floor(G.t*14)%2))bike(g,p.x,by,U*.3,{shirt:G.ch.shirt,helmet:G.ch.helmet,stripe:G.ch.stripe,lean:G.vx*.12,glow:G.invT>0?30:12});
 q=g.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*.98);q.addColorStop(0,'rgba(0,0,0,0)');q.addColorStop(1,`rgba(0,0,0,${night?.5:.26})`);g.fillStyle=q;g.fillRect(-30,-30,W+60,H+60);
 g.restore();
 for(const o of G.pa){g.globalAlpha=Math.max(0,o.l/o.m);g.fillStyle=o.c;g.beginPath();g.arc(o.x,o.y,o.r,0,7);g.fill()}g.globalAlpha=1}
