// ================= v4.20 EXTRAS: PS2 LOOK, REMAPPING, DEBUG MENU, RC WRECKERS, OFF-ROAD RUNS, THE DODO, UNIQUE JUMPS, RATING =================
// Loaded after 08-render.js and before 09-menu.js. Everything here is original code; GTA III is only the design reference.
// Nothing in this file calls R()/rr()/pick() while it loads: placement uses hash(), so saved cities keep their layout
// (see "City generation" in CLAUDE.md).
const hr=(i,salt)=>(hash(i*7919+17,salt)%100000)/100000;

// ---------- the PS2 look: light trails, a colour grade, a soft vignette, raindrops on the lens, a sheen sliding over car paint ----------
const trailC=document.createElement('canvas'),trailX=trailC.getContext('2d');let vigG=null,vigK='',trailCam=null;
function ps2Look(sx,sy){
  const c=player.car,sp=c?hyp(c.vx,c.vy):0,a=clamp(0.07+sp/3200,0.07,0.24),tc=trailCam;
  const jump=!tc||hyp(CX-tc[0],CY-tc[1])>50||Math.abs(angDiff(cam.yaw,tc[2]))>0.3||game.paused||SCOPE.on;trailCam=[CX,CY,cam.yaw];
  if(trailC.width!==LW||trailC.height!==LH){trailC.width=LW;trailC.height=LH;}
  else if(!jump){ctx.imageSmoothingEnabled=false;ctx.globalAlpha=a;ctx.drawImage(trailC,0,0,LW,LH,OX+sx,OY+sy,LW*SCL,LH*SCL);ctx.globalAlpha=1;}
  trailX.drawImage(lowc,0,0);
  ctx.globalCompositeOperation='soft-light';ctx.fillStyle=LIGHTK>0.5?'rgba(84,112,190,.30)':'rgba(255,198,132,.24)';ctx.fillRect(0,0,VW,VH);ctx.globalCompositeOperation='source-over';
  const k=VW+'x'+VH;if(vigK!==k){vigK=k;vigG=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.45,VW/2,VH/2,Math.hypot(VW,VH)*0.56);vigG.addColorStop(0,'rgba(0,0,0,0)');vigG.addColorStop(1,'rgba(0,0,0,.34)');}
  ctx.fillStyle=vigG;ctx.fillRect(0,0,VW,VH);}
const SDROPS=[];
function updateScreenRain(dt){for(const d of SDROPS){d.t-=dt;d.y+=d.vy*dt;}for(let i=SDROPS.length-1;i>=0;i--)if(SDROPS[i].t<=0)SDROPS.splice(i,1);
  if(OPT.ps2===false||rain<0.3||SCOPE.on||SEASON()==='winter'||(typeof SUB!=='undefined'&&SUB)||inHall(cam.x,cam.y)||roomAt(cam.x,cam.y))return;
  if(SDROPS.length<34&&Math.random()<dt*rain*11)SDROPS.push({x:Math.random(),y:Math.random()*0.85,r:2+Math.random()*4.5,t:1.2+Math.random()*1.8,vy:Math.random()<0.4?0.02+Math.random()*0.05:0});}
function drawScreenRain(sc){if(!SDROPS.length)return;for(const d of SDROPS){const x=d.x*VW,y=d.y*VH,r=d.r*sc*1.4;ctx.globalAlpha=Math.min(1,d.t)*0.55;
  if(d.vy){ctx.fillStyle='rgba(200,214,232,.22)';ctx.fillRect(x-r*0.3,y-r*4,r*0.6,r*4);}
  ctx.fillStyle='rgba(190,205,225,.30)';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r*0.65,PI*1.1,PI*1.6);ctx.stroke();}ctx.globalAlpha=1;}
// paint sheen: while a car's boxes are drawn, obox() lays a thin bright band across each big top face. The band sits at
// one spot along the car and slides as the car moves, the way the sky slides over a bonnet. (Flat-on-top, drawn right
// after the face it lies on, so it follows rendering rule 5.)
var SHEEN=null;
function sheenFor(c){if(OPT.ps2===false||c.wreck||c.t.boat||c.t.heli||c.t.bike||c.t.tank||c.t.rc||MIRROR)return null;const dx=c.x-CX,dy=c.y-CY;if(dx*dx+dy*dy>420*420)return null;
  const hl=c.t.L/2,u=((c.x*0.011+c.y*0.014)%1+1)%1;return{x:c.x,y:c.y,f:(u*2-1)*hl*1.25,col:LIGHTK>0.5?'rgba(255,214,160,.20)':'rgba(255,255,255,.26)'};}
function sheenTop(x,y,ca,sa,hl,hw,z1){const S=SHEEN;if(hw<4||hl<5)return;const s=S.f-((x-S.x)*ca+(y-S.y)*sa);if(Math.abs(s)>hl-2)return;
  const mx=x+ca*s,my=y+sa*s,fx=ca*1.4,fy=sa*1.4,rx=-sa*hw*0.92,ry=ca*hw*0.92,z=z1+0.05;
  quad(mx+fx-rx,my+fy-ry,z,mx+fx+rx,my+fy+ry,z,mx-fx+rx,my-fy+ry,z,mx-fx-rx,my-fy-ry,z,S.col);}
// rim light: at night a thin warm edge down one side of a person, so they read against a dark street
function pedRim(p,jz){if(OPT.ps2===false||LIGHTK<0.3||MIRROR)return;if(!proj(p.x,p.y,9))return;if(PK<0.8)return;const y0=PY,x=PX+3.9*PK,k=PK;if(!proj(p.x,p.y,23))return;
  L3.fillStyle=`rgba(255,220,170,${(0.42*LIGHTK).toFixed(2)})`;L3.fillRect(R2(x),R2(PY),1,Math.max(1,R2(y0-PY)));}

