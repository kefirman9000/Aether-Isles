// ================= STORY, SAFEHOUSES, BOATS, UPGRADES, FIRE TRUCK, RACES, HORN, STREET LIFE =================
// --- helpers ---
const ixPt=(ix,iy)=>({x:(ix*P+2)*T,y:(iy*P+2)*T});
const blockPt=(bx,by)=>({x:(bx*P+9)*T,y:(by*P+9)*T});
function walkNear(x,y,r){for(let i=0;i<80;i++){const a=R()*TAU,d=R()*r,px=x+Math.cos(a)*d,py=y+Math.sin(a)*d,t=tileAt(Math.floor(px/T),Math.floor(py/T));if(walkable(t))return{x:px,y:py};}return{x,y};}
function lotNear(x,y,minD,maxD){const c=lotBlocks.filter(l=>{const d=hyp(l.x-x,l.y-y);return d>=(minD||0)&&d<=(maxD||1e9);});return c.length?pick(c):pick(lotBlocks);}
function nearestLot(x,y){let b=null,bd=1e18;for(const l of lotBlocks){const d=dist2(l.x,l.y,x,y);if(d<bd){bd=d;b=l;}}return b;}
const waterZ=(x,y)=>{const tx=Math.floor(x/T);return tx>=RIVX0&&tx<RIVX1?RIVL:GH(x,y);};
const vib=ms=>{try{if(touchMode&&navigator.vibrate)navigator.vibrate(ms);}catch(_){}};
const SIGNS=[];// {x,y,text,bg,fg,on()}
// --- landmarks used by missions ---
const LM={
  tsq:ixPt(TSQ.ix,TSQ.iy),
  park:{x:((CPARK.x0+CPARK.x1)/2*P+9)*T,y:((CPARK.y0+CPARK.y1)/2*P+9)*T},
  bridgeW:ixPt(6,BIGB),bridgeE:ixPt(8,BIGB),bridgeMid:{x:(RIVX0+RIVX1)/2*T,y:(BIGB*P+2)*T},
  hq:null,hosp:null,
  beachW:(()=>{for(let bx=1;bx<6;bx++)if(BLOCKK[(NB-1)*NB+bx]==='beach')return{x:(bx*P+9)*T,y:((NB-1)*P+7.5)*T};return blockPt(3,NB-1);})(),
  beach:(()=>{for(let bx=NB-2;bx>=0;bx--)if(BLOCKK[(NB-1)*NB+bx]==='beach')return{x:(bx*P+9)*T,y:((NB-1)*P+7.5)*T};return blockPt(10,NB-1);})(),
  site:(()=>{for(let i=0;i<NB*NB;i++)if(BLOCKK[i]==='construct')return blockPt(i%NB,Math.floor(i/NB));return blockPt(15,4);})(),
  dockW:{x:RIVX0*T+14,y:(6*P+9)*T},dockE:{x:RIVX1*T-14,y:(12*P+9)*T},dockS:{x:RIVX1*T-14,y:(16*P+9)*T},
};
// ---------- dialogue box ----------
const DLG={open:false,lines:null,i:0,done:null,choice:null};
(function(){const d=document.createElement('div');d.id='dlg';d.innerHTML='<div class="who"></div><div class="txt"></div><div class="btns"></div><div class="hint">tap / Enter ▸</div>';document.body.appendChild(d);
  const st=document.createElement('style');st.textContent=`#dlg{position:fixed;left:50%;bottom:7vh;transform:translateX(-50%);width:min(720px,92vw);background:rgba(8,8,12,.92);border:2px solid #ffc21a;border-radius:6px;padding:14px 18px 10px;color:#eee;font:16px system-ui;z-index:4;display:none;box-sizing:border-box;cursor:pointer;user-select:none}
#dlg .who{font-family:Pricedown,Anton,Impact,sans-serif;color:#ffc21a;font-size:18px;margin-bottom:4px}#dlg .txt{line-height:1.45;min-height:2.6em}#dlg .hint{text-align:right;color:#888;font-size:12px}
#dlg .btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}#dlg .btns button.sel{outline:3px solid #fff;outline-offset:2px}#dlg .btns button{all:unset;cursor:pointer;font-family:Pricedown,Anton,Impact,sans-serif;background:#c9a23a;color:#111;padding:8px 16px;border-radius:4px}#dlg .btns button.no{background:#33333d;color:#ddd}
#shop{position:fixed;right:3vw;top:14vh;width:min(330px,88vw);background:rgba(8,8,12,.92);border:2px solid #3ee07a;border-radius:6px;padding:14px 16px;color:#ddd;font:14px system-ui;z-index:4;display:none}
#shop h3{margin:0 0 8px;font-family:Pricedown,Anton,Impact,sans-serif;font-weight:400;color:#3ee07a;font-size:20px}#shop .row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #2a2a33}
#shop button{all:unset;cursor:pointer;font-family:Pricedown,Anton,Impact,sans-serif;background:#3ee07a;color:#111;padding:6px 12px;border-radius:4px;white-space:nowrap}#shop button:disabled{opacity:.35;cursor:default}#shop small{color:#999}
#rotate{position:fixed;inset:0;background:#08080c;color:#ffc21a;display:none;align-items:center;justify-content:center;text-align:center;font:22px Pricedown,Anton,Impact,sans-serif;z-index:9;padding:20px}`;document.head.appendChild(st);
  d.addEventListener('click',e=>{if(e.target.tagName==='BUTTON')return;dlgNext();});
  const s=document.createElement('div');s.id='shop';document.body.appendChild(s);
  const r=document.createElement('div');r.id='rotate';r.innerHTML='<div>⟳<br>Turn your phone sideways to play</div>';document.body.appendChild(r);})();
function dlgShow(){const d=document.getElementById('dlg'),l=DLG.lines[DLG.i];d.style.display='block';d.querySelector('.who').textContent=l[0];d.querySelector('.txt').textContent=l[1];
  const b=d.querySelector('.btns');b.innerHTML='';const last=DLG.i===DLG.lines.length-1;d.querySelector('.hint').style.display=last&&DLG.choice?'none':'block';
  if(last&&DLG.choice){DLG.sel=0;let ci=0;for(const[lab,fn,cls]of DLG.choice){const bt=document.createElement('button');bt.textContent=(DLG.choice.length>2&&!touchMode?(++ci)+'  ':'')+lab;if(ci===1||(DLG.choice.length<=2&&b.children.length===0))bt.classList.add('sel');if(cls)bt.className=cls;bt.onclick=()=>{dlgClose();fn();};b.appendChild(bt);}}}
function say(lines,done,choice){DLG.open=true;DLG.lines=lines;DLG.i=0;DLG.done=done||null;DLG.choice=choice||null;dlgShow();sfx('ring',0.3);}
function dlgNext(){if(!DLG.open)return;if(DLG.i<DLG.lines.length-1){DLG.i++;dlgShow();return;}if(DLG.choice)return;const f=DLG.done;dlgClose();if(f)f();}
function dlgClose(){DLG.open=false;document.getElementById('dlg').style.display='none';}
function dlgMark(){[...document.querySelectorAll('#dlg .btns button')].forEach((bt,i)=>bt.classList.toggle('sel',i===DLG.sel));}
window.addEventListener('keydown',e=>{if(!DLG.open)return;
  if(DLG.choice&&DLG.i===DLG.lines.length-1){const n=DLG.choice.length;let pk=-1;
    if(['ArrowLeft','ArrowUp','KeyA','KeyW'].includes(e.code)){DLG.sel=(DLG.sel+n-1)%n;dlgMark();}
    else if(['ArrowRight','ArrowDown','KeyD','KeyS','Tab'].includes(e.code)){DLG.sel=(DLG.sel+1)%n;dlgMark();}
    else if(e.code==='Enter'||e.code==='Space'||e.code==='KeyF'||e.code==='KeyE')pk=DLG.sel;
    else if(e.code==='Escape'||e.code==='Backspace'||e.code==='KeyN')pk=n-1;
    else if(e.code==='KeyY')pk=0;
    else if(/^Digit[1-9]$/.test(e.code)&&+e.code[5]<=n)pk=+e.code[5]-1;
    else return;
    if(pk>=0){const c=DLG.choice[pk];dlgClose();c[1]();}e.preventDefault();e.stopImmediatePropagation();return;}
  if(e.code==='Enter'||e.code==='Space'||e.code==='KeyF'||e.code==='KeyE'){dlgNext();e.preventDefault();e.stopImmediatePropagation();}
  else if(DLG.choice&&DLG.i===DLG.lines.length-1&&(e.code==='KeyY'||e.code==='KeyN')){const c=DLG.choice[e.code==='KeyY'?0:1];if(c){dlgClose();c[1]();}e.stopImmediatePropagation();}},true);

// ---------- gang bosses and the story ----------
const BOSSES=[
  {g:0,name:'Vince "Razor" Moreno',pt:null,ini:'V'},
  {g:1,name:'Dex Calloway, "The Chairman"',pt:null,ini:'D'},
  {g:2,name:'Mother Lin',pt:null,ini:'M'},
];
// GTA-style radar blip: the first letter of the boss's name in their gang's color, outlined in black.
// It's big and bright while they have work for you, small and faded when they don't.
function bossBlip(cx,x,y,b,sz){const av=storyAvail(b.g),s=Math.round(sz*(av?1:0.72));cx.save();cx.font=`900 ${s}px "Arial Black",Impact,system-ui`;cx.textAlign='center';cx.textBaseline='middle';
  cx.globalAlpha=av?1:0.6;cx.lineJoin='round';cx.lineWidth=Math.max(2.5,s*0.24);cx.strokeStyle='#000';cx.strokeText(b.ini,x,y+1);
  cx.fillStyle=GANGS[b.g].col;cx.fillText(b.ini,x,y+1);
  if(av&&Math.floor(game.t*2)%2){cx.lineWidth=1;cx.strokeStyle='#ffd600';cx.strokeText(b.ini,x,y+1);}
  cx.restore();}
{const zc=[[NB/4,NB/4],[NB*3/4,NB/4],[NB/4,NB*3/4]];
 BOSSES.forEach((b,i)=>{let best=null,bd=1e18;for(const l of lotBlocks){if(zoneOf(l.x,l.y)!==i)continue;const tx=Math.floor(l.x/T);if(tx>=RIVX0-4&&tx<RIVX1+4)continue;const d=dist2(l.x,l.y,(zc[i][0]*P+9)*T,(zc[i][1]*P+9)*T);if(d<bd){bd=d;best=l;}}
   b.pt=best?{x:best.x,y:best.y}:blockPt(zc[i][0],zc[i][1]);
   SIGNS.push({x:b.pt.x,y:b.pt.y-46,text:GANGS[i].name.toUpperCase(),bg:GANGS[i].car,fg:'#f5f1e2',h:44,on:()=>true});});}
// GTA III-style mission markers: a glowing circle on the ground beside each boss; step into it to start the job
for(const b of BOSSES){let mk=null;for(const r of[58,72,46])for(let k=0;k<8&&!mk;k++){const a=PI/2+k*PI/4,x=b.pt.x+Math.cos(a)*r,y=b.pt.y+Math.sin(a)*r;if(walkable(tileAt(Math.floor(x/T),Math.floor(y/T)))&&!solidPx(x,y))mk={x,y};}b.mk=mk||{x:b.pt.x,y:b.pt.y+50};b.mk.g=b.g;}
const STORY={prog:[0,0,0],fin:0};
// ---- the city opens up in stages, like GTA III's islands: you start on the west bank (Old Town, the Lotus Quarter).
// The bridges east stay closed until you've done two jobs for Vince; then the rest of the city opens.
const cityOpen=()=>!!(STORY.fin||STORY.prog[0]>=2||STORY.prog[1]>0||STORY.prog[2]>=2||OPT.openCity);
const WOK=(x,y)=>cityOpen()||x<RIVX0*T;
const BARRIERS=[];
{for(const iy of BRIDGES){const y0=iy*P,x=RIVX0+1;for(let ty=y0;ty<y0+4;ty++)BARRIERS.push({tx:x,ty,orig:map[ty*W+x]});
  props.push({x:(x+.5)*T,y:(y0+2)*T,k:'closed',rad:80,ht:40});}}

function syncBarriers(){const want=!cityOpen();if(want===barriersUp)return;barriersUp=want;
  for(const b of BARRIERS)map[b.ty*W+b.tx]=want?BLD:b.orig;
  if(!want&&game.started){showBig('THE CITY IS OPEN','The bridges are open. The east side is yours to explore','#ffd24a',4);radioMsg('NEWS: All three East River bridges reopen to traffic.');pager('Vince: bridges are open. Dex Calloway uptown and Mother Lin want to meet you.');}}
const VINCE=BOSSES[0].name,DEX=BOSSES[1].name,LIN=BOSSES[2].name,YOU='You';
// step kinds: talk, steal, drive, wreck, kill, collect, heat, lose, boat
const CHAPTERS=[
 [ // Red Sabres
  {title:'Welcome to the Family',pay:2000,steps:[
    {k:'talk',lines:[[VINCE,'So you\'re the new face everybody\'s talking about. Talk is cheap. Wheels aren\'t.'],[VINCE,'There\'s a red Viper sitting in a lot across town. Bring it here without a scratch on it and we\'ll talk business.']]},
    {k:'steal',type:'sports',col:'#a8101c',where:()=>lotNear(player.x,player.y,1400,2600),desc:'Steal the red Viper'},
    {k:'drive',to:()=>BOSSES[0].pt,car:'stolen',minHp:0.5,desc:'Bring the Viper back to Vince in one piece'},
    {k:'talk',lines:[[VINCE,'Not bad. Not bad at all. Come back when you want real work.']]}]},
  {title:'Bridge Run',pay:3000,steps:[
    {k:'talk',lines:[[VINCE,'A Chrome Saints courier is carrying our money over the Gridlock Bridge right now.'],[VINCE,'Stop him before he reaches the other side. I don\'t care how.']]},
    {k:'wreck',at:()=>({x:(RIVX0-14)*T,y:(BIGB*P+2.5)*T}),type:'sedan',col:'#2a2c31',hp:200,cruise:250,timer:120,desc:'Wreck the Saints courier on the Gridlock Bridge'}]},
  {title:'Collections',pay:3000,steps:[
    {k:'talk',lines:[[VINCE,'Three shop owners on the west side forgot to pay. Their envelopes are waiting. Pick them up before the cops do.']]},
    {k:'collect',n:3,around:()=>({x:3*P*T,y:5*P*T}),spread:1500,timer:150,desc:'Pick up the 3 envelopes'}]},
  {title:'Heat Wave',pay:4500,steps:[
    {k:'talk',lines:[[VINCE,'The cops raided my garage. Time to remind them who runs Old Town.'],[VINCE,'Go kick up some noise outside Police HQ, then lose them. Don\'t lead them back here.']]},
    {k:'drive',to:()=>policeSpawn,r:160,desc:'Drive to Police HQ'},
    {k:'heat',stars:3},
    {k:'lose',timer:180,desc:'Lose the 3-star wanted level'},
    {k:'talk',lines:[[VINCE,'Ha! The whole radio was screaming about you. You\'re one of us now.'],[VINCE,'Watch yourself around Dex. That man smiles too much.']]}]},
  {title:'Jump the Gap',pay:3500,steps:[
    {k:'talk',lines:[[VINCE,'My nephew says nobody can make a real jump in this town anymore. Prove him wrong.'],[VINCE,'Find a ramp: an alley, a lot, the construction site. Stay in the air for a full second and a half.']]},
    {k:'jump',air:1.5,timer:240,desc:'Hit a ramp and stay airborne for 1.5 s'}]},
  {title:'Riverside Rumble',pay:5500,steps:[
    {k:'talk',lines:[[VINCE,'Jade Lotus boys are unloading on the riverside like they own it.'],[VINCE,'Break up the party, then take one of their boats down to the south dock. They hate that.']]},
    {k:'kill',gang:2,n:6,around:()=>({x:RIVX0*T-60,y:(11*P+9)*T}),spread:260,timer:180,desc:'Take out the 6 Jade Lotus on the riverside'},
    {k:'boat'},
    {k:'drive',to:()=>LM.dockS,car:'boat',r:110,timer:120,desc:'Take the boat to the south dock'}]},
 ],
 [ // Chrome Saints
  {title:'Times Square Handoff',pay:2500,steps:[
    {k:'talk',lines:[[DEX,'Ah, the freelancer. I like freelancers. They don\'t ask for health insurance.'],[DEX,'A friend of mine is waiting in Times Square with a package. Collect it and bring it to the drop. Quickly.']]},
    {k:'drive',to:()=>LM.tsq,r:110,desc:'Meet the contact in Times Square'},
    {k:'drive',to:()=>lotNear(LM.tsq.x,LM.tsq.y,1800,3200),car:'any',timer:100,desc:'Deliver the package to the drop'}]},
  {title:'Park Life',pay:3500,steps:[
    {k:'talk',lines:[[DEX,'The Red Sabres are dealing in Central Park. My park. Where I jog.'],[DEX,'Clear them out.']]},
    {k:'kill',gang:0,n:6,around:()=>LM.park,spread:300,timer:180,desc:'Take out the 6 Red Sabres in Central Park'}]},
  {title:'Off the Books',pay:4000,steps:[
    {k:'talk',lines:[[DEX,'An accountant of mine needs to vanish. There\'s a speedboat on the west bank of the East River.'],[DEX,'Take it, and get to the dock on the far side. Boats don\'t get stuck in traffic.']]},
    {k:'drive',to:()=>LM.dockW,r:90,desc:'Get to the speedboat on the west bank'},
    {k:'boat'},
    {k:'drive',to:()=>LM.dockE,car:'boat',r:110,timer:140,desc:'Take the boat to the east dock'}]},
  {title:'Armored Interest',pay:5000,steps:[
    {k:'talk',lines:[[DEX,'A bank truck is making its rounds. It owes me money. Technically.'],[DEX,'Crack it open. It\'s armored, so bring something with a kick.']]},
    {k:'wreck',at:()=>({x:player.x,y:player.y}),far:900,type:'truck',col:'#3a4a3a',hp:600,cruise:180,timer:180,desc:'Wreck the armored truck'},
    {k:'talk',lines:[[DEX,'Wonderful. You and I are going to do great things together.'],[DEX,'Mother Lin, though... she\'s old-fashioned. Be careful who you trust.']]}]},
  {title:'Hostile Takeover',pay:5000,steps:[
    {k:'talk',lines:[[DEX,'I want a SWAT van for a little... corporate event. They park them at Police HQ.'],[DEX,'Bring it to me. Expect some disagreement from the owners.']]},
    {k:'steal',type:'swat',col:'#1c1e24',where:()=>({x:policeSpawn.x+3*T,y:policeSpawn.y+2*T}),desc:'Steal the SWAT van at Police HQ'},
    {k:'heat',stars:3},
    {k:'drive',to:()=>BOSSES[1].pt,car:'stolen',desc:'Bring the SWAT van to Dex'},
    {k:'lose',timer:200,desc:'Now lose the cops'}]},
  {title:'Penthouse Party',pay:4500,steps:[
    {k:'talk',lines:[[DEX,'I\'m throwing a party and the caterers have gone missing. With my champagne.'],[DEX,'Four crates, scattered around Times Square. Ninety seconds. Go.']]},
    {k:'collect',n:4,around:()=>LM.tsq,spread:700,timer:90,desc:'Grab the 4 champagne crates around Times Square'}]},
  {title:'Rush Hour',pay:6000,steps:[
    {k:'talk',lines:[[DEX,'A courier with my ledger just got on the El. He thinks trains are safe.'],[DEX,'Follow the train. When he gets off, he\'s yours.']]},
    {k:'eltrain',timer:150,desc:'Follow the El train. The courier gets off at the next stop'},
    {k:'kill',gang:-1,n:0,timer:90,desc:'Take out the courier before he gets away'}]},
 ],
 [ // Jade Lotus
  {title:'Beach Pickup',pay:2500,steps:[
    {k:'talk',lines:[[LIN,'Sit. Drink your tea. Good. Now listen.'],[LIN,'A boat dropped three packages on South Beach last night. Find them before the tourists do.']]},
    {k:'collect',n:3,around:()=>cityOpen()?LM.beach:LM.beachW,spread:600,sand:true,timer:150,desc:'Find the 3 packages on the beach'}]},
  {title:'Fragile Cargo',pay:3500,steps:[
    {k:'talk',lines:[[LIN,'There\'s a Hauler at the construction site. What\'s inside is worth more than you.'],[LIN,'Bring it to me gently. If the truck is wrecked, do not come back.']]},
    {k:'steal',type:'truck',col:'#7a4824',where:()=>LM.site,desc:'Take the Hauler from the construction site'},
    {k:'drive',to:()=>BOSSES[2].pt,car:'stolen',minHp:0.6,desc:'Drive the Hauler back to Mother Lin gently'}]},
  {title:'Lantern Festival',pay:4000,steps:[
    {k:'talk',lines:[[LIN,'The Chrome Saints insulted my family at the festival. Remind them of their manners.']]},
    {k:'kill',gang:1,n:7,around:()=>({x:(NB*3/4*P+9)*T,y:(NB/4*P+9)*T}),spread:600,timer:200,desc:'Take out the 7 Chrome Saints on their turf'}]},
  {title:'Night Ferry',pay:5000,steps:[
    {k:'talk',lines:[[LIN,'The police are watching the roads tonight. So we take the river.'],[LIN,'Get on the water, make them chase you, and lose them. A ghost leaves no tracks.']]},
    {k:'drive',to:()=>LM.dockE,r:90,desc:'Get to the boat at the east dock'},
    {k:'boat'},
    {k:'heat',stars:2},
    {k:'lose',timer:180,needBoat:true,desc:'Lose the cops on the water'},
    {k:'talk',lines:[[LIN,'You did well. Now hear an old woman\'s warning.'],[LIN,'Dex Calloway has been buying everyone\'s secrets. Soon he will try to buy yours.']]}]},
  {title:'Ghost Cab',pay:4000,steps:[
    {k:'talk',lines:[[LIN,'Three of my people need rides tonight, and nobody notices a taxi.'],[LIN,'Take a cab and visit each of them. Don\'t keep them waiting.']]},
    {k:'steal',type:'taxi',where:()=>lotNear(player.x,player.y,300,1200),desc:'Get the taxi waiting nearby'},
    {k:'drive',to:()=>lotNear(player.x,player.y,900,1800),car:'stolen',timer:70,desc:'First pickup'},
    {k:'drive',to:()=>lotNear(player.x,player.y,900,1800),car:'stolen',timer:70,desc:'Second pickup'},
    {k:'drive',to:()=>lotNear(player.x,player.y,900,1800),car:'stolen',timer:70,desc:'Third pickup'}]},
  {title:'Fireworks',pay:6000,steps:[
    {k:'talk',lines:[[LIN,'The Red Sabres burned my cousin\'s restaurant. Tonight we answer with fireworks.'],[LIN,'Three of their cars are cruising the old town. None of them gets home.']]},
    {k:'wreck',at:()=>({x:4*P*T,y:4*P*T}),far:500,type:'sedan',col:'#4f1418',hp:160,cruise:230,timer:120,desc:'Wreck the first Red Sabres car'},
    {k:'wreck',at:()=>({x:player.x,y:player.y}),far:900,type:'sports',col:'#4f1418',hp:160,cruise:260,timer:120,desc:'Wreck the second Red Sabres car'},
    {k:'wreck',at:()=>({x:player.x,y:player.y}),far:900,type:'sedan',col:'#4f1418',hp:200,cruise:240,timer:120,desc:'Wreck the last Red Sabres car'}]},
 ],
];
const FINALE={title:'Gridlock',pay:25000,steps:[
  {k:'talk',lines:[[YOU,'Dex called. He wants to meet at the construction site.'],[DEX,'(on the phone) Come alone, friend. It\'s time we talked about your future.']]},
  {k:'drive',to:()=>LM.site,r:140,desc:'Meet Dex at the construction site'},
  {k:'talk',lines:[[DEX,'Nothing personal. Vince, Lin and I all paid the cops to make you the fall guy.'],[DEX,'Well. I paid them. The other two don\'t know yet. Goodbye, freelancer.']]},
  {k:'heat',stars:4},
  {k:'kill',gang:1,n:8,around:()=>LM.site,spread:260,timer:200,desc:'Survive the ambush: take out the 8 Saints'},
  {k:'drive',to:()=>LM.bridgeMid,r:120,timer:160,desc:'Dex is fleeing over the Gridlock Bridge. Get there!'},
  {k:'wreck',at:()=>({x:LM.bridgeMid.x+260,y:LM.bridgeMid.y+20}),type:'fbi',col:'#c0c0c8',hp:420,cruise:300,timer:120,desc:'Wreck Dex\'s car'},
  {k:'lose',timer:240,desc:'Lose the cops'},
  {k:'talk',lines:[[VINCE,'(on the phone) Heard Dex took a swim. Shame.'],[LIN,'(on the phone) The city has a new name for you now.'],[YOU,'Gridlock City is mine.']]}]};
function storyAvail(g){if(!cityOpen()&&g!==0&&!(g===2&&STORY.prog[2]===0))return null;if(STORY.prog[g]<CHAPTERS[g].length)return CHAPTERS[g][STORY.prog[g]];if(!STORY.fin&&STORY.prog.every((p,i)=>p>=CHAPTERS[i].length)&&g===0)return FINALE;return null;}
// ---- the mission runner (story missions and races use it) ----
function runMission(def,opts){
  sfx('pass');mission={type:'story',def,opts:opts||{},title:def.title,desc:'',timer:9999,max:9999,steps:def.steps,si:-1,gang:-1,tgt:null,ring:false,x:0,y:0,clock:0};
  if(opts&&opts.boss&&def.steps[0]&&def.steps[0].k==='talk')cutStart(opts.boss);
  else showBig(def.title.toUpperCase(),opts&&opts.sub||'','#ffcc00',2.6);
  stepNext();}
// ---- mission intro scenes, GTA III-style: fade from black, a side-on shot of you and the boss in letterbox while they talk, then fade back to play ----
const SCENE={on:false,phase:'',t:0,f:0,boss:null,after:null,side:1};
function cutStart(boss){SCENE.on=true;SCENE.phase='in';SCENE.t=0;SCENE.f=1;SCENE.boss={x:boss.x,y:boss.y};SCENE.after=null;
  const a=Math.atan2(boss.y-player.y,boss.x-player.x);player.a=player.body=a;player.vx=player.vy=0;LOCK.t=null;
  // put the camera on whichever side of the pair has room
  const mx=(player.x+boss.x)/2,my=(player.y+boss.y)/2;let best=1,bs=-1;for(const sd of[1,-1]){let n=0;for(let k=20;k<=110;k+=15)if(!solidPx(mx-Math.sin(a)*k*sd,my+Math.cos(a)*k*sd))n++;else break;if(n>bs){bs=n;best=sd;}}SCENE.side=best;SCENE.room=bs;}
function cutEnd(after){SCENE.phase='out';SCENE.t=0;SCENE.after=after;}
function cutTick(rdt){if(!SCENE.on)return;SCENE.t+=rdt;
  if(SCENE.phase==='in'){SCENE.f=Math.max(0,1-SCENE.t/0.7);if(SCENE.t>0.7)SCENE.phase='talk';}
  else if(SCENE.phase==='talk'&&!DLG.open&&SCENE.t>1.5)cutEnd(null); // the talk was cut short somehow: don't get stuck in the scene
  else if(SCENE.phase==='out'){SCENE.f=Math.min(1,SCENE.t/0.45);if(SCENE.t>=0.45){SCENE.on=false;SCENE.f=0;fadeIn=1;cam.base=player.body;cam.yaw=player.body;cam.dist=60;const f=SCENE.after;SCENE.after=null;if(f)f();return;}}
  // the shot: side-on to the two of you, slowly pushing in
  const b=SCENE.boss,a=Math.atan2(b.y-player.y,b.x-player.x),mx=(player.x+b.x)/2,my=(player.y+b.y)/2,d=hyp(b.x-player.x,b.y-player.y);
  player.a=player.body=a;
  const room=SCENE.room>=6,k=(room?(78+d*0.5):(60+d*0.4))*(1-Math.min(0.14,SCENE.t*0.012)),sd=SCENE.side;
  if(room){cam.x=mx-Math.sin(a)*k*sd-Math.cos(a)*k*0.35;cam.y=my+Math.cos(a)*k*sd-Math.sin(a)*k*0.35;}
  else{cam.x=player.x-Math.cos(a)*k*0.8-Math.sin(a)*14*sd;cam.y=player.y-Math.sin(a)*k*0.8+Math.cos(a)*14*sd;} // over your shoulder
  cam.yaw=Math.atan2(my-cam.y,mx-cam.x);cam.h=26;cam.gz=GH(mx,my)+(player.jz||0);}