// ---------- remapping: keyboard keys and controller buttons ----------
// The game reads fixed key codes (KeyW, KeyF...). A capture listener that runs before every other one rewrites the
// code of each real key press to the action it is bound to, so no other code has to know about the bindings.
const KEYACTS=[['KeyW','Forward / gas'],['KeyS','Back / brake'],['KeyA','Left'],['KeyD','Right'],['Space','Jump / handbrake'],['KeyF','Enter or leave a car'],
  ['ShiftLeft','Sprint / nitro / descend'],['KeyQ','Previous weapon / look left'],['KeyE','Next weapon / look right'],['KeyC','Look behind'],['KeyK','Fire (keyboard)'],
  ['KeyH','Horn'],['KeyR','Radio'],['KeyG','Phone'],['KeyT','Recruit / dismiss crew'],['KeyB','Detonate car bomb'],['KeyV','Camera view'],['KeyN','Rear-view mirror'],['Tab','Map'],['KeyM','Mute']];
let KEYREV={},rebind=null;
function keyOf(act){return (OPT.keys&&OPT.keys[act])||act;}
function buildKeyRev(){KEYREV={};const used=new Set();for(const[a] of KEYACTS){const p=keyOf(a);KEYREV[p]=a;used.add(p);}for(const[a] of KEYACTS)if(!used.has(a))KEYREV[a]='Unbound';}
function setKey(act,phys){OPT.keys=OPT.keys||{};const old=keyOf(act);for(const[a] of KEYACTS)if(a!==act&&keyOf(a)===phys)OPT.keys[a]=old; // swap with whatever had it
  OPT.keys[act]=phys;for(const k in OPT.keys)if(OPT.keys[k]===k)delete OPT.keys[k];buildKeyRev();saveOpts();}
const keyName=c=>c.replace(/^Key/,'').replace(/^Digit/,'').replace('ShiftLeft','L SHIFT').replace('ShiftRight','R SHIFT').replace('ControlLeft','L CTRL').replace('ControlRight','R CTRL').replace('AltLeft','L ALT').replace('AltRight','R ALT').replace(/^Arrow/,'ARROW ').toUpperCase();
for(const ev of['keydown','keyup'])window.addEventListener(ev,e=>{
  if(!e.isTrusted||(e.target&&e.target.tagName==='INPUT'))return;
  if(rebind&&ev==='keydown'){e.preventDefault();e.stopImmediatePropagation();const r=rebind;rebind=null;if(e.code!=='Escape'&&r.kind==='key')setKey(r.act,e.code);openPanel(r.kind==='key'?'keys':'padmap');return;}
  if(FREECAM.on){e.stopImmediatePropagation();if(ev==='keydown'&&(e.code==='Backquote'||e.code==='Escape'))freeCam(false);else FREECAM.k[e.code]=ev==='keydown';if(e.code==='Tab'||e.code==='Space')e.preventDefault();return;}
  if(ev==='keydown'&&e.code==='Backquote'&&game.started){debugMenu();e.preventDefault();e.stopImmediatePropagation();return;}
  const m=KEYREV[e.code];if(m&&m!==e.code){try{Object.defineProperty(e,'code',{value:m});}catch(_){}}
},true);
function keysHTML(){let h='<h2>KEYBOARD</h2><p class="note">Click an action, then press the key you want. If that key is in use, the two swap. Esc cancels.</p>';
  for(const[a,n] of KEYACTS){const w=rebind&&rebind.kind==='key'&&rebind.act===a;h+=`<div class="opt"><span>${n}</span><button data-key="${a}">${w?'PRESS A KEY…':keyName(keyOf(a))}</button></div>`;}
  return h+'<div class="opt"><span>Put every key back</span><button data-keyreset="1">RESET</button></div>';}
// controller: PADMAP says which physical button stands in for each standard button number (pollPad reads through it)
const PADBTN=['A / Cross','B / Circle','X / Square','Y / Triangle','LB / L1','RB / R1','LT / L2','RT / R2','Select / Back','Start','L3 (left stick click)','R3 (right stick click)','D-pad up','D-pad down','D-pad left','D-pad right'];
const PM=i=>{const m=OPT.padmap;return m&&m[i]!=null?m[i]:i;};
function setPad(i,phys){OPT.padmap=OPT.padmap||{};const old=PM(i);for(let j=0;j<16;j++)if(j!==i&&PM(j)===phys)OPT.padmap[j]=old;OPT.padmap[i]=phys;for(const k in OPT.padmap)if(OPT.padmap[k]===+k)delete OPT.padmap[k];saveOpts();}
function padHTML(){const names=OPT.pad==='classic'?['Gas / sprint','Fire','Brake / jump','Enter or leave a car','Horn','Handbrake / lock on','Look left / previous weapon','Look right / next weapon','Camera view','Pause','Nitro','Look behind','Radio','Phone','Recruit crew','Map']
    :['Jump / handbrake','Look behind','Horn','Enter or leave a car','Switch weapon','Fire','Brake / lock on','Gas','Map','Pause','Sprint / nitro','Camera view','Radio','Phone','Recruit crew','Mirror'];
  let h='<h2>CONTROLLER</h2><p class="note">These are the actions of the '+(OPT.pad==='classic'?'GTA III (PS2)':'modern')+' layout. Click one, then press the button you want for it. Esc cancels.</p>';
  for(let i=0;i<16;i++){const w=rebind&&rebind.kind==='pad'&&rebind.i===i;h+=`<div class="opt"><span>${names[i]}</span><button data-padb="${i}">${w?'PRESS A BUTTON…':PADBTN[PM(i)]||('Button '+PM(i))}</button></div>`;}
  return h+'<div class="opt"><span>Put every button back</span><button data-padreset="1">RESET</button></div>';}
function padListen(){if(!rebind||rebind.kind!=='pad')return;let gp=null;try{for(const g of navigator.getGamepads?navigator.getGamepads():[])if(g&&g.connected){gp=g;break;}}catch(_){}
  if(gp){const dn=[];for(let i=0;i<Math.min(16,gp.buttons.length);i++)dn[i]=gp.buttons[i].pressed||gp.buttons[i].value>0.5;
    if(rebind.armed){for(let i=0;i<dn.length;i++)if(dn[i]){const r=rebind;rebind=null;setPad(r.i,i);openPanel('padmap');return;}}else if(!dn.some(x=>x))rebind.armed=true;}
  requestAnimationFrame(padListen);}