function stepNext(){const m=mission;if(!m||m.type!=='story')return;m.si++;m.ring=false;m.tgt=null;m.items=null;
  if(m.si>=m.steps.length){storyPass();return;}
  const s=m.steps[m.si];s.st={};m.desc=s.desc||m.desc;if(s.timer){m.timer=s.timer;m.max=s.timer;}else if(!m.opts.race){m.timer=9999;m.max=9999;}
  const st=s.st;
  switch(s.k){
    case 'talk':say(s.lines,SCENE.on&&SCENE.phase!=='out'?()=>cutEnd(()=>stepNext()):()=>stepNext());break;
    case 'steal':{const p=s.where();const c=makeCar(s.type,p.x,p.y,PI/2,s.col);c.vip=true;st.c=c;m.tgt=c;break;}
    case 'drive':{const p=s.to();st.x=p.x;st.y=p.y;m.ring=true;m.x=p.x;m.y=p.y;m.tgt={x:p.x,y:p.y};if(s.car==='stolen'){const prev=m.steps.slice(0,m.si).reverse().find(q=>q.k==='steal');st.c=prev&&prev.st.c;}break;}
    case 'wreck':{let p=s.at();if(s.far){const a=R()*TAU;p={x:p.x+Math.cos(a)*s.far,y:p.y+Math.sin(a)*s.far};}
      let sp=null;for(let i=0;i<40&&!sp;i++)sp=laneSpotNear(p.x+rr(-60,60)*i,p.y+rr(-60,60)*i);
      if(!sp){storyFail('The target got away');return;}
      const c=makeCar(s.type,sp.x,sp.y,sp.dir*PI/2,s.col);c.driver='ai';c.ai=newAI('lane',sp.dir,sp.k,s.cruise||230);c.vip=true;c.t=Object.assign({},c.t,{hp:s.hp||c.t.hp});c.hp=c.t.hp;c.crim=true;st.c=c;m.tgt=c;break;}
    case 'kill':{if(s.pre){st.list=s.pre;break;}const p=s.around();st.list=[];for(let i=0;i<s.n;i++){const q=walkNear(p.x,p.y,s.spread);const g=makePed(q.x,q.y,false);makeGang(g,s.gang);g.angry=999;g.target=true;g.hp=50;pedPickNext(g);st.list.push(g);}break;}
    case 'collect':{const p=s.around(),items=[];let tries=0;
      while(items.length<s.n&&tries<4000){tries++;const q=walkNear(p.x,p.y,s.spread),tx=Math.floor(q.x/T),ty=Math.floor(q.y/T);if(s.sand&&PARKT[ty*W+tx]!==6)continue;if(farApart(items,q.x,q.y,T*6))items.push({x:q.x,y:q.y,got:false});}
      while(items.length<s.n){const q=walkNear(p.x,p.y,s.spread);items.push({x:q.x,y:q.y,got:false});}
      m.items=items;break;}
    case 'heat':crime(0,s.stars);setTimeout(stepNext,0);break;
    case 'lose':break;
    case 'eltrain':st.spawned=false;st.after=-1;st.start=train.at;break;
    case 'jump':lastJumpAir=0;break;
    case 'boat':{if(player.car&&player.car.t.boat){setTimeout(stepNext,0);break;}let b=null,bd=1e18;for(const c of cars)if(c.t.boat&&!c.wreck&&!c.driver){const d=dist2(c.x,c.y,player.x,player.y);if(d<bd){bd=d;b=c;}}
      if(!b){const d=LM.dockW;b=makeCar('boat',d.x,d.y,PI/2);}st.c=b;b.vip=true;m.tgt=b;m.desc='Get in the speedboat';break;}
  }}
function storyTick(dt){const m=mission;if(DLG.open)return;const s=m.steps[m.si];if(!s)return;const st=s.st,pc=player.car;
  if(m.cd>0){m.cd-=dt;const n=Math.ceil(m.cd);if(n!==m.cdn){m.cdn=n;showBig(n>0?String(n):'GO!','','#ffd600',0.8);sfx(n>0?'ring':'pass',0.5);}if(pc){pc.vx*=0.8;pc.vy*=0.8;}m.clock=0;return;}
  if(m.opts.race)m.clock+=dt;
  switch(s.k){
    case 'steal':if(st.c.wreck||st.c.burn>=0){storyFail('The car was wrecked');return;}if(pc===st.c)stepNext();break;
    case 'drive':{
      if(s.car==='stolen'&&st.c){if(st.c.wreck||cars.indexOf(st.c)<0){storyFail('The car was wrecked');return;}if(s.minHp&&st.c.hp<st.c.t.hp*s.minHp){storyFail('The cargo got damaged');return;}if(pc!==st.c){m.desc='Get back in the '+st.c.t.name;m.tgt=st.c;m.ring=false;return;}m.desc=s.desc;m.tgt={x:st.x,y:st.y};m.ring=true;}
      if(s.car==='any'&&!pc){m.desc='Get a car';}else if(s.car==='boat'&&!(pc&&pc.t.boat)){m.desc='Get back in the boat';}else m.desc=s.desc;
      const o=pc||player,r=s.r||80,sp=pc?hyp(pc.vx,pc.vy):0;
      if(dist2(o.x,o.y,st.x,st.y)<r*r&&(!s.car||pc)&&(s.car!=='boat'||(pc&&pc.t.boat))&&(m.opts.race||sp<160)){if(m.opts.race)sfx('pickup');stepNext();}
      break;}
    case 'wreck':{const c=st.c;if(c.wreck||c.burn>=0||c.hp<=0){c.vip=false;stepNext();return;}
      if(c.driver==='player'){note('Wreck it, don\'t steal it!');}
      if(c.ai&&dist2(c.x,c.y,player.x,player.y)<500*500)c.ai.cruise=Math.max(c.ai.cruise,(s.cruise||230)+60);
      if(dist2(c.x,c.y,player.x,player.y)>3000*3000){storyFail('The target got away');}break;}
    case 'kill':{const left=st.list.filter(p=>!p.gone).length;m.desc=s.desc+' ('+left+' left)';let b=null,bd=1e18;for(const p of st.list)if(!p.gone){const d=dist2(p.x,p.y,player.x,player.y);if(d<bd){bd=d;b=p;}p.angry=999;}m.tgt=b;if(!left)stepNext();break;}
    case 'collect':{for(const it of m.items)if(!it.got&&dist2(it.x,it.y,player.x,player.y)<(pc?36:24)**2){it.got=true;sfx('pickup');}
      const left=m.items.filter(i=>!i.got).length;m.desc=(s.desc||'')+' ('+(s.n-left)+'/'+s.n+')';let b=null,bd=1e18;for(const it of m.items)if(!it.got){const d=dist2(it.x,it.y,player.x,player.y);if(d<bd){bd=d;b=it;}}m.tgt=b;if(!left)stepNext();break;}
    case 'eltrain':{const p=trainCar(0);m.tgt={x:p.x,y:p.y};
      if(train.at>=0&&train.at!==st.start&&train.wait>0&&!st.spawned){const sn=EL_STATIONS[train.at];const g=makePed(sn.bx,sn.by,false);g.col='#d4af37';g.target=true;g.hp=60;g.state='flee';g.panic=60;g.fx=sn.x;g.fy=sn.y;st.spawned=true;
        const nx=m.steps[m.si+1];nx.pre=[g];note('He\'s off the train at '+sn.name+'!');stepNext();}
      if(train.at<0)st.start=-2;break;}
    case 'jump':if(lastJumpAir>=s.air){stepNext();}else if(lastJumpAir>0){note('Only '+lastJumpAir.toFixed(1)+' s. Go faster!');lastJumpAir=0;}m.tgt=null;break;
    case 'lose':if(s.needBoat&&!(pc&&pc.t.boat)){m.desc='Stay on the water and lose the cops';}if(stars()===0&&(!s.needBoat||(pc&&pc.t.boat)))stepNext();break;
    case 'boat':if(pc===st.c||(pc&&pc.t.boat)){st.c.vip=false;stepNext();}break;
  }}
function storyPass(){const m=mission;mission=null;ringT=6;
  if(m.opts.race){raceDone(m);return;}
  if(m.def.stunt){stuntLevel++;const pay=1200+stuntLevel*600;addMoney(pay);sfx('pass');showBig('STUNT TRIAL PASSED','+$'+pay+'  ·  level '+stuntLevel,'#ffc21a',2.4);return;}
  if(m.def.pizza){pizzaLevel++;const pay=300+pizzaLevel*200;addMoney(pay);sfx('pass');showBig('PIZZAS DELIVERED','+$'+pay+'  ·  level '+pizzaLevel,'#ffe25a',2.4);return;}
  if(m.opts&&m.opts.replay){const pay=Math.round(m.def.pay/2);addMoney(pay);sfx('pass');showBig('MISSION PASSED!','Replay  ·  +$'+pay.toLocaleString(),'#3ee07a',3);return;}
  const d=m.def;addMoney(d.pay);sfx('pass');vib([60,40,60]);
  if(d===FINALE){STORY.fin=1;showBig('GRIDLOCK CITY IS YOURS','+$'+d.pay.toLocaleString()+'  ·  story complete','#ffd600',5);}
  else{STORY.prog[m.g]++;addRespect(m.g,1.5);showBig('MISSION PASSED!','+$'+d.pay.toLocaleString(),'#3ee07a',3);
    const next=storyAvail(m.g);note(next?GANGS[m.g].name+': see the boss for the next job':'Every gang trusts you now... maybe too much. Visit Vince.');}
  if(OPT.autosave&&stars()===0)writeSave('auto');}
function storyFail(msg){const m=mission;if(!m)return;if(!(m.def&&m.def.pizza))offerRetry(m);for(const c of m.rivals||[]){c.driver=null;c.vip=false;c.traffic=true;c.race=null;}for(const s of m.steps){if(s.st&&s.st.c&&s.st.c!==player.car)s.st.c.vip=false;if(s.st&&s.st.list)for(const p of s.st.list)p.target=false;}
  mission=null;ringT=8;dlgClose();if(msg!==false){showBig(m.opts.race?'RACE FAILED':'MISSION FAILED!',msg||'','#ff4040',2.6);sfx('fail');}}
// boss peds stand at their hideouts; walk up to one on foot to get the next job
const bossPeds=[null,null,null];
function updateBosses(){for(const b of BOSSES){if(dist2(b.pt.x,b.pt.y,player.x,player.y)>1100*1100)continue;let p=bossPeds[b.g];
    if(!p||p.gone||peds.indexOf(p)<0){p=makePed(b.pt.x,b.pt.y,false);makeGang(p,b.g);p.boss=true;p.target=true;p.hp=9999;bossPeds[b.g]=p;}
    p.x=b.pt.x;p.y=b.pt.y;p.a=Math.atan2(player.y-p.y,player.x-p.x);
    const onMk=dist2(b.mk.x,b.mk.y,player.x,player.y)<24*24,hasJob=!!storyAvail(b.g)&&!mission;
    if(!mission&&!DLG.open&&!player.car&&game.state==='play'&&(hasJob?onMk:dist2(p.x,p.y,player.x,player.y)<44*44)&&!b.cool){
      const ch=storyAvail(b.g);b.cool=true;
      if(!ch){say([[b.name,STORY.fin?'Gridlock City is yours. Enjoy it.':!cityOpen()?'I don\'t know you yet. Go see Vince in Old Town, then we\'ll talk.':'Nothing for you today. Check with the others.']]);}
      else if(stars()>0){say([[b.name,'You\'re bringing heat to my door! Lose the cops first.']]);}
      else{const g=b.g;runMission(ch,{sub:GANGS[g].name,boss:p});mission.g=g;mission.gang=-1;}}
    if(dist2(p.x,p.y,player.x,player.y)>90*90&&dist2(b.mk.x,b.mk.y,player.x,player.y)>60*60)b.cool=false;}}

// ---------- safehouses and garages ----------
const SAFEHOUSES=[];
{const want=[[2,7,2000,'Westside Island'],[12,8,4000,'Uptown'],[10,15,6000,'South Beach']];
 for(const[bx,by,price,name]of want){const l=nearestLot((bx*P+9)*T,(by*P+9)*T);if(!l)continue;if(SAFEHOUSES.some(s=>s.lot===l))continue;
   const sh={name,price,owned:false,lot:l,x:l.x-60,y:l.y,gx:l.x+60,gy:l.y,garage:null,gcar:null};SAFEHOUSES.push(sh);
   SIGNS.push({x:sh.x,y:sh.y,text:'',bg:'#11704a',fg:'#f5f1e2',h:40,on:()=>true,sh});}}
let shCool=0;
function updateSafehouses(dt){shCool-=dt;if(DLG.open||game.state!=='play')return;
  for(const sh of SAFEHOUSES){const d2=dist2(sh.x,sh.y,player.x,player.y);
    // a stored car waits parked in the garage
    if(sh.owned&&sh.garage&&!sh.gcar&&d2<1200*1200){const g=sh.garage,c=makeCar(g.type,sh.gx,sh.gy,PI/2,g.col);c.up=g.up||null;sh.gcar=c;}
    if(sh.gcar&&(sh.gcar.wreck||cars.indexOf(sh.gcar)<0)){if(sh.gcar.wreck)sh.garage=null;sh.gcar=null;}
    if(sh.gcar&&player.car===sh.gcar&&hyp(sh.gcar.x-sh.gx,sh.gcar.y-sh.gy)>90){sh.garage=null;sh.gcar=null;}
    if(shCool>0)continue;
    if(!player.car&&d2<34*34){shCool=3;
      if(!sh.owned){if(money>=sh.price)say([['Realtor','A '+sh.name+' safehouse for $'+sh.price.toLocaleString()+'. Save point, a garage for one car, and you wake up here after a bad day.']],null,[['BUY ($'+sh.price.toLocaleString()+')',()=>{addMoney(-sh.price);sh.owned=true;sfx('pass');showBig('SAFEHOUSE BOUGHT',sh.name,'#3ee07a',2.5);if(OPT.autosave)writeSave('auto');}],['NO THANKS',()=>{},'no']]);
        else note('Safehouse for sale: $'+sh.price.toLocaleString());}
      else if(stars()>0)note('Lose the cops before going inside');
}
    else if(sh.owned&&player.car&&!player.car.t.boat&&player.car!==sh.gcar&&dist2(sh.gx,sh.gy,player.x,player.y)<50*50&&hyp(player.car.vx,player.car.vy)<60){shCool=3;
      if(sh.garage){note('The garage already has a car in it');continue;}
      const c=player.car;sh.garage={type:c.type,col:c.col,up:c.up||null};exitCar(true);c.x=sh.gx;c.y=sh.gy;c.vx=c.vy=0;c.a=PI/2;sh.gcar=c;c.traffic=false;sfx('door');note('Car stored in the garage');}}}
// a hospital and a police station in each part of town (existing buildings take the job; no change to the layout)
const HOSPITALS=[],STATIONS=[];
(function areaServices(){const sideWalk=(b)=>{const cx=b.x+b.w/2;for(let d=0;d<6;d++)for(const yy of[b.y+b.h+16+d*T,b.y-16-d*T]){const tx=Math.floor(cx/T),ty=Math.floor(yy/T);if(walkable(tileAt(tx,ty)))return{x:cx,y:yy};}return null;};
  const pickB=(bx,by)=>{let best=null,ba=0;for(const b of buildings){if(b.outside||b.st==='house'||b.st==='cont'||b.kind)continue;const cbx=Math.floor((b.x+b.w/2)/T/P),cby=Math.floor((b.y+b.h/2)/T/P);if(Math.abs(cbx-bx)>1||Math.abs(cby-by)>1)continue;const a=b.w*b.h;if(a>ba&&b.hg>=1.5){ba=a;best=b;}}return best;};
  HOSPITALS.push(hospitalSpawn);STATIONS.push(policeSpawn);
  for(const[bx,by]of[[13,5],[3,13],[16,16]]){const b=pickB(bx,by);if(!b)continue;const sp=sideWalk(b);if(!sp)continue;b.kind='hospital';HOSPITALS.push(sp);}
  for(const[bx,by]of[[3,5],[11,2],[4,16]]){const b=pickB(bx,by);if(!b)continue;const sp=sideWalk(b);if(!sp)continue;b.kind='police';STATIONS.push(sp);}})();
const nearestOf=list=>{let best=list[0],bd=1e18;for(const q of list){if(!WOK(q.x,q.y))continue;const d=dist2(q.x,q.y,player.x,player.y);if(d<bd){bd=d;best=q;}}return best;};
function wastedSpot(){const hs=nearestOf(HOSPITALS);let best=hs,bd=dist2(hs.x,hs.y,player.x,player.y);for(const sh of SAFEHOUSES)if(sh.owned){const d=dist2(sh.x,sh.y,player.x,player.y);if(d<bd){bd=d;best={x:sh.x,y:sh.y+40};}}return best;}

// ---------- boats ----------
CT.boat={name:'Speedboat',L:46,Wd:18,max:560,acc:380,grip:4.2,turn:2.7,hp:120,mass:0.9,cols:['#f2f2f0','#d8382a','#1f5f9a','#e0b020'],boat:true};
CT.copboat={name:'Police Boat',L:52,Wd:20,max:600,acc:420,grip:4.6,turn:2.7,hp:200,mass:1.2,cols:['#e8e8e8'],boat:true,police:true};
CT.firetruck={name:'Fire Truck',L:76,Wd:28,max:420,acc:300,grip:12,turn:2.3,hp:320,mass:2.6,cols:['#c8201c'],truck:true,fire:true};
const boatOK=(tx,ty)=>{const t=tileAt(tx,ty);if(t===WATER)return true;return tx>=RIVX0&&tx<RIVX1&&bridgeRow(ty);};
const boatSolid=(tx,ty)=>!boatOK(tx,ty);
for(const d of[LM.dockW,{x:RIVX0*T+14,y:(2*P+9)*T},{x:RIVX0*T+14,y:(13*P+9)*T},LM.dockE,LM.dockS,{x:RIVX1*T-14,y:(4*P+9)*T}]){makeCar('boat',d.x,d.y,PI/2);
  SIGNS.push({x:d.x+(d.x<(RIVX0+RIVX1)/2*T?-30:30),y:d.y,text:'BOATS',bg:'#1f5f9a',fg:'#ffffff',h:30,on:()=>true});}
let copBoatT=4;
function copBoatAI(c,dt){const pc=player.car,tg=pc||player,a=Math.atan2(tg.y-c.y,tg.x-c.x);let diff=angDiff(a,c.a);
  const lx=c.x+Math.cos(c.a)*70,ly=c.y+Math.sin(c.a)*70;if(boatSolid(Math.floor(lx/T),Math.floor(ly/T)))diff=diff>=0?1.4:-1.4;
  const d=hyp(tg.x-c.x,tg.y-c.y);driveCar(c,d<70?0.3:1,clamp(diff*2,-1,1),false,dt);
  if(stars()===0||!(pc&&pc.t.boat)){c.driver=null;c.traffic=true;}}
function updateBoats(dt){const pc=player.car;
  for(const c of cars){if(!c.t.boat)continue;
    const sp=hyp(c.vx,c.vy);if(sp>120&&R()<dt*14)puff(c.x-Math.cos(c.a)*c.t.L/2,c.y-Math.sin(c.a)*c.t.L/2,-c.vx*0.1+rr(-20,20),-c.vy*0.1+rr(-20,20),0.45,rr(2,3.2),'#eef6ff','smoke');}
  if(pc&&pc.t.boat&&stars()>0){copBoatT-=dt;let n=0;for(const c of cars)if(c.driver==='copboat')n++;
    if(copBoatT<=0&&n<Math.min(3,stars())){copBoatT=7;for(let i=0;i<20;i++){const a=R()*TAU,d=rr(600,900),x=pc.x+Math.cos(a)*d,y=pc.y+Math.sin(a)*d;
      if(!boatOK(Math.floor(x/T),Math.floor(y/T))||camSees(x,y))continue;const c=makeCar('copboat',x,y,a+PI);c.driver='copboat';c.special=true;break;}}}}
function boatSeesPlayer(tg){for(const c of cars)if(c.driver==='copboat'&&dist2(c.x,c.y,tg.x,tg.y)<(520*sightK())**2)return true;return false;}
function exitBoatSpot(c){let best=null,bd=1e18;for(let j=-6;j<=6;j++)for(let i=-6;i<=6;i++){const tx=Math.floor(c.x/T)+i,ty=Math.floor(c.y/T)+j,tt=tileAt(tx,ty);if(!(walkable(tt)||tt===ROAD)||BRT[ty*W+tx])continue;const x=(tx+.5)*T,y=(ty+.5)*T,d=dist2(x,y,c.x,c.y);if(d<bd){bd=d;best=[x,y];}}return best;}

// ---------- spray shop upgrades ----------
const UPG=[['armor','Armor plating','Takes half damage',1500],['bp','Bulletproof','Bullets bounce off',2000],['nitro','Nitro','Hold SHIFT / NOS for a boost',1000],['paint','Respray colour','A fresh coat of paint',200],['bomb','Car bomb (remote)','Park it, walk away, press B or phone → Detonate',1000]];
// remote car bomb, fitted at a spray shop (GTA III's bomb shop, folded in)
let BOMBCAR=null;
function detonateBomb(){const c=BOMBCAR;if(!c||c.wreck||cars.indexOf(c)<0){BOMBCAR=null;note('No car bomb is set');return;}
  if(player.car===c){note('Get out first!');return;}BOMBCAR=null;sfx('ring',0.4);setTimeout(()=>{if(c.wreck||cars.indexOf(c)<0)return;c.up.bomb=false;damageCar(c,9999,'player');explode(c.x,c.y,'player');explode(c.x+rr(-20,20),c.y+rr(-20,20),'player');},350);}
let shopOpen=null;
function renderShop(){const el=document.getElementById('shop'),c=player.car;if(!c){el.style.display='none';return;}const up=c.up||{};
  el.innerHTML='<h3>UPGRADES · '+c.t.name.toUpperCase()+'</h3>'+UPG.map(([k,n,d,p])=>`<div class="row"><div>${n}<br><small>${d}</small></div><button data-u="${k}" ${(up[k]&&k!=='paint')||money<p?'disabled':''}>${up[k]&&k!=='paint'?'FITTED':'$'+p.toLocaleString()}</button></div>`).join('')+'<p><small>Drive off to leave.</small></p>';
  el.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{const k=b.dataset.u,pr=UPG.find(u=>u[0]===k)[3];if(money<pr)return;addMoney(-pr);c.up=Object.assign({},c.up||{});
    if(k==='paint')c.col=pick(CT.sedan.cols.concat(CT.sports.cols,CT.compact.cols));else c.up[k]=true;if(k==='bomb'){if(BOMBCAR&&BOMBCAR!==c&&BOMBCAR.up)BOMBCAR.up.bomb=false;BOMBCAR=c;note('Bomb fitted. Leave the car and press B (or phone) to set it off');}sfx('spray');for(let i=0;i<14;i++)puff(c.x+rr(-30,30),c.y+rr(-30,30),rr(-20,20),rr(-20,20),rr(.4,.9),rr(6,12),'#e8e8e8','smoke');renderShop();});
  el.style.display='block';}
function updateShop(){const c=player.car;let at=null;if(c&&!c.t.boat&&game.state==='play'&&stars()===0)for(const sp of sprayPads)if(dist2(sp.x,sp.y,c.x,c.y)<70*70&&hyp(c.vx,c.vy)<60)at=sp;
  if(at&&shopOpen!==c){shopOpen=c;if(c.flat){c.flat=false;note('New tires fitted');}renderShop();}else if(!at&&shopOpen){shopOpen=null;document.getElementById('shop').style.display='none';}}
let nitroT=0,nitroFuel=1;
function updateNitro(dt){const c=player.car;nitroFuel=Math.min(1,nitroFuel+dt/9);if(!c||!(c.up&&c.up.nitro))return;
  if((kd.ShiftLeft||kd.ShiftRight||tbtn.nos.on)&&nitroFuel>0){nitroFuel=Math.max(0,nitroFuel-dt/2.2);const ca=Math.cos(c.a),sa=Math.sin(c.a);c.vx+=ca*760*dt;c.vy+=sa*760*dt;
    if(R()<0.7)puff(c.x-ca*c.t.L/2,c.y-sa*c.t.L/2,-ca*90,-sa*90,0.25,rr(3,6),'#6ab8ff','flash');}}

// ---------- horn: tap in a taxi / ambulance / squad car / fire truck to go on or off duty, hold to honk ----------
let duty=false,hornT=-1,hornNode=null,dutyCar=null;
const dutyKind=c=>!c?null:c.t.taxi?'taxi':c.t.ambulance?'amb':c.t.fire?'fire':c.type==='garbage'?'trash':c.type==='foodtruck'?'taco':(c.t.police&&!c.t.army&&!c.t.tank&&!c.t.boat)?'vig':null;
function hornStart(){if(!AC||hornNode)return;try{const g=AC.createGain();g.gain.value=muted?0:0.11;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=1600;
  const o1=AC.createOscillator(),o2=AC.createOscillator();o1.type=o2.type='square';o1.frequency.value=349;o2.frequency.value=440;o1.connect(f);o2.connect(f);f.connect(g);g.connect(AC.destination);o1.start();o2.start();hornNode={g,o1,o2};}catch(_){}}
function hornStop(){if(!hornNode)return;try{const n=hornNode;n.g.gain.setTargetAtTime(0,AC.currentTime,0.02);n.o1.stop(AC.currentTime+0.1);n.o2.stop(AC.currentTime+0.1);}catch(_){}hornNode=null;}
function updateHorn(dt){const c=player.car,on=!!(c&&(kd.KeyH||tbtn.horn.on)&&game.state==='play');
  if(c!==dutyCar){if(duty&&dutyCar)note('Off duty');duty=false;dutyCar=c;if(c&&c.t.tow)note('Tow truck: back up to a car and tap the horn ('+(touchMode?'HORN':'H')+') to hook it. Drop a towed car on the crusher to sell it');if(dutyKind(c))note('Tap the horn ('+(touchMode?'HORN':'H')+') to start '+{taxi:'taxi fares',amb:'ambulance calls',fire:'fire calls',vig:'vigilante missions',trash:'a garbage route',taco:'taco service'}[dutyKind(c)]);}
  if(on){if(hornT<0)hornT=0;hornT+=dt;if(hornT>0.22)hornStart();
    if(hornT>0.22){const ca=Math.cos(c.a),sa=Math.sin(c.a);for(const p of peds){if(p.gone||p.cop||p.state==='flee')continue;const dx=p.x-c.x,dy=p.y-c.y,f=dx*ca+dy*sa;if(f<10||f>160||Math.abs(-dx*sa+dy*ca)>40)continue;const s2=(-dx*sa+dy*ca)>=0?1:-1;p.state='flee';p.panic=1.2;p.fx=p.x-sa*s2*40;p.fy=p.y+ca*s2*40;}
      for(const o of cars){if(o===c||o.driver!=='ai'||!o.ai)continue;const dx=o.x-c.x,dy=o.y-c.y,f=dx*ca+dy*sa;if(f>20&&f<180&&Math.abs(-dx*sa+dy*ca)<40)o.ai.cruise=Math.max(o.ai.cruise,240);}}}
  else if(hornT>=0){if(hornT<=0.22&&c&&c.t.tow)towToggle(c);
    else if(hornT<=0.22&&c&&dutyKind(c)){
      if(mission){note('Finish your mission first');}
      else if(!duty&&stars()>(dutyKind(c)==='vig'?1:0)){note('Lose the cops first');}
      else{duty=!duty;sfx(duty?'pickup':'door',0.6);note(duty?'On duty':'Off duty');if(!duty){if(fare)endFare(null);if(job)endJob(null);fireJob=null;sideJob=null;}}}
    hornT=-1;hornStop();}}