function wireRemap(p){
  p.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{rebind={kind:'key',act:b.dataset.key};openPanel('keys');});
  p.querySelectorAll('[data-keyreset]').forEach(b=>b.onclick=()=>{OPT.keys={};buildKeyRev();saveOpts();openPanel('keys');});
  p.querySelectorAll('[data-padb]').forEach(b=>b.onclick=()=>{rebind={kind:'pad',i:+b.dataset.padb,armed:false};openPanel('padmap');requestAnimationFrame(padListen);});
  p.querySelectorAll('[data-padreset]').forEach(b=>b.onclick=()=>{OPT.padmap={};saveOpts();openPanel('padmap');});}

// ---------- debug menu (the ` key) and a free camera ----------
const FREECAM={on:false,k:{},x:0,y:0,h:60,yaw:0,pitch:0,sv:null};let DBGFPS=false,dbgEl=null,fpsN=0,fpsT=0,fpsV=0;
function freeCam(on){if(on===FREECAM.on)return;FREECAM.on=on;FREECAM.k={};
  if(on){if(dbgEl)dbgEl.style.display='none';FREECAM.sv={x:cam.x,y:cam.y,h:cam.h,yaw:cam.yaw,gz:cam.gz,pitch:cam.pitch};FREECAM.x=cam.x;FREECAM.y=cam.y;FREECAM.h=cam.h+(cam.gz||0);FREECAM.yaw=cam.yaw;FREECAM.pitch=cam.pitch||0;for(const k in keys)keys[k]=false;
    note('Free camera: WASD move · Q/E or arrows turn · R/F up and down · T/G tilt · SHIFT fast · ` or Esc to leave');}
  else{const s=FREECAM.sv;if(s){cam.x=s.x;cam.y=s.y;cam.h=s.h;cam.yaw=s.yaw;cam.gz=s.gz;cam.pitch=s.pitch;}}}
function freeCamTick(dt){const k=FREECAM.k,F=FREECAM,sp=(k.ShiftLeft||k.ShiftRight?900:300)*dt,ca=Math.cos(F.yaw),sa=Math.sin(F.yaw);
  const f=(k.KeyW?1:0)-(k.KeyS?1:0),r=(k.KeyD?1:0)-(k.KeyA?1:0);F.x+=(ca*f-sa*r)*sp;F.y+=(sa*f+ca*r)*sp;
  F.yaw+=((k.KeyE||k.ArrowRight?1:0)-(k.KeyQ||k.ArrowLeft?1:0))*1.6*dt;F.h=clamp(F.h+((k.KeyR||k.Space?1:0)-(k.KeyF?1:0))*sp*0.6,16,900);
  F.pitch=clamp(F.pitch+((k.KeyT||k.ArrowUp?1:0)-(k.KeyG||k.ArrowDown?1:0))*0.9*dt,-0.5,0.62);
  cam.x=F.x;cam.y=F.y;cam.yaw=F.yaw;cam.gz=0;cam.h=Math.max(F.h,GH(F.x,F.y)+16);cam.pitch=F.pitch;game.t+=dt*0.0001;}
function debugMenu(){
  if(!dbgEl){dbgEl=document.createElement('div');dbgEl.id='dbg';dbgEl.style.cssText='position:fixed;left:12px;top:12px;z-index:60;background:rgba(12,14,18,.94);color:#e8e8e8;font:13px system-ui,sans-serif;padding:12px 14px;border:1px solid #ffcc00;border-radius:8px;max-width:330px;display:none';document.body.appendChild(dbgEl);
    dbgEl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.d,v=b.dataset.v;STATS.cheats=(STATS.cheats||0)+1;
      if(a==='time')clock=+v;
      else if(a==='wx'){if(v==='clear'){rain=0;rainTarget=0;fogTarget=0;FOGK=0;}else if(v==='rain'){rain=0.95;rainTarget=1;}else{rain=0;rainTarget=0;fogTarget=0.9;FOGK=0.9;}weatherT=240;}
      else if(a==='stars'){if(v==='0')clearHeat();else{const s=Math.min(6,stars()+1);heat=TH[s]+1;}}
      else if(a==='heal'){player.hp=PMAX();player.armor=100;if(player.car){player.car.hp=player.car.t.hp;player.car.burn=-1;player.car.flat=false;}}
      else if(a==='cash')addMoney(10000);
      else if(a==='ammo'){for(let i=0;i<WEAPONS.length;i++)if(player.ammo[i]!==Infinity)player.ammo[i]=Math.max(player.ammo[i]||0,WEAPONS[i].kind==='b'?300:20);}
      else if(a==='spawn'){const ty=dbgEl.querySelector('select').value,o=player.car||player,an=player.car?player.car.a:(cam.base!=null?cam.base:player.a);let x=o.x+Math.cos(an)*90,y=o.y+Math.sin(an)*90;
        if(solidPx(x,y)){const s=laneSpotNear(o.x,o.y);if(s){x=s.x;y=s.y;}}const c=makeCar(ty,x,y,an);if(c.t.heli)c.alt=0;note('Spawned: '+c.t.name);}
      else if(a==='tp'){if(!WAYPOINT){note('Set a waypoint on the map first (TAB)');}else{const o=player.car||player;o.x=WAYPOINT.x;o.y=WAYPOINT.y;if(player.car){player.x=o.x;player.y=o.y;player.car.vx=player.car.vy=0;}else player.jz=0;cam.gz=null;}}
      else if(a==='open'){STORY.prog[0]=Math.max(STORY.prog[0],2);note('Bridges open');}
      else if(a==='fps'){DBGFPS=!DBGFPS;}
      else if(a==='cam'){game.paused=false;hideMenu();freeCam(true);return;}
      else if(a==='x'){dbgEl.style.display='none';return;}
      debugMenu();debugMenu();});}
  if(dbgEl.style.display!=='none'){dbgEl.style.display='none';return;}
  const B=(d,v,t)=>`<button data-d="${d}" data-v="${v}" style="margin:2px 3px 2px 0;padding:4px 8px;background:#2a2d34;color:#fff;border:1px solid #555;border-radius:4px;cursor:pointer">${t}</button>`;
  const types=Object.keys(CT).filter(k=>!CT[k].rc).sort();
  dbgEl.innerHTML='<b style="color:#ffcc00">DEBUG MENU</b> <small>(` to close)</small><br><small>Time</small><br>'+B('time',0.27,'Dawn')+B('time',0.5,'Noon')+B('time',0.78,'Dusk')+B('time',0.95,'Night')
    +'<br><small>Weather</small><br>'+B('wx','clear','Clear')+B('wx','rain','Rain')+B('wx','fog','Fog')
    +'<br><small>Wanted level: '+stars()+'</small><br>'+B('stars','0','Clear')+B('stars','1','+1 star')
    +'<br><small>You</small><br>'+B('heal','','Heal + armor + fix car')+B('cash','','+$10,000')+B('ammo','','Ammo')
    +'<br><small>Spawn a vehicle in front of you</small><br><select style="padding:4px;background:#111;color:#fff;border:1px solid #555;border-radius:4px">'+types.map(k=>`<option value="${k}">${CT[k].name}</option>`).join('')+'</select> '+B('spawn','','Spawn')
    +'<br><small>World</small><br>'+B('tp','','Teleport to waypoint')+B('open','','Open the bridges')+B('fps','','FPS '+(DBGFPS?'on':'off'))+B('cam','','Free camera')+B('x','','Close');
  dbgEl.style.display='block';}