// ---------- fire truck: water cannon and fire calls ----------
let fireJob=null,fireCool=2,fireLevel=0;
function waterCannon(dt){const c=player.car,ca=Math.cos(c.turret!=null?c.turret:c.a),sa=Math.sin(c.turret!=null?c.turret:c.a),nx=c.x+ca*c.t.L/2,ny=c.y+sa*c.t.L/2;
  for(let i=0;i<3;i++)puff(nx,ny,ca*420+c.vx+rr(-40,40),sa*420+c.vy+rr(-40,40),0.45,rr(3,5),'#bfe3ff','smoke');
  for(const p of peds){if(p.gone)continue;const dx=p.x-nx,dy=p.y-ny,f=dx*ca+dy*sa;if(f<0||f>200||Math.abs(-dx*sa+dy*ca)>26)continue;p.x+=ca*120*dt;p.y+=sa*120*dt;if(p.state!=='cop'){p.state='flee';p.panic=2;p.fx=nx;p.fy=ny;}}
  for(const o of cars){if(o===c)continue;const dx=o.x-nx,dy=o.y-ny,f=dx*ca+dy*sa;if(f<0||f>200||Math.abs(-dx*sa+dy*ca)>34)continue;if(o.burn>=0){o.burn=-1;o.hp=Math.max(o.hp,20);if(fireJob)fireJob.out++;}o.vx+=ca*90*dt;o.vy+=sa*90*dt;}
  if(fireJob)for(const f of fireJob.fires){if(f.hp<=0)continue;const dx=f.x-nx,dy=f.y-ny,fw=dx*ca+dy*sa;if(fw<0||fw>210||Math.abs(-dx*sa+dy*ca)>40)continue;f.hp-=55*dt;if(f.hp<=0){sfx('spray',0.5);note('Fire out!');}}}
function updateFire(dt){const c=player.car;if(fireJob){for(const f of fireJob.fires)if(f.hp>0&&R()<dt*30)puff(f.x+rr(-18,18),f.y+rr(-18,18),rr(-10,10),rr(-10,10),rr(.5,.9),rr(7,13),R()<0.6?'#ff7a1a':'#ffd23a','smoke');}
  if(!(c&&c.t.fire&&duty&&!mission&&game.state==='play')){if(fireJob&&!(c&&c.t.fire)){fireJob=null;showBig('FIRE CALL FAILED','You left the truck','#ff4040',2);}return;}
  if(!fireJob){fireCool-=dt;if(fireCool>0)return;fireCool=3;const n=Math.min(5,2+Math.floor(fireLevel/2)),fires=[];let base=null;
    for(let i=0;i<200&&!base;i++){const [tx,ty]=pick(walkTiles),x=(tx+.5)*T,y=(ty+.5)*T,d=hyp(x-c.x,y-c.y);if(d>600&&d<1500&&WOK(x,y))base={x,y,d};}if(!base)return;
    for(let i=0;i<n;i++){const q=walkNear(base.x,base.y,140);fires.push({x:q.x,y:q.y,hp:100});}
    fireJob={fires,out:0,timer:Math.round(base.d/110+30+n*8)};note('Fire call: '+n+' fires reported. Hold FIRE to spray');return;}
  fireJob.timer-=dt;const left=fireJob.fires.filter(f=>f.hp>0).length;
  if(!left){fireLevel++;const pay=200+fireLevel*150;addMoney(pay);sfx('pass');showBig('FIRES OUT','+$'+pay+'  ·  level '+fireLevel,'#ff9a2e',2.2);fireJob=null;fireCool=3;return;}
  if(fireJob.timer<=0){fireJob=null;fireLevel=0;showBig('FIRE CALL FAILED','The building burned down','#ff4040',2);}}

// ---------- street races (time trials over the bridges) ----------
const RACES=[
  {name:'Gridlock Sprint',start:ixPt(4,BIGB),route:[[6,BIGB],[8,BIGB],[10,BIGB],[10,TSQ.iy],[TSQ.ix,TSQ.iy]],gold:38},
  {name:'River Loop',start:ixPt(6,1),route:[[6,3],[8,3],[8,9],[8,15],[6,15],[6,9],[6,3]],gold:62},
  {name:'Beach Dash',start:ixPt(12,15),route:[[14,15],[14,17],[10,17],[8,17],[8,15],[6,15],[4,15],[4,17]],gold:48},
];
const BEST={};
for(const r of RACES)SIGNS.push({x:r.start.x,y:r.start.y-70,text:'RACE: '+r.name.toUpperCase(),bg:'#151515',fg:'#ffd600',h:40,on:()=>true});
let raceCool=0;
function updateRaces(dt){raceCool-=dt;const c=player.car;if(mission||DLG.open||!c||c.t.boat||raceCool>0||stars()>0||game.state!=='play')return;
  for(const r of RACES){if(dist2(r.start.x,r.start.y,c.x,c.y)>70*70||hyp(c.vx,c.vy)>80)continue;raceCool=6;
    if(!cityOpen()&&r.route.some(q=>!WOK(ixPt(q[0],q[1]).x,0))){note('This race crosses the river. It opens when the bridges do');return;}
    say([['Race',r.name+': '+r.route.length+' checkpoints. Gold time '+r.gold+' s.'+(BEST[r.name]?' Your best: '+BEST[r.name].toFixed(1)+' s.':'')]],null,[['RACE',()=>startRace(r)],['NOT NOW',()=>{},'no']]);return;}}
function startRace(r){const steps=r.route.map((q,i)=>({k:'drive',to:()=>ixPt(q[0],q[1]),car:'any',r:110,desc:'Checkpoint '+(i+1)+' / '+r.route.length}));
  steps[0].timer=Math.round(r.gold*1.8)+3;runMission({title:r.name,steps},{race:r,sub:'Get ready'});mission.cd=3.2;mission.rivals=[];
  const pc=player.car,ca=Math.cos(pc.a),sa=Math.sin(pc.a);
  [[-1,-70],[1,-70],[1,0]].forEach(([side,back],i)=>{const x=pc.x+ca*back-sa*side*34,y=pc.y+sa*back+ca*side*34;if(solidPx(x,y))return;
    const c=makeCar(pick(['sports','sports','sedan']),x,y,pc.a,pick(['#e0402a','#2a7ae0','#20a060','#f0c020']));c.driver='race';c.vip=true;c.race={wp:0,done:false,skill:rr(0.86,0.98)};mission.rivals.push(c);});}
function raceDone(m){const r=m.opts.race,t=m.clock;const place=(m.finished||0)+1;for(const c of m.rivals||[]){c.driver=null;c.vip=false;c.traffic=true;c.race=null;}const medal=t<=r.gold?'GOLD':t<=r.gold*1.25?'SILVER':'BRONZE',pay=(medal==='GOLD'?3000:medal==='SILVER'?1500:600)+(place===1?2000:place===2?600:0);if(place===1)STATS.raceWins++;if(medal==='GOLD')GOLDS[r.name]=1;
  const best=!BEST[r.name]||t<BEST[r.name];if(best)BEST[r.name]=t;addMoney(pay);sfx('pass');vib([50,30,50]);
  showBig(['1ST','2ND','3RD','4TH'][place-1]+' PLACE · '+medal,t.toFixed(1)+' s  '+(best?'New best!  ':'')+'+$'+pay.toLocaleString(),medal==='GOLD'?'#ffd600':medal==='SILVER'?'#d0d4dc':'#d08a4a',3.2);}

// ---------- smarter wanted level: cops see less at night, in the rain, and when you hide ----------
let hiding=false;
function sightK(){const tg=player.car||player,sp=player.car?hyp(player.car.vx,player.car.vy):hyp(player.vx,player.vy),tx=Math.floor(tg.x/T),ty=Math.floor(tg.y/T),t=tileAt(tx,ty);
  hiding=sp<30&&(t===LOT||(t===GRASS&&PARKT[ty*W+tx]===1)||(tx>=RIVX0&&tx<RIVX1&&!bridgeRow(ty)&&player.car&&player.car.t.boat&&(bridgeRow(ty-2)||bridgeRow(ty+2))));
  const own=typeof TURF!=='undefined'&&TURF[blockOf(tg.x,tg.y)];
  return clamp(1-0.35*clamp(darkness/0.8,0,1)-0.25*rain,0.45,1)*(hiding?0.5:1)*(own?0.6:1);}

// ---------- street life: buskers in Times Square, joggers in the park, crowds at the beach ----------
let lifeT=0;
function updateLife(dt){lifeT-=dt;if(lifeT>0)return;lifeT=1.2;
  if(dist2(LM.tsq.x,LM.tsq.y,player.x,player.y)<900*900&&peds.filter(p=>p.busker&&!p.gone).length<3){const q=walkNear(LM.tsq.x,LM.tsq.y,180);if(walkable(tileAt(Math.floor(q.x/T),Math.floor(q.y/T)))){const p=makePed(q.x,q.y,false);p.busker=true;p.col=pick(['#d83a8a','#3ad6ff','#ffd23a']);}}
  const day=darkness<0.25&&rain<0.1;
  if(day&&dist2(LM.beach.x,LM.beach.y,player.x,player.y)<1400*1400&&peds.filter(p=>p.beach&&!p.gone).length<14){for(let i=0;i<20;i++){const q=walkNear(player.x,player.y,700),tx=Math.floor(q.x/T),ty=Math.floor(q.y/T);if(PARKT[ty*W+tx]!==6||map[ty*W+tx]!==GRASS||camSees(q.x,q.y))continue;const p=makePed(q.x,q.y,false);p.beach=true;p.sun=R()<0.5;p.col=pick(['#e0402a','#2a7ae0','#f0c020','#ffffff','#e070a0']);pedPickNext(p);break;}}
  if(!day)for(const p of peds)if(p.beach&&!camSees(p.x,p.y))p.gone=true;}
function lifePed(p,dt){if(personTick(p,dt))return true;if(p.busker){p.vx=p.vy=0;p.moving=true;p.anim+=dt*6;if(R()<dt*1.5)puff(p.x,p.y,rr(-8,8),rr(-8,8),1.2,3,pick(['#ffd23a','#ff4fa8','#3ad6ff']),'smoke');return true;}
  if(p.sun&&p.state==='walk'){p.vx=p.vy=0;p.moving=false;return true;}return false;}
function crossOK(p,tx,ty,cd){const mx=tx%P,my=ty%P;
  if(!((mx===4||mx===13)&&(my===4||my===13)))return R()<0.12; // mid-block: the odd jaywalker
  // at a corner: wait until cars on the road being crossed have a red light
  const ew=cd===1||cd===3,ix=Math.floor(tx/P)+(mx===13?1:0),iy=Math.floor(ty/P)+(my===13?1:0);
  if(tlState(ix,iy,ew)===2){p.waitS=0;return true;}
  if(!p.waitS)p.waitS=game.t;if(game.t-p.waitS<14)return 'wait';p.waitS=0;return false;}

// ---------- big map (tap the minimap, or press TAB) ----------
let BIGMAP=false;
window.addEventListener('keydown',e=>{if(e.code==='Tab'&&game.started){BIGMAP=!BIGMAP;e.preventDefault();}});
function drawBigMap(sc){const s=Math.min(VW,VH)*0.92,ox=(VW-s)/2,oy=(VH-s)/2,k=s/WPX,k_=k;
  ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(0,0,VW,VH);ctx.imageSmoothingEnabled=false;ctx.drawImage(mmc,ox,oy,s,s);ctx.imageSmoothingEnabled=true;
  const P2=(x,y)=>[ox+x*k,oy+y*k],icon=(x,y,col,t)=>{const[a,b]=P2(x,y);ctx.fillStyle=col;ctx.fillRect(a-6,b-6,12,12);ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.strokeRect(a-6,b-6,12,12);ctx.fillStyle='#000';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t,a,b+.5);};
  for(const k in TURF){const bi=+k,[a,b2]=P2((bi%NB)*P*T+4*T,Math.floor(bi/NB)*P*T+4*T);ctx.fillStyle='rgba(192,124,255,.45)';ctx.fillRect(a,b2,10*T*k_,10*T*k_);}
  for(const b of BOSSES){const[a,bb2]=P2(b.pt.x,b.pt.y);bossBlip(ctx,a,bb2,b,22);}
  for(const sh of SAFEHOUSES)icon(sh.x,sh.y,sh.owned?'#3ee07a':'#8a8a8a','H');
  for(const r of RACES)icon(r.start.x,r.start.y,'#ffd600','R');
  for(const sp of sprayPads)icon(sp.x,sp.y,'#3ee07a','$');
  for(const hs of HOSPITALS)icon(hs.x,hs.y,'#ffffff','+');
  for(const c of cars)if(c.t.boat&&!c.driver)icon(c.x,c.y,'#6ab8ff','~');
  icon(SHOWROOM.x,SHOWROOM.y,'#ff6060','A');icon(STUNT.x,STUNT.y,'#ffc21a','S');icon(BANK.x,BANK.y,'#1f3f6f','$');for(const s2 of STORES)icon(s2.x,s2.y,'#d8382a','7');for(const h of HELIPADS)icon(h.x,h.y,'#c9a23a','^');icon(CLUB.x,CLUB.y,'#ff4fa8','♪');for(const g of GUNSHOPS)icon(g.x,g.y,'#ff4040','W');icon(EXPORT.x,EXPORT.y,'#6ab8ff','E');icon(PIZZA.x,PIZZA.y,'#ffe25a','P');
  bigMapExtras(P2,icon,k_);
  const tg=objectiveTarget();if(tg){const gp=gpsRoute(tg);if(gp){ctx.beginPath();const[p0,p1]=P2((player.car||player).x,(player.car||player).y);ctx.moveTo(p0,p1);for(const q of gp){const[x,y]=P2(q.x,q.y);ctx.lineTo(x,y);}ctx.strokeStyle='#ffd600';ctx.lineWidth=3;ctx.stroke();}}
  if(tg){const[a,b]=P2(tg.x,tg.y);ctx.fillStyle='#ffd600';ctx.beginPath();ctx.arc(a,b,6+Math.sin(game.t*6)*2,0,TAU);ctx.fill();ctx.stroke();}
  {const o=player.car||player,[a,b]=P2(o.x,o.y);ctx.save();ctx.translate(a,b);ctx.rotate(o.a);ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,-6);ctx.lineTo(-2,0);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  hudText(touchMode?'tap to close':'TAB to close',VW/2,oy+s-14,Math.round(13*sc),'#fff','center',`600 ${Math.round(13*sc)}px system-ui`);
  hudText('! job  H safehouse  R race  $ spray  ~ boat  W guns  A cars  E export  P pizza',VW/2,oy+16,Math.round(12*sc),'#ddd','center',`600 ${Math.round(12*sc)}px system-ui`);}