function fpsTick(){fpsN++;const n=performance.now();if(n-fpsT>500){fpsV=Math.round(fpsN*1000/(n-fpsT));fpsN=0;fpsT=n;}}

// ---------- criminal rating ----------
const RANKS=[[0,'Nobody'],[60,'Pickpocket'],[160,'Hoodlum'],[320,'Thug'],[520,'Wheelman'],[800,'Enforcer'],[1200,'Racketeer'],[1700,'Lieutenant'],[2400,'Underboss'],[3300,'Boss'],[4500,'Kingpin'],[6500,'Legend of Gridlock']];
function crimScore(){const S=STATS,story=STORY.prog.reduce((a,b)=>a+b,0)+STORY.fin;
  return Math.max(0,Math.round(S.kills*2+S.cops*8+S.stolen*2+story*60+PACKAGES.filter(k=>k.got).length*10+S.jumps*3+usjCount()*40+Object.keys(EXPORTED).length*30+Object.keys(TURF).length*20+S.raceWins*25
    +(S.rcBest||0)*10+(S.offWins||0)*40+Math.min(300,(S.flightBest||0)*2)-S.wasted*10-S.busted*10-(S.cheats||0)*25));}
function crimRank(sc){let i=0;for(let k=0;k<RANKS.length;k++)if(sc>=RANKS[k][0])i=k;return i;}
let rankT=3;
function updateRating(dt){rankT-=dt;if(rankT>0||game.state!=='play'||mission||DLG.open)return;rankT=2;const i=crimRank(crimScore());
  if(STATS.rank==null||i<STATS.rank){STATS.rank=i;return;}if(i>STATS.rank){STATS.rank=i;showBig('CRIMINAL RATING',RANKS[i][1],'#ffcc00',3);sfx('pass',0.5);}}
function ratingHTML(){const sc=crimScore(),i=crimRank(sc),nx=RANKS[i+1];return `<b>Criminal rating</b><span>${RANKS[i][1]} (${sc.toLocaleString()}${nx?' · next: '+nx[1]+' at '+nx[0].toLocaleString():''})</span>
<b>Unique stunt jumps</b><span>${usjCount()} / ${USJ.length}</span><b>RC Wreckers best</b><span>${STATS.rcBest||0} wrecked</span>
<b>Off-road runs</b><span>${OFFROAD.map(o=>o.name+': '+(STATS.offBest&&STATS.offBest[o.id]?STATS.offBest[o.id].toFixed(1)+' s':'not done')).join(' · ')||'none'}</span><b>Longest flight</b><span>${(STATS.flightBest||0).toFixed(0)} s</span>`;}

// ---------- sleeping at the safehouse: saving there passes six hours ----------
function sleepSix(){if(!(ROOM&&ROOM.id==='safe'))return;clock=(clock+0.25)%1;fadeIn=1;const m=Math.floor(clock*1440);note('You slept for six hours. It\'s '+String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'));}

// ---------- unique stunt jumps: a dozen marked ramps, each pays once, with a slow-motion side-on camera ----------
const USJ=(()=>{const order=RAMPS.map((r,i)=>[hash(Math.round(r.x),Math.round(r.y)),i]).sort((a,b)=>a[0]-b[0]).map(q=>RAMPS[q[1]]),out=[];
  // only ramps with a clear run-up and somewhere to land
  const open_=r=>{const ca=Math.cos(r.a),sa=Math.sin(r.a);for(let d=40;d<=170;d+=18)if(solidPx(r.x-ca*d,r.y-sa*d)||tileAt(Math.floor((r.x-ca*d)/T),Math.floor((r.y-sa*d)/T))===WATER)return false;for(let d=40;d<=150;d+=18)if(solidPx(r.x+ca*d,r.y+sa*d))return false;return true;};
  for(const r of order){if(out.length>=12)break;if(!open_(r))continue;if(out.every(o=>hyp(o.x-r.x,o.y-r.y)>650)){r.usj=Math.round(r.x)+'_'+Math.round(r.y);out.push(r);}}
  for(const r of out)SIGNS.push({x:r.x,y:r.y,text:'★ STUNT JUMP',bg:'#e0338a',fg:'#ffffff',h:r.h+30,on:()=>!(STATS.usj&&STATS.usj[r.usj])});return out;})();
function usjCount(){return STATS.usj?USJ.filter(r=>STATS.usj[r.usj]).length:0;}
function usjLaunch(c,r){c.usj=null;if(!r.usj||c.vz<=0)return;c.usj={r,x:c.x,y:c.y};slowT=Math.max(slowT,1.1);cam.corb=(hash(Math.round(r.x),7)&1?1:-1)*PI*0.42;cam.cidle=0;}
function usjLand(c){const u=c.usj;c.usj=null;if(!u)return;const d=hyp(c.x-u.x,c.y-u.y);STATS.usj=STATS.usj||{};
  if(c.airT<0.42||d<95){if(!STATS.usj[u.r.usj])note('Not far enough for the unique stunt. Hit it faster');return;}
  if(STATS.usj[u.r.usj])return;STATS.usj[u.r.usj]=1;const n=usjCount(),pay=1000*n;addMoney(pay);sfx('pass');
  setTimeout(()=>showBig('UNIQUE STUNT BONUS','+$'+pay.toLocaleString()+'  ·  '+n+' of '+USJ.length+'  ·  '+Math.round(d/3)+' ft','#ff5aa8',3.2),900);
  if(n===USJ.length){addMoney(10000);note('Every unique stunt jump done! +$10,000');}}

// ---------- activities: RC Wreckers and the off-road runs share one slot (ACT) ----------
var ACT=null;let actCool=0;
function actEnd(){const a=ACT;ACT=null;actCool=5;if(!a)return;
  if(a.kind==='rc'){if(a.car){const k=cars.indexOf(a.car);if(k>=0)cars.splice(k,1);if(player.car===a.car)player.car=null;}player.x=a.home.x;player.y=a.home.y;player.jz=0;player.vx=player.vy=0;cam.gz=null;}}
// --- RC Wreckers: two minutes of driving toy cars under traffic and blowing them up ---
CT.rc={name:'RC Wrecker',L:17,Wd:10,max:520,acc:560,grip:12,turn:3.6,hp:5000,mass:0.25,cols:['#e02a2a','#f0c020','#2a7ae0'],rc:true};
const RCPAD=(()=>{const used=SIGNS.map(s=>[s.x,s.y]),tx=(3*P+9)*T,ty=(10*P+9)*T;let best=null,bd=1e18;
  for(const l of lotBlocks){if(l.x>RIVX0*T)continue;if(used.some(u=>hyp(u[0]-l.x,u[1]-l.y)<220))continue;const d=dist2(l.x,l.y,tx,ty);if(d<bd){bd=d;best=l;}}
  if(!best)return null;const s={x:best.x,y:best.y};SIGNS.push({x:s.x,y:s.y,text:'RC WRECKERS',bg:'#e02a2a',fg:'#ffffff',h:34,on:()=>true});return s;})();
// toy-car handling: quick, grippy and light, nothing like the full car physics
function rcDrive(c,thr,steer,hb,dt){const ca=Math.cos(c.a),sa=Math.sin(c.a);let vf=c.vx*ca+c.vy*sa;const want=thr*(thr>0?c.t.max:c.t.max*0.5);vf=hb?vf*Math.exp(-5*dt):lerp(vf,want,Math.min(1,dt*(thr?2.2:1.2)));
  c.a+=steer*3.4*dt*clamp(Math.abs(vf)/110,0.25,1)*(vf<-5?-1:1);c.va=0;const vl=(-c.vx*sa+c.vy*ca)*Math.exp(-9*dt),c2=Math.cos(c.a),s2=Math.sin(c.a);c.vx=c2*vf-s2*vl;c.vy=s2*vf+c2*vl;c.driven=true;c.skid=false;}
let rcCalm=0,rcHeat=0;
function rcSpawn(){const a=ACT,s=laneSpotNear(a.home.x,a.home.y)||a.home,c=makeCar('rc',s.x,s.y,(s.dir||0)*PI/2,CT.rc.cols[a.n%3]);a.n++;a.car=c;a.arm=game.t+0.7;c.driver='player';c.ai=null;c.traffic=false;player.car=c;player.x=c.x;player.y=c.y;cam.gz=null;}
function rcBoom(){const a=ACT;if(!a||a.kind!=='rc'||!a.car||a.wait>0||game.t<a.arm)return;const c=a.car,x=c.x,y=c.y;const k=cars.indexOf(c);if(k>=0)cars.splice(k,1);a.car=null;player.car=null;
  player.x=a.home.x;player.y=a.home.y;for(const o of cars)if(!o.wreck&&!o.t.rc&&hyp(o.x-x,o.y-y)<125)o.rcHit=game.t;
  explode(x,y,'player');a.wait=0.9;a.bx=x;a.by=y;}
function rcTick(dt){const a=ACT;a.timer-=dt;if(heat>a.heat0)heat=a.heat0;
  for(const o of cars)if(o.rcHit&&!o.rcC&&(o.wreck||o.burn>=0)&&game.t-o.rcHit<6){o.rcC=1;a.score++;sfx('pickup',0.5);note('Wrecked: '+o.t.name+'  ·  '+a.score);}
  if(a.wait>0){a.wait-=dt;player.x=a.home.x;player.y=a.home.y;if(a.wait<=0&&a.timer>0)rcSpawn();}
  else if(a.car&&(a.car.wreck||cars.indexOf(a.car)<0||player.car!==a.car)){a.car=null;a.wait=0.5;}
  if(a.timer<=0&&!(a.wait>0&&a.timer>-1.2)){rcCalm=10;rcHeat=a.heat0;const sc=a.score,best=STATS.rcBest||0,pay=sc*300+(sc>best&&best>0?1000:0);STATS.rcBest=Math.max(best,sc);actEnd();if(pay)addMoney(pay);
    showBig('RC WRECKERS',sc+' wrecked'+(pay?'  ·  +$'+pay.toLocaleString():'')+(sc>best&&best>0?'  ·  NEW BEST':''),'#ff5a4a',3.2);sfx(sc?'pass':'fail');}}
function rcStart(){ACT={kind:'rc',timer:120,score:0,n:0,car:null,wait:0,home:{x:player.x,y:player.y},heat0:heat};rcSpawn();showBig('RC WRECKERS','Drive under a car and press FIRE to blow it up','#ff5a4a',2.6);}
// --- off-road runs: timed checkpoints across the fields and hills, in whatever you drove out there ---
const OFFROAD=[];
(()=>{const okPt=(x,y)=>{const t=tileAt(Math.floor(x/T),Math.floor(y/T));if(t!==GRASS)return false;for(const[dx,dy] of[[24,0],[-24,0],[0,24],[0,-24]])if(solidPx(x+dx,y+dy))return false;
    return Math.abs(GH(x+20,y)-GH(x-20,y))<16&&Math.abs(GH(x,y+20)-GH(x,y-20))<16;};
  const clear=(a,b)=>{const d=hyp(b.x-a.x,b.y-a.y),n=Math.ceil(d/14);for(let i=1;i<n;i++){const x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;if(solidPx(x,y)||tileAt(Math.floor(x/T),Math.floor(y/T))===WATER)return false;}return true;};
  const mk=(id,name,x0,y0,x1,y1,sx,sy)=>{let st=null;for(let i=0;i<400&&!st;i++){const x=sx+(hr(i,id*31+1)-0.5)*i*1.5,y=sy+(hr(i,id*31+2)-0.5)*i*1.5;if(x>x0&&x<x1&&y>y0&&y<y1&&okPt(x,y))st={x,y};}if(!st)return;
    const cand=[];for(let i=0;i<500;i++){const x=x0+hr(i,id*31+3)*(x1-x0),y=y0+hr(i,id*31+4)*(y1-y0);if(okPt(x,y))cand.push({x,y,z:0});}
    const cps=[];let cur=st;for(let n=0;n<11;n++){let pickd=null;for(const c of cand){if(c.used)continue;const d=hyp(c.x-cur.x,c.y-cur.y);if(d<230||d>620||!clear(cur,c))continue;if(cps.some(q=>hyp(q.x-c.x,q.y-c.y)<160)||hyp(c.x-st.x,c.y-st.y)<160)continue;pickd=c;break;}
      if(!pickd)break;pickd.used=true;cps.push(pickd);cur=pickd;}
    if(cps.length<6)return;OFFROAD.push({id,name,x:st.x,y:st.y,cps});SIGNS.push({x:st.x,y:st.y,text:'OFF-ROAD RUN',bg:'#8a5a2a',fg:'#ffffff',h:34,on:()=>true});};
  mk(1,'Farm Scramble',WPX+170,260,WPX+HM-260,WPX-260,WPX+330,(6*P+2)*T);
  mk(2,'Hill Climb',300,-HM+260,RIVX0*T-200,-170,(4*P)*T,-420);})();
function offStart(o){const c0=o.cps[0],d=hyp(c0.x-o.x,c0.y-o.y);ACT={kind:'off',run:o,cps:o.cps,i:0,timer:d/200+6,t:0,tg:c0};showBig('GO!',o.name,'#ffd600',1);}
function offTick(dt){const a=ACT,c=player.car;a.timer-=dt;a.t+=dt;
  if(!c||c.wreck||a.timer<=0){showBig(a.timer<=0?'OUT OF TIME':'RUN OVER',a.run.name+' failed','#ff4040',2.2);sfx('fail');actEnd();return;}
  const p=a.cps[a.i];if(hyp(c.x-p.x,c.y-p.y)<38){a.i++;sfx('pickup',0.5);
    if(a.i>=a.cps.length){STATS.offBest=STATS.offBest||{};const best=STATS.offBest[a.run.id],t=a.t,pay=1500+Math.round(a.timer)*40;STATS.offBest[a.run.id]=best?Math.min(best,t):t;STATS.offWins=(STATS.offWins||0)+1;addMoney(pay);
      showBig('RUN COMPLETE',a.run.name+'  ·  '+t.toFixed(1)+' s'+(best&&t<best?'  ·  NEW BEST':'')+'  ·  +$'+pay.toLocaleString(),'#ffd600',3.2);sfx('pass');actEnd();return;}
    const q=a.cps[a.i];a.timer+=hyp(q.x-p.x,q.y-p.y)/215+2;a.tg=q;note('Checkpoint '+a.i+' / '+a.cps.length);}}
function actHUD(sc,ly){const a=ACT,tm=Math.max(0,a.timer),rc=a.kind==='rc';
  hudText(rc?'RC WRECKERS  ·  '+a.score+' wrecked':a.run.name.toUpperCase()+'  ·  '+a.i+' / '+a.cps.length,18*sc,ly+12*sc,Math.round(16*sc),rc?'#ff8a7a':'#ffd98a','left');
  hudText(rc?Math.floor(tm/60)+':'+String(Math.floor(tm%60)).padStart(2,'0'):tm.toFixed(1)+' s',18*sc,ly+40*sc,Math.round(22*sc),tm<=8&&Math.floor(game.t*4)%2?'#ff4040':'#fff','left');
  if(rc)hudText(touchMode?'FIRE to detonate':'Click, K or F to detonate',18*sc,ly+64*sc,Math.round(12*sc),'#bbb','left','system-ui,sans-serif');}
function updateActs(dt){actCool-=dt;if(rcCalm>0){rcCalm-=dt;if(heat>rcHeat)heat=rcHeat;}
  if(ACT){if(game.state!=='play'||mission){actEnd();return;}if(ACT.kind==='rc')rcTick(dt);else offTick(dt);return;}
  if(actCool>0||mission||DLG.open||game.state!=='play'||stars()>0||(typeof job!=='undefined'&&job)||roofRun)return;
  if(RCPAD&&!player.car&&(player.jz||0)<4&&hyp(player.x-RCPAD.x,player.y-RCPAD.y)<34){actCool=5;
    say([['RC Wreckers','Two minutes. Drive the toy car under anything on wheels and set it off. $300 a wreck.'+(STATS.rcBest?' Your best: '+STATS.rcBest:'')]],null,[['GO',()=>rcStart()],['NOT NOW',()=>{},'no']]);return;}
  const c=player.car;if(c&&!c.t.boat&&!c.t.heli&&!c.t.rc&&hyp(c.vx,c.vy)<90)for(const o of OFFROAD)if(hyp(c.x-o.x,c.y-o.y)<50){actCool=5;const b=STATS.offBest&&STATS.offBest[o.id];
    say([[o.name,o.cps.length+' checkpoints across open country, against the clock. Every checkpoint buys more time. Stay in your vehicle.'+(b?' Best: '+b.toFixed(1)+' s':'')]],null,[['GO',()=>offStart(o)],['NOT NOW',()=>{},'no']]);return;}}
function drawRC(c,fg,t,a){const ca=Math.cos(a),sa=Math.sin(a),col=rgbOf(c.col),hl=t.L/2,hw=t.Wd/2;
  obox(c.x,c.y,a,hl*0.9,hw,0,3,[20,20,22],null,fg);obox(c.x,c.y,a,hl,hw*0.72,1.5,5,col,mixA(col,[255,255,255],0.2),fg);obox(c.x-ca*hl*0.15,c.y-sa*hl*0.15,a,hl*0.35,hw*0.5,5,7.5,[30,30,34],[50,50,56],fg);
  obox(c.x-ca*hl*0.7,c.y-sa*hl*0.7,a,0.5,0.5,5,15,[200,200,200],null,fg);
  if(proj(c.x-ca*hl*0.7,c.y-sa*hl*0.7,15.5)&&Math.floor(game.t*5)%2)glow(PX,PY,2*PK,'#ff3030',0.9);}

// ---------- the Dodo: a stubby-winged plane that needs a run-up and never really wants to fly ----------
CT.dodo={name:'Dodo',L:40,Wd:44,max:640,acc:300,grip:10,turn:2,hp:140,mass:0.9,cols:['#e8e4d8','#d8382a','#2a6ad8'],heli:true,plane:true};
const STRIP=(()=>{let best=null,bs=1e9;for(let y=500;y<WPX-500;y+=70)for(const x0 of[WPX+230,WPX+330]){const x1=x0+760;let lo=1e9,hi=-1e9,bad=false;
    for(let x=x0-60;x<=x1+60&&!bad;x+=20){const g=GH(x,y);lo=Math.min(lo,g);hi=Math.max(hi,g);for(let o=-80;o<=80;o+=20)if(solidPx(x,y+o)||tileAt(Math.floor(x/T),Math.floor((y+o)/T))!==GRASS){bad=true;break;}}
    if(RAMPS.some(r=>r.x>x0-80&&r.x<x1+80&&Math.abs(r.y-y)<110))bad=true;
    if(!bad&&hi-lo<bs){bs=hi-lo;best={x0,x1,y};}}
  if(!best)return null;const s=best;
  for(let i=props.length-1;i>=0;i--){const p=props[i];if(p.k==='hay'&&p.x>s.x0-40&&p.x<s.x1+40&&Math.abs(p.y-s.y)<70)props.splice(i,1);}
  for(let x=s.x0;x<=s.x1;x+=95)for(const sd of[-1,1])props.push({x,y:s.y+sd*46,k:'cone',rad:6,ht:10});
  SIGNS.push({x:s.x0-30,y:s.y-70,text:'AIRSTRIP',bg:'#2a5fa8',fg:'#ffffff',h:40,on:()=>true});return s;})();
function spawnDodo(){if(!STRIP)return;if(cars.some(c=>c.t.plane&&!c.wreck&&hyp(c.x-STRIP.x0,c.y-STRIP.y)<300))return;const c=makeCar('dodo',STRIP.x0+30,STRIP.y,0);c.alt=0;return c;}
function planeDrive(c,thr,steer,hb,dt){c.alt=c.alt||0;const pl=c===player.car,ca=Math.cos(c.a),sa=Math.sin(c.a);let vf=c.vx*ca+c.vy*sa;c.rot=(c.rot||0)+dt*(c.driver?40:0);c.driven=true;c.skid=false;
  const up=pl&&(kd.Space||tbtn.brake.on),dn=pl&&(kd.ShiftLeft||kd.ShiftRight||tbtn.nos.on);
  if(c.alt<=0.5){c.alt=0; // on the ground: a slow, wide-turning taxi and a long take-off run
    if(c.driver){vf+=(thr>0?c.t.acc*(1-vf/c.t.max):thr<0?(vf>20?-420:-90):0)*dt;vf=Math.max(-70,vf);}
    vf*=Math.exp(-(c.driver&&thr>0?0.05:0.9)*dt);c.a+=steer*1.5*dt*clamp(Math.abs(vf)/160,0,1)*(vf<0?-1:1);c.va=0;
    if(up&&vf>330){c.alt=1;c.sink=-40;if(pl)sfx('rocket',0.2);}else c.sink=0;}
  else{ // in the air: it sinks unless you hold the nose up, and falls out of the sky below stall speed
    if(!c.driver){c.alt=Math.max(0,c.alt-140*dt);vf*=Math.exp(-0.6*dt);}
    else{const want=thr>0?c.t.max:thr<0?250:400;vf=lerp(vf,want,Math.min(1,dt*(thr?0.55:0.3)));c.a+=steer*1.15*dt;c.va=0;c.bank=lerp(c.bank||0,steer*0.5,Math.min(1,dt*4));
      let rate=up?74:dn?-120:-9;rate+=Math.sin(game.t*2.1+c.id)*12;if(vf<300)rate=-70-180*(1-vf/300);if(c.hp<c.t.hp*0.4)rate-=40;
      c.sink=-rate;c.alt=clamp(c.alt+rate*dt,0,250);
      if(c.alt<=0.5){c.alt=0;const hard=c.sink>105||vf>560;if(hard){damageCar(c,c.sink>105?(c.sink-70)*1.2:25,pl?'player':null);shake=Math.max(shake,8);sfx('crash',0.7);vf*=0.6;if(pl)note('Hard landing!');}else if(pl)sfx('door',0.3);}}
    for(const b of buildings){if(c.x<b.x-14||c.x>b.x+b.w+14||c.y<b.y-14||c.y>b.y+b.h+14)continue;const top=(b.tier?b.tier.hg2:b.hg)*BH+8;if(c.alt>top)continue;
      const dl=c.x-(b.x-14),dr=b.x+b.w+14-c.x,du=c.y-(b.y-14),dd=b.y+b.h+14-c.y,m=Math.min(dl,dr,du,dd);if(m===dl)c.x-=dl;else if(m===dr)c.x+=dr;else if(m===du)c.y-=du;else c.y+=dd;
      damageCar(c,60+Math.abs(vf)*0.12,pl?'player':null);shake=Math.max(shake,9);vf*=-0.25;}}
  // the edge of the world: the plane is turned back toward the city
  {const lo=-HM+260,hi=WPX+HM-260;if(c.x<lo||c.x>hi||c.y<lo||c.y>hi){const back=Math.atan2(WPX/2-c.y,WPX/2-c.x);c.a=lerpAng(c.a,back,Math.min(1,dt*2.5));c.x=clamp(c.x,lo-40,hi+40);c.y=clamp(c.y,lo-40,hi+40);if(pl&&!c.edgeN){c.edgeN=1;note('Nothing out there. Turning back');}}else c.edgeN=0;}
  const vl=(-c.vx*sa+c.vy*ca)*Math.exp(-6*dt),c2=Math.cos(c.a),s2=Math.sin(c.a);c.vx=c2*vf-s2*vl;c.vy=s2*vf+c2*vl;}
function drawPlaneP(c,fg,t,a){const ca=Math.cos(a),sa=Math.sin(a),col=c.wreck?[40,36,33]:rgbOf(c.col),lite=mixA(col,[255,255,255],0.15),dk=mixA(col,[0,0,0],0.25),front=(CX-c.x)*ca+(CY-c.y)*sa>0;
  const B=(f,s,l,w,z0,z1,sd,tp)=>obox(c.x+ca*f-sa*s,c.y+sa*f+ca*s,a,l,w,z0,z1,sd,tp,fg);
  for(const s of[-1,1])B(3,s*6,2,1.2,0,3,[24,24,26]);B(-17,0,1.2,1,0,3,[24,24,26]);
  B(2,0,5.5,21,3,4.6,dk,col); // the clipped wing, low on the body, drawn first so the fuselage covers its middle
  const tail=()=>{B(-17,0,3,8,7,8,dk,col);B(-18,0,3.2,0.8,8,17,col,lite);},body=()=>{B(-3,0,17,3.8,3,10,col,lite);},nose=()=>{B(15.5,0,2,2.6,4,9,[60,60,66],[80,80,86]);};
  const pit=()=>B(3,0,5,3.1,10,13.5,c.wreck?[20,20,20]:[120,160,190],[60,70,80]);
  if(front){tail();body();pit();nose();}else{nose();body();pit();tail();} // far end first (rendering rule 2)
  if(!c.wreck&&c.driver&&proj(c.x+ca*18,c.y+sa*18,6.5)){const r=c.rot||0,s=7*PK;L3.strokeStyle='rgba(20,20,24,.7)';L3.lineWidth=1;L3.beginPath();for(let i=0;i<2;i++){const ra=r+i*PI/2;L3.moveTo(PX-Math.cos(ra)*s,PY-Math.sin(ra)*s);L3.lineTo(PX+Math.cos(ra)*s,PY+Math.sin(ra)*s);}L3.stroke();}}
const FLIGHT={t:0,was:null};
function updateFlight(dt){const c=player.car,pln=c&&c.t.plane?c:null;
  if(pln&&FLIGHT.was!==pln)note(touchMode?'Dodo: gas to build speed, then hold BRAKE to lift off. NOS to dive':'Dodo: hold W to build speed, then SPACE to pull up. SHIFT to dive. Keep your speed or it stalls');FLIGHT.was=pln;
  if(pln&&pln.alt>6&&!pln.wreck){FLIGHT.t+=dt;return;}
  if(FLIGHT.t>1.5){const t=FLIGHT.t,best=STATS.flightBest||0;STATS.flightBest=Math.max(best,t);showBig('FLIGHT TIME',t.toFixed(1)+' seconds'+(t>best&&best>0?'  ·  NEW RECORD':''),'#8ecbff',2.6);}
  FLIGHT.t=0;}
let dodoT=4;
function extrasTick(dt){updateScreenRain(dt);updateActs(dt);updateFlight(dt);updateRating(dt);
  dodoT-=dt;if(dodoT<=0){dodoT=6;if(STRIP&&hyp((player.car||player).x-STRIP.x0,(player.car||player).y-STRIP.y)<2600)spawnDodo();}}
function extrasHUD(sc){if(DBGFPS){fpsTick();hudText(fpsV+' FPS',VW/2,16*sc,Math.round(13*sc),'#7dff8a','center','system-ui,sans-serif');}
  if(FLIGHT.t>0.3)hudText('FLIGHT  '+FLIGHT.t.toFixed(1)+' s',VW/2,(touchMode?70:44)*sc,Math.round(18*sc),'#8ecbff','center');
  const c=player.car;if(c&&c.t.plane&&!c.wreck){const v=Math.round(Math.abs(hyp(c.vx,c.vy))/10),stall=c.alt>6&&hyp(c.vx,c.vy)<320;
    hudText((c.alt>6?'ALT '+Math.round(c.alt):'SPEED '+v+(v>=33?'  ·  PULL UP':''))+(stall&&Math.floor(game.t*5)%2?'   STALL':''),VW/2,(touchMode?92:66)*sc,Math.round(13*sc),stall?'#ff5050':'#dfe9f5','center','system-ui,sans-serif');}}
function extrasMap(P2,icon0){const[bx0,by0]=P2(0,0),[bx1,by1]=P2(WPX,WPX),k=(bx1-bx0)/WPX,icon=(x,y,c,t)=>{const px=clamp(bx0+x*k,bx0-9,bx1+9),py=clamp(by0+y*k,by0-9,by1+9);icon0((px-bx0)/k,(py-by0)/k,c,t);}; // things out in the country sit on the map's edge
  if(RCPAD)icon(RCPAD.x,RCPAD.y,'#e02a2a','RC');for(const o of OFFROAD)icon(o.x,o.y,'#8a5a2a','4');if(STRIP)icon(STRIP.x0,STRIP.y,'#2a5fa8','✈');
  for(const r of USJ)if(!(STATS.usj&&STATS.usj[r.usj]))icon(r.x,r.y,'#e0338a','★');
  if(ACT&&ACT.kind==='off')for(let i=ACT.i;i<ACT.cps.length;i++){const[a,b]=P2(ACT.cps[i].x,ACT.cps[i].y);ctx.fillStyle=i===ACT.i?'#ffd600':'rgba(255,214,0,.4)';ctx.beginPath();ctx.arc(a,b,i===ACT.i?6:4,0,TAU);ctx.fill();}}