// ---------- mobile: dynamic resolution, background pause, keep the screen awake ----------
let frameAvg=16,dynT=0,DYN=1;
function mobileTick(dt){if(!touchMode)return;frameAvg=lerp(frameAvg,dt*1000,0.05);dynT+=dt;
  if(dynT>3){dynT=0;const old=DYN;if(frameAvg>30&&DYN>0.7)DYN-=0.1;else if(frameAvg<19&&DYN<1)DYN+=0.1;DYN=Math.round(DYN*10)/10;if(DYN!==old)resizeLow();}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.started&&game.state==='play'){if(!game.paused)togglePause();if(OPT.autosave&&stars()===0)writeSave('auto');hornStop();}});
let wakeLock=null;async function keepAwake(){try{if(navigator.wakeLock&&!wakeLock){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null;});}}catch(_){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&game.started)keepAwake();});

// ---------- per-frame hook ----------
function extTick(dt){extTick5(dt);transitTick(dt);extTick2(dt);extTick3(dt);extTick4(dt);updateBosses();updateSafehouses(dt);updateBoats(dt);updateShop();updateNitro(dt);updateHorn(dt);updateFire(dt);updateRaces(dt);updateLife(dt);mobileTick(dt);}
function extSave(){return{gym:GYM,gold:GOLDGOT,tags:{seed:SAVE_SEED,d:TAGS.map(t=>t.done?1:0)},runs:RUNBEST,secret:secretFound,crewup:CREWUP,roof:{seed:SAVE_SEED,got:STASH.map(k=>k.got?1:0)},trash:trashLevel,taco:tacoLevel,story:STORY,sh:SAFEHOUSES.map(s=>({o:s.owned,g:s.garage})),best:BEST,fire:fireLevel,stats:STATS,golds:GOLDS,exp:EXPORTED,pizza:pizzaLevel,armor:player.armor,turf:TURF,stunt:stuntLevel};}
function extLoad(e){if(!e)return;GYM=e.gym||0;for(const k in GOLDGOT)delete GOLDGOT[k];Object.assign(GOLDGOT,e.gold||{});applyGold();for(const t of TAGS)t.done=false;if(e.tags&&e.tags.seed===SAVE_SEED)(e.tags.d||[]).forEach((d,i)=>{if(TAGS[i])TAGS[i].done=!!d;});for(const k in RUNBEST)delete RUNBEST[k];Object.assign(RUNBEST,e.runs||{});secretFound=!!e.secret;Object.assign(CREWUP,{guns:0,armor:0,slot:0,guard:0},e.crewup||{});for(const k of STASH)k.got=false;if(e.roof&&e.roof.seed===SAVE_SEED)(e.roof.got||[]).forEach((g,i)=>{if(STASH[i])STASH[i].got=!!g;});trashLevel=e.trash||0;tacoLevel=e.taco||0;if(e.story){STORY.prog=e.story.prog||[0,0,0];STORY.fin=e.story.fin||0;}(e.sh||[]).forEach((q,i)=>{const s=SAFEHOUSES[i];if(s){s.owned=!!q.o;s.garage=q.g||null;if(s.gcar){const k=cars.indexOf(s.gcar);if(k>=0&&s.gcar!==player.car)cars.splice(k,1);s.gcar=null;}}});
  for(const k in BEST)delete BEST[k];Object.assign(BEST,e.best||{});fireLevel=e.fire||0;Object.assign(STATS,e.stats||{});for(const k in GOLDS)delete GOLDS[k];Object.assign(GOLDS,e.golds||{});for(const k in EXPORTED)delete EXPORTED[k];Object.assign(EXPORTED,e.exp||{});pizzaLevel=e.pizza||0;player.armor=e.armor||0;for(const k in TURF)delete TURF[k];Object.assign(TURF,e.turf||{});stuntLevel=e.stunt||0;}

// ---------- traffic on the diagonal avenues ----------
function aiDiag(c,dt){const ai=c.ai,d=DIAGS[ai.di],[t,sd]=diagRel(d,c.x,c.y),dir=ai.dir,ux=d.ux*dir,uy=d.uy*dir,lx=-uy,ly=ux;
  if((dir>0&&t>d.L-70)||(dir<0&&t<70)||Math.abs(sd)>110){acquireLane(c);return;}
  const spd=hyp(c.vx,c.vy),look=50+spd*0.35,ta=t+dir*look,gx=d.ax+d.ux*ta+lx*26,gy=d.ay+d.uy*ta+ly*26;
  const diff=angDiff(Math.atan2(gy-c.y,gx-c.x),c.a);let steer=clamp(diff*2.2,-1,1),target=ai.cruise;if(Math.abs(diff)>0.5)target=Math.min(target,100);
  const fx=Math.cos(c.a),fy=Math.sin(c.a),D=c.t.L/2+22+spd*0.45,hw=c.t.Wd/2;let blocked=false;
  for(const o of cars){if(o===c)continue;const rx=o.x-c.x,ry=o.y-c.y;if(rx*rx+ry*ry>(D+80)**2)continue;const f=rx*fx+ry*fy;if(f<=0)continue;if(f<D+o.t.L/2&&Math.abs(-rx*fy+ry*fx)<hw+o.t.Wd/2+2){blocked=true;break;}}
  if(!blocked)for(const p of peds){if(p.gone)continue;const rx=p.x-c.x,ry=p.y-c.y;if(rx*rx+ry*ry>(D+20)**2)continue;const f=rx*fx+ry*fy;if(f>0&&f<D&&Math.abs(-rx*fy+ry*fx)<hw+9){blocked=true;break;}}
  if(!blocked&&!player.car){const rx=player.x-c.x,ry=player.y-c.y,f=rx*fx+ry*fy;if(f>0&&f<D&&Math.abs(-rx*fy+ry*fx)<hw+10)blocked=true;}
  if(blocked){ai.blockT+=dt;if(ai.blockT<3.5)target=0;if(ai.blockT>5.5)ai.blockT=0;}else ai.blockT=Math.max(0,ai.blockT-dt*2);
  const vf=c.vx*fx+c.vy*fy;let thr=vf<target-10?1:vf>target+15?-1:0.15;if(target===0)thr=vf>5?-1:0;
  if(target>0&&spd<12){ai.stuckT+=dt;if(ai.stuckT>2){ai.revT=1;ai.stuckT=0}}else ai.stuckT=0;if(ai.revT>0){ai.revT-=dt;thr=-1;steer=-steer;}
  driveCar(c,thr,steer,false,dt);}

// ---------- stats, completion, a phone for getaway cars, and a car showroom ----------
const STATS={kills:0,cops:0,stolen:0,jumps:0,bestAir:0,dist:0,raceWins:0,wasted:0,busted:0};const GOLDS={};let lastJumpAir=0;
function completion(){const sm=CHAPTERS.reduce((a,c)=>a+c.length,0)+1,sd=STORY.prog.reduce((a,b)=>a+b,0)+STORY.fin;
  const parts=[[sd/sm,40],[PACKAGES.filter(k=>k.got).length/PACKAGES.length,15],[Object.keys(GOLDS).length/RACES.length,15],[SAFEHOUSES.filter(s=>s.owned).length/SAFEHOUSES.length,5],[Math.min(1,jobLevel/10),5],[Math.min(1,fireLevel/10),5],[Object.keys(EXPORTED).length/EXPORTS.length,5],[Math.min(1,pizzaLevel/5),5],[Math.min(1,Object.keys(TURF).length/6),5],[Math.min(1,stuntLevel/3),5]];
  return Math.round(parts.reduce((a,[v,w])=>a+clamp(v,0,1)*w,0));}
function statsHTML(){const km=(STATS.dist/32*4/1000).toFixed(1);return`<h2>STATS · ${completion()}% COMPLETE</h2><div class="ctl">
<b>Story</b><span>${STORY.prog.reduce((a,b)=>a+b,0)+STORY.fin} / ${CHAPTERS.reduce((a,c)=>a+c.length,0)+1} missions</span>
<b>Hidden packages</b><span>${PACKAGES.filter(k=>k.got).length} / ${PACKAGES.length}</span>
<b>Rooftop stashes</b><span>${STASH.filter(k=>k.got).length} / ${STASH.length}</span><b>Gang tags</b><span>${TAGS.filter(t=>t.done).length} / ${TAGS.length}</span><b>Golden guns</b><span>${Object.keys(GOLDGOT).length} / 3</span><b>Secret car</b><span>${secretFound?'Found':'?'}</span><b>Rooftop runs</b><span>${Object.keys(RUNBEST).length} / ${RUNS.length}</span><b>Max health</b><span>${PMAX()}</span><b>Side jobs</b><span>Garbage ${trashLevel} · Taco ${tacoLevel}</span>
<b>Race golds</b><span>${Object.keys(GOLDS).length} / ${RACES.length} · ${STATS.raceWins} wins</span>
<b>Safehouses</b><span>${SAFEHOUSES.filter(s=>s.owned).length} / ${SAFEHOUSES.length}</span>
<b>Job levels</b><span>Duty ${jobLevel} · Fire ${fireLevel}</span>
<b>Export list</b><span>${Object.keys(EXPORTED).length} / ${EXPORTS.length}</span><b>Pizza level</b><span>${pizzaLevel}</span>
<b>Turf blocks</b><span>${Object.keys(TURF).length}</span><b>Stunt trial level</b><span>${stuntLevel}</span>
<b>Stunt jumps</b><span>${STATS.jumps} · best ${STATS.bestAir.toFixed(1)} s</span>
<b>Cars stolen</b><span>${STATS.stolen}</span><b>People taken out</b><span>${STATS.kills} (${STATS.cops} cops)</span>
<b>Distance driven</b><span>${km} km</span><b>Wasted / busted</b><span>${STATS.wasted} / ${STATS.busted}</span></div>`;}
// phone: G (or PHONE) orders a car to be dropped off nearby
const ORDERS=[['Start a gang war',0,'war'],['Crew upgrades',0,'crewup'],['Crew backup',250,'crew'],['Getaway car',300,'sports'],['Taxi',150,'taxi'],['Pickup truck',250,'pickup'],['Fire truck',600,'firetruck']];
let delivery=null;
function phoneMenu(){if(DLG.open||game.state!=='play'||mission&&mission.opts&&mission.opts.race)return;
  say([['Phone','Who are you calling?']],null,(BOMBCAR&&!BOMBCAR.wreck&&player.car!==BOMBCAR?[['DETONATE CAR BOMB',detonateBomb]]:[]).concat(ORDERS.map(([n,p,t])=>[n.toUpperCase()+(p?' $'+p:''),()=>orderCar(n,p,t)])).concat([['HANG UP',()=>{},'no']]));}
function orderCar(n,p,t){if(money<p){note('Not enough cash');return;}if(t==='crew'){if(callBackup())addMoney(-p);return;}if(t==='war'){startGangWar();return;}if(t==='crewup'){setTimeout(crewUpgrades,50);return;}let s=null;for(let i=0;i<60&&!s;i++){const a=R()*TAU,d=rr(160,320);s=laneSpotNear(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d);}
  if(!s){note('Nobody can reach you here');return;}addMoney(-p);const c=makeCar(t,s.x,s.y,s.dir*PI/2);c.special=false;delivery={c,t:40};sfx('ring',0.5);note(n+' on its way. Look for the marker');}
let lastKeyT=0;window.addEventListener('keydown',e=>{const now=performance.now();if(e.key.length===1)lastKeyT=now;
  if(e.code==='KeyG'&&game.started&&!game.paused&&!e.repeat){const t0=now;setTimeout(()=>{if(lastKeyT===t0)phoneMenu();},400);}},true);
// showroom
const SHOWROOM=(()=>{const l=nearestLot((15*P+9)*T,(11*P+9)*T)||lotBlocks[0];return{x:l.x,y:l.y-50,px:l.x,py:l.y+40};})();
SIGNS.push({x:SHOWROOM.x,y:SHOWROOM.y,text:'AUTO SHOWROOM',bg:'#7a1a1a',fg:'#ffffff',h:44,on:()=>true});
const STOCK=[['Viper',9000,'sports'],['Cruiser',3500,'sedan'],['Hauler',4500,'truck'],['Ambulance',6000,'ambulance'],['Bruiser muscle car',6500,'muscle'],['Breeze roadster',11000,'roadster'],['Ridgeback SUV',5000,'suv'],['Army surplus tank',75000,'tank']];
let showCool=0;
function updateShowroom(dt){showCool-=dt;if(showCool>0||player.car||DLG.open||game.state!=='play')return;if(dist2(SHOWROOM.x,SHOWROOM.y,player.x,player.y)>36*36)return;showCool=4;
  say([['Salesman','Welcome to Gridlock Motors! Everything on the lot, cash only, no questions.']],null,STOCK.map(([n,p,t])=>[n.toUpperCase()+' $'+p.toLocaleString(),()=>{if(money<p){note('Come back with more cash');return;}addMoney(-p);const c=makeCar(t,SHOWROOM.px,SHOWROOM.py,0);c.special=false;sfx('pass');showBig('NEW WHEELS',n,'#3ee07a',2);}]).concat([['JUST LOOKING',()=>{},'no']]));}
function extTick2(dt){updateShowroom(dt);if(player.car){STATS.dist+=hyp(player.car.vx,player.car.vy)*dt;}
  if(delivery){delivery.t-=dt;if(delivery.t<=0||player.car===delivery.c||cars.indexOf(delivery.c)<0)delivery=null;}}

// ---------- Ammu-Nation, body armor, export docks, pizza runs ----------
player.armor=0;
const BATIDX=()=>WEAPONS.findIndex(w=>w.kind==='x');
const GUNSHOPS=[[3,9],[14,12]].map(([bx,by])=>{const l=nearestLot((bx*P+9)*T,(by*P+9)*T)||lotBlocks[0];const s={x:l.x+50,y:l.y-50};SIGNS.push({x:s.x,y:s.y,text:'AMMU-NATION',bg:'#2a2a2a',fg:'#ff4040',h:42,on:()=>true});return s;});
const GUNSTOCK=[['Baseball bat',100,'bat',Infinity],['SMG + 200',800,1,200],['Shotgun + 40',1200,2,40],['Flamethrower + 300',1500,3,300],['Molotovs + 10',600,4,10],['Rockets + 8',3000,5,8],['Grenades + 8',900,'gren',8],['Assault rifle + 120',2500,'rifle',120],['Sniper rifle + 20',3500,'sniper',20],['Body armor',500,-1,100]];
let gunCool=0;
function updateGunShops(dt){}
function gunMenu(){
    const dk=gunDiscount();say([['Ammu-Nation',dk<1?'Friends of the neighborhood get 20% off. Pick something.':'Protect yourself. Pick something.']],null,GUNSTOCK.map(([n,p0,w,a])=>{const p=Math.round(p0*dk);return[n.toUpperCase()+' $'+p.toLocaleString(),()=>{if(money<p){note('Not enough cash');return;}addMoney(-p);sfx('pickup');
      if(w==='bat')w=BATIDX();if(w==='gren')w=GRENIDX();if(w==='rifle')w=WIDX('Assault Rifle');if(w==='sniper')w=WIDX('Sniper Rifle');if(w<0){player.armor=100;note('Body armor on');}else{player.ammo[w]=(player.ammo[w]||0)+a;player.w=w;note(WEAPONS[w].name+' ready');}}];}).concat([['LEAVE',()=>{},'no']]));}
// a crane by the river buys particular cars, once each
const EXPORTS=[['compact',600],['sedan',700],['taxi',900],['sports',2000],['truck',1200],['ambulance',1800],['police',2500],['firetruck',2200],['swat',3500],['muscle',2400],['roadster',2800],['garbage',1600],['tank',10000]];
const EXPORTED={};
const EXPORT=(()=>{const l=nearestLot((9*P+9)*T,(16*P+9)*T)||lotBlocks[0];const s={x:l.x,y:l.y};SIGNS.push({x:s.x,y:s.y-60,text:'EXPORT DOCKS',bg:'#1d4a6a',fg:'#ffffff',h:44,on:()=>true});props.push({x:s.x+60,y:s.y-30,k:'crane',a:0.6});return s;})();
let expCool=0;
function updateExport(dt){expCool-=dt;const c=player.car;if(expCool>0||!c||c.t.boat||game.state!=='play'||dist2(EXPORT.x,EXPORT.y,c.x,c.y)>80*80||hyp(c.vx,c.vy)>50)return;expCool=4;
  const e=EXPORTS.find(q=>q[0]===c.type);const left=EXPORTS.filter(q=>!EXPORTED[q[0]]).map(q=>CT[q[0]].name).join(', ');
  if(!e||EXPORTED[c.type]){note(EXPORTED[c.type]?'Already shipped one of those. Still wanted: '+(left||'nothing!'):'Not on the list. Wanted: '+left);return;}
  if(stars()>0){note('Lose the cops before the docks will take it');return;}
  EXPORTED[c.type]=1;const pay=Math.round(e[1]*(0.5+0.5*clamp(c.hp/c.t.hp,0,1)));exitCar(true);cars.splice(cars.indexOf(c),1);addMoney(pay);sfx('pass');
  const n=Object.keys(EXPORTED).length;showBig('EXPORTED',CT[e[0]].name+'  +$'+pay.toLocaleString()+'  ·  '+n+'/'+EXPORTS.length,'#6ab8ff',2.6);if(n===EXPORTS.length){addMoney(20000);note('Export list complete! +$20,000');}}
// pizza runs: three deliveries against the clock, from any car
const PIZZA=(()=>{const l=nearestLot((11*P+9)*T,(8*P+9)*T)||lotBlocks[0];const s={x:l.x-50,y:l.y+50};SIGNS.push({x:s.x,y:s.y,text:'PIZZA',bg:'#d8382a',fg:'#ffe25a',h:36,on:()=>true});return s;})();
let pizzaCool=0,pizzaLevel=0;
function resSpot(nearX,nearY){const c=walkTiles.filter(([tx,ty])=>{const k=BLOCKK[Math.floor(ty/P)*NB+Math.floor(tx/P)];const d=hyp((tx+.5)*T-nearX,(ty+.5)*T-nearY);return k==='res'&&d>700&&d<1800;});const q=c.length?pick(c):pick(walkTiles);return{x:(q[0]+.5)*T,y:(q[1]+.5)*T};}
function updatePizza(dt){pizzaCool-=dt;const c=player.car;if(pizzaCool>0||!c||mission||DLG.open||game.state!=='play'||dist2(PIZZA.x,PIZZA.y,c.x,c.y)>70*70||hyp(c.vx,c.vy)>60)return;pizzaCool=6;
  say([['Pizza Paolo','Three hot pies, three angry customers. Level '+(pizzaLevel+1)+'.']],null,[['DELIVER',()=>{let px=PIZZA.x,py=PIZZA.y;const steps=[0,1,2].map(i=>({k:'drive',car:'any',r:70,timer:Math.max(35,60-pizzaLevel*3),desc:'Deliver pizza '+(i+1)+' of 3',to:()=>{const s=resSpot(player.x,player.y);return s;}}));
    runMission({title:'Pizza Run',steps,pizza:true},{sub:'Level '+(pizzaLevel+1)});}],['NOT NOW',()=>{},'no']]);}
function extTick3(dt){updateGunShops(dt);updateExport(dt);updatePizza(dt);}

// ---------- a livelier street: people chat, phone, use umbrellas, take their cars; things happen around you ----------
let streetT=20,peopleT=0;const EVENTS=[];
function updatePeople(dt){peopleT-=dt;if(peopleT>0)return;peopleT=0.5;
  for(const p of peds){if(p.gone||p.cop||p.gang!=null||p.target||p.busker||p.beach||p.state!=='walk')continue;
    if(p.umb==null)p.umb=R()<0.6;
    if(p.chat>0||p.onPhone>0)continue;
    const r=R();
    if(r<0.012){p.onPhone=rr(4,9);}                                  // stop and take a call
    else if(r<0.03){for(const q of peds){if(q===p||q.gone||q.cop||q.gang!=null||q.state!=='walk'||q.chat>0||dist2(p.x,p.y,q.x,q.y)>40*40)continue;const t2=rr(4,9);p.chat=q.chat=t2;p.chatW=q;q.chatW=p;break;}}
    else if(r<0.04){// walk up to a parked car, get in and drive off
      for(const c of cars){if(c.driver||c.wreck||c.burn>=0||c.vip||c.t.boat||c===player.car||c.t.police||c.t.tank||dist2(c.x,c.y,p.x,p.y)>70*70)continue;
        const tx=Math.floor(c.x/T),ty=Math.floor(c.y/T);if(map[ty*W+tx]!==ROAD&&map[ty*W+tx]!==LOT)continue;p.goCar=c;p.tx=c.x;p.ty=c.y;break;}}}}
function personTick(p,dt){if(p.q&&queueTick(p,dt))return true;if(p.chat>0){p.chat-=dt;p.vx=p.vy=0;p.moving=false;const q=p.chatW;if(q&&!q.gone)p.a=Math.atan2(q.y-p.y,q.x-p.x);if(R()<dt*0.6)p.anim+=1;return true;}
  if(p.onPhone>0){p.onPhone-=dt;p.vx=p.vy=0;p.moving=false;return true;}
  if(p.goCar){const c=p.goCar;if(c.driver||c.wreck||cars.indexOf(c)<0){p.goCar=null;return false;}
    if(dist2(c.x,c.y,p.x,p.y)<(c.t.Wd/2+12)**2){p.gone=true;c.driver='ai';c.traffic=true;acquireLane(c);c.ai.cruise=rr(130,190);sfx('door',0.3);return true;}
    const a=Math.atan2(c.y-p.y,c.x-p.x);p.vx=Math.cos(a)*50;p.vy=Math.sin(a)*50;p.a=a;p.moving=true;p.anim+=dt*9;p.x+=p.vx*dt;p.y+=p.vy*dt;return true;}
  return false;}
// street events near you when you're not wanted: a police pursuit, a mugging, a gang scuffle, a breakdown
function streetEvents(dt){streetT-=dt;for(let i=EVENTS.length-1;i>=0;i--){const e=EVENTS[i];e.t-=dt;if(e.tick)e.tick(e,dt);if(e.t<=0){if(e.end)e.end(e);EVENTS.splice(i,1);}}
  if(streetT>0||stars()>0||mission||game.state!=='play'||EVENTS.length)return;streetT=rr(30,55);
  const k=pick(['pursuit','pursuit','mugging','scuffle','breakdown']);
  if(k==='pursuit'){const crim=spawnTraffic('sports',false);if(!crim)return;crim.driver='ai';crim.ai.cruise=330;crim.crim=true;crim.vip=true;crim.col='#d0d0d0';
    const cops=[];for(let i=0;i<2;i++){let s=null;for(let j=0;j<20&&!s;j++)s=laneSpotNear(crim.x-Math.cos(crim.a)*(160+i*120)+rr(-60,60),crim.y-Math.sin(crim.a)*(160+i*120)+rr(-60,60));
      if(!s)continue;const c=makeCar('police',s.x,s.y,s.dir*PI/2);c.driver='cop';c.traffic=true;c.ai=newAI('lane',s.dir,s.k,340);c.ai.follow=crim;c.ai.pursuit=true;c.vip=true;cops.push(c);}
    note('Police pursuit nearby');EVENTS.push({k,t:50,crim,cops,tick(e){for(const c of e.cops){if(!c.ai)continue;c.ai.follow=e.crim;if(!e.caught&&dist2(c.x,c.y,e.crim.x,e.crim.y)<70*70){e.caught=true;if(e.crim.ai)e.crim.ai.cruise=0;e.t=Math.min(e.t,9);note('The police caught the suspect');}}
      if(e.crim.wreck||e.crim.burn>=0){e.t=Math.min(e.t,5);}},
      end(e){e.crim.vip=false;e.crim.crim=false;if(e.crim.ai)e.crim.ai.cruise=180;for(const c of e.cops){c.vip=false;if(c.ai){c.ai.follow=null;c.ai.pursuit=false;c.ai.cruise=180;}}}});}
  else if(k==='mugging'){let v=null;for(const p of peds)if(!p.gone&&!p.cop&&p.gang==null&&p.state==='walk'&&!p.target&&dist2(p.x,p.y,player.x,player.y)<500*500&&dist2(p.x,p.y,player.x,player.y)>150*150){v=p;break;}if(!v)return;
    const th=makePed(v.x+20,v.y,false);th.col='#222';th.thief=true;th.target=true;th.state='flee';th.panic=30;th.fx=v.x;th.fy=v.y;v.state='flee';v.panic=3;v.fx=th.x;v.fy=th.y;
    note('Stop, thief! Someone was just mugged');shout(v,'mug');EVENTS.push({k,t:30,th,tick(e){if(e.th.gone&&!e.paid){e.paid=true;addMoney(150);note('You stopped the mugger: +$150');e.t=0;}},end(e){e.th.target=false;}});}
  else if(k==='scuffle'){const z=zoneOf(player.x,player.y);const g1=z>=0?z:0,g2=rivalOf(g1);const a=R()*TAU,d=rr(220,380),x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d;if(!walkable(tileAt(Math.floor(x/T),Math.floor(y/T))))return;
    const A=[],B=[];for(let i=0;i<2;i++){const p=makePed(x+rr(-20,20),y+rr(-20,20),false);makeGang(p,g1);A.push(p);const q=makePed(x+rr(-20,20)+30,y+rr(-20,20),false);makeGang(q,g2);B.push(q);}
    for(const p of A.concat(B)){p.chat=12;p.chatW=(A.includes(p)?B:A)[0];}
    note(GANGS[g1].name+' and '+GANGS[g2].name+' are squaring off');EVENTS.push({k,t:12,A,B,tick(e,dt){if(R()<dt*0.5){const side=R()<0.5?e.A:e.B,p=side.find(q=>!q.gone);if(p){p.flash=0.15;p.stagger=0.3;}}},end(e){const lose=R()<0.5?e.A:e.B;for(const p of lose)if(!p.gone&&R()<0.5)killPed(p,null,0,0);for(const p of e.A.concat(e.B))if(!p.gone){p.chat=0;p.state='flee';p.panic=4;p.fx=p.x+rr(-30,30);p.fy=p.y+rr(-30,30);}}});}
  else{let c=null;for(const o of cars)if(o.driver==='ai'&&o.traffic&&!o.vip&&dist2(o.x,o.y,player.x,player.y)<600*600&&dist2(o.x,o.y,player.x,player.y)>200*200){c=o;break;}if(!c)return;
    c.hp=Math.min(c.hp,c.t.hp*0.25);c.ai.cruise=0;EVENTS.push({k,t:25,c,tick(e,dt){if(R()<dt*6)puff(e.c.x,e.c.y,rr(-10,10),rr(-10,10),1,rr(6,10),'#cfcfcf','smoke');if(!e.out&&e.t<21){e.out=true;const p=ejectDriver(e.c,false);if(p){p.state='walk';p.onPhone=18;}}}});}}
function extTick4(dt){updatePeople(dt);streetEvents(dt);}

// ================= ELEVATED TRAIN (the El) AND THE SUBWAY =================
// The El runs a loop above the streets of the east side on steel pillars. Board it at a station and ride to the next one.
const EL_CORNERS=[[9,5],[16,5],[16,14],[9,14]].map(([ix,iy])=>ixPt(ix,iy));
const EL_H=70,EL_H0=70;
const EL=(()=>{const segs=[];let L=0;for(let i=0;i<EL_CORNERS.length;i++){const a=EL_CORNERS[i],b=EL_CORNERS[(i+1)%EL_CORNERS.length],l=hyp(b.x-a.x,b.y-a.y);segs.push({a,b,l,s0:L,ang:Math.atan2(b.y-a.y,b.x-a.x)});L+=l;}return{segs,L};})();
function elAt(s){s=((s%EL.L)+EL.L)%EL.L;for(const g of EL.segs)if(s<g.s0+g.l||g===EL.segs[EL.segs.length-1]){const t=(s-g.s0)/g.l;return{x:g.a.x+(g.b.x-g.a.x)*t,y:g.a.y+(g.b.y-g.a.y)*t,a:g.ang};}}
// track deck, pillars in the median, and a station halfway along each side
for(const g of EL.segs){for(let d=20;d<g.l;d+=40){const p=elAt(g.s0+d);props.push({x:p.x,y:p.y,k:'eltrack',a:g.ang});}
  for(let d=80;d<g.l-40;d+=200){const p=elAt(g.s0+d);props.push({x:p.x,y:p.y,k:'elpillar',a:g.ang});}}
for(const c of EL_CORNERS)props.push({x:c.x,y:c.y,k:'elpillar',a:0},{x:c.x,y:c.y,k:'elcorner',a:0});
// the track deck is solid ground up there: you can walk the rails (watch for trains)
for(const g of EL.segs)WALKS.push({x:(g.a.x+g.b.x)/2,y:(g.a.y+g.b.y)/2,a:g.ang,hl:g.l/2+2,hw:16,h0:EL_H,h1:EL_H});
for(const c of EL_CORNERS)WALKS.push({x:c.x,y:c.y,a:0,hl:17,hw:17,h0:EL_H,h1:EL_H});
const EL_STATIONS=EL.segs.map((g,i)=>{const s=g.s0+g.l/2,p=elAt(s),nx=-Math.sin(g.ang),ny=Math.cos(g.ang);
  const ux=Math.cos(g.ang),uy=Math.sin(g.ang),pc={x:p.x+nx*60,y:p.y+ny*60},sc={x:p.x+ux*124+nx*80,y:p.y+uy*124+ny*80};
  const st={s,name:['Uptown Av','Eastside','Downtown Sq','Midtown'][i],x:p.x,y:p.y,a:g.ang,pc,ex:pc.x,ey:pc.y,bx:sc.x+ux*60,by:sc.y+uy*60};
  props.push({x:pc.x,y:pc.y,k:'elplat',a:g.ang,rad:70,ht:EL_H+24},{x:sc.x,y:sc.y,k:'elstair',a:g.ang+PI,rad:64,ht:EL_H});
  for(const q of[[-56,30],[56,30]])props.push({x:pc.x+ux*q[0]+nx*q[1],y:pc.y+uy*q[0]+ny*q[1],k:'elpillar',a:g.ang});
  // platform edge: fills the gap between the platform and the rails so you can step down onto the tracks
  props.push({x:p.x+nx*21.5,y:p.y+ny*21.5,k:'elgap',a:g.ang,rad:64,ht:EL_H});
  WALKS.push({x:p.x+nx*21.5,y:p.y+ny*21.5,a:g.ang,hl:62,hw:7,h0:EL_H,h1:EL_H});
  WALKS.push({x:pc.x,y:pc.y,a:g.ang,hl:62,hw:32,h0:EL_H,h1:EL_H});
  // the stairs are 16 flat steps, each exactly as high as the step drawn there, so your feet stay on the treads
  for(let i=0;i<16;i++){const f=-60+(i+.5)*7.5,h=(i+1)*EL_H/16;WALKS.push({x:sc.x-ux*f,y:sc.y-uy*f,a:g.ang,hl:3.75,hw:12,h0:h,h1:h});}
  // a service ladder at the end of the platform leads up onto the canopy roof
  {const cx=pc.x+nx*4,cy=pc.y+ny*4;WALKS.push({x:cx,y:cy,a:g.ang,hl:40,hw:18,h0:EL_H+29.5,h1:EL_H+29.5});
   WALKS.push({x:cx+ux*51,y:cy+uy*51,a:g.ang+PI,hl:7,hw:5,h0:EL_H,h1:EL_H+30,ladder:true});
   props.push({x:cx+ux*44,y:cy+uy*44,k:'ladder',a:g.ang,z0:EL_H,z1:EL_H+31,rad:16,ht:EL_H+32});}
  SIGNS.push({x:st.bx,y:st.by,text:'EL · '+st.name.toUpperCase(),bg:'#2b2f8a',fg:'#ffffff',h:40,on:()=>true});return st;});
const train={s:EL_STATIONS[0].s-600,v:0,wait:0,at:-1,cars:3,len:88};
function trainCar(i){return elAt(train.s-i*(train.len+6));}
function updateTrain(dt){const off=train.len+6;
  if(train.wait>0){train.wait-=dt;train.v=0;if(train.wait<=0){train.at=-1;sfx('door',0.3);}return;}
  let nd=1e9,ni=-1;for(let i=0;i<EL_STATIONS.length;i++){const d=((EL_STATIONS[i].s+off-train.s)%EL.L+EL.L)%EL.L;if(d<1)continue;if(d<nd){nd=d;ni=i;}}
  const want=Math.min(380,Math.sqrt(2*240*nd)+18);train.v=lerp(train.v,want,Math.min(1,dt*1.6));
  const step=Math.min(train.v*dt,nd);train.s+=step;
  if(nd-step<0.6){train.wait=5;train.at=ni;train.v=0;if(dist2(EL_STATIONS[ni].x,EL_STATIONS[ni].y,player.x,player.y)<900*900)sfx('ring',0.4);}}
// boarding and riding
function trainBoard(){if(player.car||player.riding)return false;if(SUB)return subBoard();
  for(let i=0;i<EL_STATIONS.length;i++){const st=EL_STATIONS[i];if(dist2(st.ex,st.ey,player.x,player.y)>75*75||player.jz<EL_H-14)continue;
    if(train.at===i&&train.wait>0.3){player.riding={from:i,last:i,stops:0};sfx('door');note('Stand clear of the closing doors. Next stop: '+EL_STATIONS[(i+1)%EL_STATIONS.length].name);note('Press F at a stop to get off');return true;}
    const eta=Math.round((((st.s-train.s)%EL.L+EL.L)%EL.L)/300)+5;note('Train due in about '+eta+' s');return true;}
  return false;}
// you stay aboard round the loop (like GTA III's trains) until you press F at a stop; each stop is announced
function rideTick(dt){const r=player.riding,p=trainCar(1);player.x=p.x;player.y=p.y;player.a=player.body=p.a;player.vx=player.vy=0;player.moving=false;
  if(train.at>=0&&train.wait>0&&train.at!==r.last){r.last=train.at;r.stops++;const st=EL_STATIONS[train.at],nx=EL_STATIONS[(train.at+1)%EL_STATIONS.length];
    sfx('ring',0.3);zoneBanner={text:st.name.toUpperCase(),sub:'Elevated line  ·  next stop '+nx.name+'  ·  F to get off',col:'#9fb6ff',t:Math.max(2.5,train.wait)};
    radioMsg('EL: This is '+st.name+'. Next stop, '+nx.name+'.');}
  if(train.wait<=0&&r.last>=0&&train.at<0)r.last=-2;}
function trainAlight(){const r=player.riding;if(!r)return;
  if(!(train.at>=0&&train.wait>0)){note('Wait for the next stop to get off');return;}
  const st=EL_STATIONS[train.at];player.riding=null;player.x=st.ex;player.y=st.ey;player.jz=EL_H;player.jv=0;player.body=player.a=st.a;sfx('door');}
// ---- the subway: entrances around town, a $5 ride to any other station ----
const SUBWAY=[{n:'Westside',p:ixPt(2,4)},{n:'Old Town',p:ixPt(4,13)},{n:'Times Square',p:ixPt(TSQ.ix,TSQ.iy+1)},{n:'Central Park',p:ixPt(CPARK.x0,CPARK.y1+1)},{n:'South Beach',p:ixPt(12,NB-1)},{n:'Police HQ',p:null}].map(s=>{
  if(!s.p)s.p=policeSpawn?{x:policeSpawn.x+3*T,y:policeSpawn.y}:ixPt(15,13);const q={x:s.p.x+2.5*T,y:s.p.y+2.5*T};const w=walkable(tileAt(Math.floor(q.x/T),Math.floor(q.y/T)))?q:walkNear(q.x,q.y,60);s.x=w.x;s.y=w.y;
  props.push({x:s.x,y:s.y,k:'subway',a:0});SIGNS.push({x:s.x,y:s.y,text:'SUBWAY',bg:'#1d7a3a',fg:'#ffffff',h:30,on:()=>true});return s;});
// the station hall is built off the south edge of the map; every stop looks like this one
const HX0=HTX0*T,HX1=HTX1*T,HY0=HTY0*T,HY1=HTY1*T,HPL=10;
const inHall=(x,y)=>x>HX0-40&&x<HX1+40&&y>HY0-40&&y<HY1+40;
const SUBHALL=[];
{const cy=(HY0+HY1)/2;
 SUBHALL.push({x:(HX0+HX1)/2,y:HY0+T,k:'hwall',a:0,hl:(HX1-HX0)/2,hw:T/2,rad:500,ht:70},{x:(HX0+HX1)/2,y:HY1-T,k:'hwall',a:0,hl:(HX1-HX0)/2,hw:T/2,rad:500,ht:70},
   {x:HX0+T,y:cy,k:'hwall',a:0,hl:T/2,hw:(HY1-HY0)/2,rad:100,ht:70},{x:HX1-T,y:cy,k:'hwall',a:0,hl:T/2,hw:(HY1-HY0)/2,rad:100,ht:70});
 SUBHALL.push({x:(HX0+HX1)/2-30,y:HY0+T*2,k:'hplat',a:0,hl:(HX1-HX0)/2-90,hw:T-1,rad:420,ht:20});
 for(const ry of[HY0+T*3.3,HY0+T*3.7])SUBHALL.push({x:(HX0+HX1)/2,y:ry,k:'hrail',a:0,hl:(HX1-HX0)/2-T,rad:420,ht:4});
 for(let x=HX0+80;x<HX1-60;x+=110)SUBHALL.push({x,y:HY0+T*1.6,k:'hlight',a:0,rad:20,ht:66},{x,y:HY0+T*1.3,k:'hsign',a:0,rad:20,ht:40});
 SUBHALL.push({x:HX1-T*3.2,y:HY0+T*2,k:'hstair',a:0,rad:60,ht:60});
 WALKS.push({x:(HX0+HX1)/2-30,y:HY0+T*2,a:0,hl:(HX1-HX0)/2-90,hw:T-1,h0:HPL,h1:HPL});
 // the exit stairs are a ramp you climb (rendering rule 4), not a block you can walk into and vanish inside
 for(let i=0;i<8;i++){const h=HPL+(i+1)*7;WALKS.push({x:HX1-T*3.2+i*8-28,y:HY0+T*2,a:0,hl:4,hw:T*0.9,h0:h,h1:h});}}
const utrain={x:HX0-600,v:0,wait:0,cars:3,len:88};
let SUB=null,subCool=0;
function utrainCar(i){return{x:utrain.x-i*(utrain.len+6),y:HY0+T*3.5,a:0,z:0};}
function updateUtrain(dt){const stop=(HX0+HX1)/2+utrain.len;
  if(utrain.wait>0){utrain.wait-=dt;if(utrain.wait<=0)sfx('door',0.3);return;}
  if(utrain.x<stop-1&&utrain.x>HX0-700){const d=stop-utrain.x,want=Math.min(420,Math.sqrt(2*260*d)+15);utrain.v=lerp(utrain.v,want,Math.min(1,dt*2));utrain.x+=Math.min(d,utrain.v*dt);if(stop-utrain.x<1){utrain.wait=8;utrain.v=0;if(SUB)sfx('ring',0.4);}}
  else{utrain.v=Math.min(420,utrain.v+180*dt);utrain.x+=utrain.v*dt;if(utrain.x>HX1+900){utrain.x=HX0-700;utrain.v=380;}}}
function updateSubway(dt){subCool-=dt;if(subCool>0||player.car||player.riding||DLG.open||game.state!=='play')return;
  if(SUB){// exit stairs at the east end of the hall
    if(player.x>HX1-T*4.6&&player.y<HY0+T*2.8&&player.x<HX1-T*1.6){const o=SUBWAY[SUB.from];SUB=null;fadeIn=1;player.x=o.x;player.y=o.y+30;player.jz=0;subCool=3;showBig(o.n.toUpperCase(),'Subway exit','#7dff8a',1.6);return;}
    return;}
  if(mission&&!(mission.opts&&mission.opts.subOK))return;
  for(let i=0;i<SUBWAY.length;i++){const s=SUBWAY[i];if(dist2(s.x,s.y,player.x,player.y)>30*30)continue;subCool=3;
    if(stars()>=3){note('Cops are watching the stations. Lose some stars first.');return;}
    if(money<5){note('The subway costs $5');return;}addMoney(-5);enterHall(i,false);
    if(stars()>0){seenT=99;lastSeenX=s.x;lastSeenY=s.y;}return;}}
function enterHall(i,arrived){SUB={from:i};fadeIn=1;player.x=HX1-T*5.4;player.y=HY0+T*2;player.jz=HPL;player.jv=0;player.a=player.body=PI;
  showBig(SUBWAY[i].n.toUpperCase()+' STATION',arrived?'Take the stairs up to the street':'Wait for the train on the platform','#7dff8a',2.2);}
function subBoard(){if(!SUB||utrain.wait<0.4||player.y<HY0+T*2.2||Math.abs(player.x-(HX0+HX1)/2)>200)return false;
  const opts=SUBWAY.map((o,i)=>[o,i]).filter(([o,i])=>i!==SUB.from&&WOK(o.x,o.y)).slice(0,5).map(([o,i])=>[o.n.toUpperCase(),()=>{fadeIn=1;sfx('door');note('Riding to '+o.n+'...');utrain.wait=0.01;setTimeout(()=>{enterHall(i,true);utrain.x=(HX0+HX1)/2+utrain.len;utrain.wait=0.01;},900);}]);
  say([['Subway','Where to?']],null,opts.concat([['STAY',()=>{},'no']]));return true;}
function trainHit(){if(player.riding||player.car||game.state!=='play'||(player.jz||0)<EL_H-10||(player.jz||0)>EL_H+18||train.v<25)return;
  for(let i=0;i<train.cars;i++){const p=trainCar(i),dx=player.x-p.x,dy=player.y-p.y,ca=Math.cos(p.a),sa=Math.sin(p.a),f=dx*ca+dy*sa,l=-dx*sa+dy*ca;
    if(Math.abs(f)<train.len/2+4&&Math.abs(l)<16){const sd=l>=0?1:-1;player.x=p.x-sa*sd*44+ca*f;player.y=p.y+ca*sd*44+sa*f;player.jz+=2;player.jv=150;
      hurtPlayer(35);if(typeof shake!=='undefined')shake=Math.max(shake,10);sfx('crash',0.8);note('Hit by the El! Stay off the tracks when a train comes');return;}}}
function transitTick(dt){updateTrain(dt);trainHit();updateUtrain(dt);updateSubway(dt);}

