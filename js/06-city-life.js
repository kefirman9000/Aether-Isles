// ================= INTERIORS, NIGHT CLUB, WEATHER, CITY RESPONDERS, SMARTER RACERS, FIREWORKS =================
// ---------- interiors: rooms built off the south edge of the map, like the subway hall ----------
const ROOMS={
  ammu:{tx0:60,ty0:W+13,tx1:72,ty1:W+21,floor:[118,118,122],wall:[150,146,138],name:'AMMU-NATION'},
  safe:{tx0:76,ty0:W+13,tx1:88,ty1:W+21,floor:[132,100,70],wall:[196,186,160],name:'SAFEHOUSE'},
  club:{tx0:92,ty0:W+13,tx1:110,ty1:W+25,floor:[26,22,34],wall:[40,30,60],name:'THE NEON LOTUS'},
};
for(const k in ROOMS){const r=ROOMS[k];r.id=k;r.x0=r.tx0*T;r.y0=r.ty0*T;r.x1=r.tx1*T;r.y1=r.ty1*T;r.cx=(r.x0+r.x1)/2;r.cy=(r.y0+r.y1)/2;r.door={x:r.cx,y:r.y1-T*1.6};r.props=[];
  const hw=(r.x1-r.x0)/2,hh=(r.y1-r.y0)/2;
  r.props.push({x:r.cx,y:r.y0+T/2,k:'rwall',hl:hw,hw:T/2,rad:hw+20,ht:70,c:r.wall},{x:r.cx,y:r.y1-T/2,k:'rwall',hl:hw,hw:T/2,rad:hw+20,ht:70,c:r.wall},
    {x:r.x0+T/2,y:r.cy,k:'rwall',hl:T/2,hw:hh,rad:hh+20,ht:70,c:r.wall},{x:r.x1-T/2,y:r.cy,k:'rwall',hl:T/2,hw:hh,rad:hh+20,ht:70,c:r.wall},
    {x:r.door.x,y:r.y1-T*1.05,k:'rdoor',rad:30,ht:60});}
{const r=ROOMS.ammu;r.counter={x:r.cx,y:r.y0+T*2.6};r.props.push({x:r.cx,y:r.y0+T*2.6,k:'rbox',hl:T*3,hw:T*0.5,z0:0,z1:18,c:[90,70,50],rad:110,ht:20});
  for(let i=-2;i<=2;i++)r.props.push({x:r.cx+i*T*1.2,y:r.y0+T*1.05,k:'rbox',hl:T*0.45,hw:2,z0:24,z1:30,c:[40,40,44],rad:20,ht:32});
  r.props.push({x:r.cx,y:r.y0+T*1.2,k:'rsign',text:'AMMU-NATION',bg:'#2a2a2a',fg:'#ff4040',z:52,rad:30,ht:60});}
{const r=ROOMS.safe;r.bed={x:r.x0+T*2.6,y:r.y0+T*2.4};r.props.push({x:r.bed.x,y:r.bed.y,k:'rbox',hl:T*1.3,hw:T*0.8,z0:0,z1:10,c:[60,80,140],rad:50,ht:14},
  {x:r.bed.x-T*1.1,y:r.bed.y,k:'rbox',hl:T*0.3,hw:T*0.6,z0:10,z1:13,c:[230,230,226],rad:20,ht:14},
  {x:r.x1-T*3,y:r.y0+T*1.2,k:'rbox',hl:T*1.2,hw:T*0.3,z0:8,z1:26,c:[30,30,34],rad:40,ht:28},{x:r.x1-T*3,y:r.y0+T*3.4,k:'rbox',hl:T*1.5,hw:T*0.6,z0:0,z1:12,c:[120,60,50],rad:50,ht:14},
  {x:r.bed.x,y:r.y0+T*1.2,k:'rsign',text:'BED · SAVE',bg:'#11704a',fg:'#ffffff',z:40,rad:30,ht:44});}
{const r=ROOMS.club;r.bar={x:r.x1-T*3,y:r.cy};r.props.push({x:r.x1-T*2.6,y:r.cy,k:'rbox',hl:T*0.6,hw:T*3,z0:0,z1:18,c:[70,30,90],rad:110,ht:20},
  {x:r.cx,y:r.y0+T*1.8,k:'rbox',hl:T*2,hw:T*0.8,z0:0,z1:16,c:[30,30,40],rad:70,ht:18},{x:r.cx,y:r.y0+T*1.6,k:'rsign',text:'DJ',bg:'#c07cff',fg:'#111111',z:34,rad:30,ht:40});
  for(let j=0;j<6;j++)for(let i=0;i<8;i++)r.props.push({x:r.x0+T*(3.5+i),y:r.y0+T*(3.5+j),k:'rdance',i,j,rad:20,ht:2});
  for(let i=0;i<5;i++)r.props.push({x:r.x0+T*(3+i*2.6),y:r.y0+T*1.1,k:'rspot',i,rad:20,ht:66});}
const ROOMLIST=Object.values(ROOMS);
const roomAt=(x,y)=>{for(const r of ROOMLIST)if(x>r.x0-40&&x<r.x1+40&&y>r.y0-40&&y<r.y1+40)return r;return null;};
function roomTile(tx,ty){for(const r of ROOMLIST)if(tx>=r.tx0&&tx<r.tx1&&ty>=r.ty0&&ty<r.ty1)return tx>r.tx0&&tx<r.tx1-1&&ty>r.ty0&&ty<r.ty1-1?WALK:BLD;return -1;}
let ROOM=null,roomCool=0;
// the club: open at night, a downtown door near Times Square
const CLUB=(()=>{const l=nearestLot(LM.tsq.x+3*P*T*0.5,LM.tsq.y-P*T)||lotBlocks[0];const d={x:l.x,y:l.y+60};SIGNS.push({x:d.x,y:d.y-40,text:'THE NEON LOTUS',bg:'#3a0a4a',fg:'#ff4fa8',h:48,on:()=>true});return d;})();
const clubOpen=()=>darkness>0.3||clock<0.22||clock>0.8;
function enterRoom(id,back){const r=ROOMS[id];ROOM={id,r,back};fadeIn=1;player.x=r.door.x;player.y=r.door.y-T*0.8;player.jz=0;player.jv=0;player.a=player.body=-PI/2;roomCool=1.5;
  showBig(r.name,id==='club'?'Dance floor, bar, and the DJ':id==='safe'?'Walk to the bed to save':'Walk to the counter','#ffd600',1.8);
  if(id==='club'){for(let i=0;i<14;i++){const p=makePed(r.x0+T*rr(3.5,10.5),r.y0+T*rr(3.5,8.5),false);p.busker=true;p.target=true;p.clubber=true;p.col=pick(['#ff4fa8','#3ad6ff','#ffd23a','#7cff6a','#c07cff','#ffffff']);}radioSaved=radio.st;}}
let radioSaved=-1;
function leaveRoom(){const b=ROOM.back;if(ROOM.id==='club')for(const p of peds)if(p.clubber)p.gone=true;ROOM=null;fadeIn=1;player.x=b.x;player.y=b.y;player.jz=0;roomCool=2;}
function updateRooms(dt){roomCool-=dt;if(roomCool>0||player.car||DLG.open||game.state!=='play')return;
  if(ROOM){const r=ROOM.r;if(dist2(player.x,player.y,r.door.x,r.door.y)<24*24){leaveRoom();return;}
    if(ROOM.id==='ammu'&&dist2(player.x,player.y,r.counter.x,r.counter.y+T)<30*30){roomCool=3;gunMenu();}
    if(ROOM.id==='safe'&&dist2(player.x,player.y,r.bed.x,r.bed.y)<46*46){roomCool=3;player.hp=PMAX();game.paused=true;menuShow('pause');openPanel('save');note('Health restored');}
    if(ROOM.id==='club'&&dist2(player.x,player.y,r.bar.x-T,r.bar.y)<40*40){roomCool=6;say([['Bartender','What can I get you?']],null,[['SODA $5',()=>{if(money>=5){addMoney(-5);player.hp=Math.min(PMAX(),player.hp+10);note('Refreshing. +10 health');}}],['VIP ROUND $200',()=>{if(money>=200){addMoney(-200);for(let g=0;g<3;g++)addRespect(g,0.3);note('Word gets around. Every gang likes you a little more.');}}],['NOTHING',()=>{},'no']]);}
    return;}
  for(const g of GUNSHOPS)if(dist2(g.x,g.y,player.x,player.y)<34*34){enterRoom('ammu',{x:g.x,y:g.y+40});return;}
  for(const sh of SAFEHOUSES)if(sh.owned&&stars()===0&&dist2(sh.x,sh.y,player.x,player.y)<34*34){enterRoom('safe',{x:sh.x,y:sh.y+40});shCool=4;return;}
  if(dist2(CLUB.x,CLUB.y,player.x,player.y)<34*34){if(!clubOpen()){note('The Neon Lotus opens at night');roomCool=4;return;}enterRoom('club',{x:CLUB.x,y:CLUB.y+40});}}

// ---------- weather: winter snow, morning fog, flooding storms, lightning blackouts ----------
const SEASON=()=>OPT.season==='winter'?'winter':OPT.season==='summer'?'summer':([11,0,1].includes(new Date().getMonth())?'winter':'auto');
let SNOWK=0,FOGK=0,fogTarget=0,FLOODK=0,BLACKOUT=null;
function updateWeather(dt){const snow=SEASON()==='winter';
  SNOWK=lerp(SNOWK,snow?(rain>0.2?1:0.35):0,Math.min(1,dt*0.03));
  if(R()<dt/120&&rain<0.1)fogTarget=R()<0.5?rr(0.5,0.9):0;if(rain>0.3)fogTarget=0;FOGK=lerp(FOGK,fogTarget,Math.min(1,dt*0.1));
  FLOODK=lerp(FLOODK,!snow&&rain>0.85?1:0,Math.min(1,dt*(rain>0.85?0.03:0.06)));
  if(lightning>0.95&&rain>0.8&&!BLACKOUT&&R()<0.4){BLACKOUT={x:player.x+rr(-500,500),y:player.y+rr(-500,500),r:1500,t:35};note('Lightning knocked out the power. Traffic lights are down!');}
  if(BLACKOUT){BLACKOUT.t-=dt;if(BLACKOUT.t<=0){BLACKOUT=null;note('Power is back on');}}}
const inBlackout=(x,y)=>BLACKOUT&&dist2(x,y,BLACKOUT.x,BLACKOUT.y)<BLACKOUT.r*BLACKOUT.r;

// ---------- the city responds: ambulances to people who got hurt, fire trucks to wrecks ----------
const RESP=[];let respT=6;
function updateResponders(dt){respT-=dt;
  for(let i=RESP.length-1;i>=0;i--){const q=RESP[i],c=q.c;q.t-=dt;if(!c||c.wreck||c.driver==='player'||cars.indexOf(c)<0||q.t<=0){if(c){c.vip=false;if(c.ai){c.ai.follow=null;c.ai.cruise=170;}}RESP.splice(i,1);continue;}
    if(c.ai)c.ai.follow=q.at;const d=hyp(c.x-q.at.x,c.y-q.at.y);
    if(!q.there&&d<130){q.there=true;q.t=Math.min(q.t,14);if(c.ai)c.ai.cruise=0;const p=ejectDriver(c,false);if(p){p.state='walk';p.medic=true;p.tx=q.at.x;p.ty=q.at.y;q.crew=p;}c.driver='ai';}
    if(q.there){if(q.kind==='fire'&&R()<dt*20)puff(c.x+rr(-20,20),c.y+rr(-20,20),(q.at.x-c.x)*0.8,(q.at.y-c.y)*0.8,0.5,4,'#bfe3ff','smoke');
      if(q.kind==='fire'&&q.wreck&&q.t<6&&q.wreck.burn>=0)q.wreck.burn=-1;
      if(q.t<3&&q.crew&&!q.crew.gone){q.crew.gone=true;q.crew=null;if(c.ai){acquireLane(c);c.ai.cruise=170;}}}}
  if(respT>0||game.state!=='play')return;respT=8;if(RESP.length>=2)return;
  let body=null;for(const m of marks)if(m.k==='body'&&!m.served&&dist2(m.x,m.y,player.x,player.y)<900*900){body=m;break;}
  if(body){body.served=true;const c=spawnTraffic('ambulance',false);if(c){c.driver='ai';c.vip=true;c.ai.cruise=280;c.ai.pursuit=false;RESP.push({kind:'amb',c,at:{x:body.x,y:body.y},t:60});return;}}
  let wr=null;for(const c of cars)if((c.wreck||c.burn>=0)&&!c.served&&dist2(c.x,c.y,player.x,player.y)<900*900){wr=c;break;}
  if(wr){wr.served=true;const c=spawnTraffic('firetruck',false);if(c){c.driver='ai';c.vip=true;c.ai.cruise=260;RESP.push({kind:'fire',c,at:{x:wr.x,y:wr.y},wreck:wr,t:60});}}}

// ---------- racers find their way along the street network ----------
function nodeOf(x,y){return[clamp(Math.round((x/T-2)/P),0,NB),clamp(Math.round((y/T-2)/P),0,NB)];}
function roadPath(a,b){const key=(x,y)=>x+','+y,prev=new Map([[key(a[0],a[1]),null]]),q=[a];
  while(q.length){const[x,y]=q.shift();if(x===b[0]&&y===b[1])break;for(let d=0;d<4;d++)if(linkOK(x,y,d)){const nx=x+DX[d],ny=y+DY[d],k=key(nx,ny);if(!prev.has(k)){prev.set(k,[x,y]);q.push([nx,ny]);}}}
  const out=[];let cur=key(b[0],b[1]);if(!prev.has(cur))return[b];let n=b;while(n){out.unshift(n);n=prev.get(key(n[0],n[1]));}return out;}

// ---------- fireworks over the river: holidays, and the odd celebration at night ----------
const FW=[];let fwT=0,fwNight=-1;
function holiday(){const d=new Date(),m=d.getMonth(),day=d.getDate();return(m===0&&day===1)||(m===11&&day===31)||(m===6&&day===4);}
function updateFireworks(dt){const night=darkness>0.45;
  if(night&&fwNight!==Math.floor(game.t/600)){fwNight=Math.floor(game.t/600);FW.show=holiday()||R()<0.15?50:0;if(FW.show)note('Fireworks over the East River tonight!');}
  if(FW.show>0&&night){FW.show-=dt;fwT-=dt;if(fwT<=0){fwT=rr(0.4,1.4);const x=rr(RIVX0+3,RIVX1-3)*T,y=player.y+rr(-700,700);FW.push({x,y,z:0,vz:rr(190,240),life:rr(1.2,1.6),shell:true,col:pick(['#ff4fa8','#3ad6ff','#ffd23a','#7cff6a','#ff6a3a','#ffffff'])});}}
  for(let i=FW.length-1;i>=0;i--){const f=FW[i];f.life-=dt;f.z+=f.vz*dt;f.x+=(f.vx||0)*dt;f.y+=(f.vy||0)*dt;f.vz-=(f.shell?90:60)*dt;
    if(f.life<=0){if(f.shell){for(let k=0;k<26;k++){const a=R()*TAU,e=rr(-1,1),s=rr(80,140);FW.push({x:f.x,y:f.y,z:f.z,vx:Math.cos(a)*s*Math.sqrt(1-e*e),vy:Math.sin(a)*s*Math.sqrt(1-e*e),vz:e*s,life:rr(1,1.6),col:f.col});}if(dist2(f.x,f.y,player.x,player.y)<2000*2000)sfx('boom',0.25);}FW.splice(i,1);}}
  if(FW.length>600)FW.splice(0,FW.length-600);}

function extTick5(dt){extTick11(dt);extTick6(dt);extTick7(dt);extTick8(dt);extTick9(dt);extTick10(dt);updateRooms(dt);updateWeather(dt);updateResponders(dt);updateFireworks(dt);}

function raceAI(c,dt){const m=mission;if(!m||!m.opts.race||!c.race){c.driver=null;c.traffic=true;c.vip=false;return;}
  const r=m.opts.race,R2=c.race;if(m.cd>0||R2.done){driveCar(c,0,0,true,dt);return;}
  if(!R2.path){R2.path=roadPath(nodeOf(c.x,c.y),r.route[R2.wp]);R2.pi=0;R2.from={x:c.x,y:c.y};}
  const nd=R2.path[Math.min(R2.pi,R2.path.length-1)],wp=ixPt(nd[0],nd[1]),pv=R2.pi>0?ixPt(...R2.path[R2.pi-1]):R2.from,dx=wp.x-c.x,dy=wp.y-c.y,d=hyp(dx,dy);
  if(d<100){R2.pi++;if(R2.pi>=R2.path.length){R2.wp++;R2.path=null;if(R2.wp>=r.route.length){R2.done=true;m.finished=(m.finished||0)+1;R2.place=m.finished;}}return;}
  const sl=hyp(wp.x-pv.x,wp.y-pv.y)||1,ux=(wp.x-pv.x)/sl,uy=(wp.y-pv.y)/sl,along=(c.x-pv.x)*ux+(c.y-pv.y)*uy,sp=hyp(c.vx,c.vy),la=Math.min(sl,along+60+sp*0.3);
  {const fx=Math.cos(c.a),fy=Math.sin(c.a);let bl=false;for(const o of cars){if(o===c)continue;const rx=o.x-c.x,ry=o.y-c.y;if(rx*rx+ry*ry>140*140)continue;const f=rx*fx+ry*fy,l=-rx*fy+ry*fx;if(f>0&&f<110&&Math.abs(l)<26){bl=true;break;}}
   if(bl)R2.pass=1.6;else if(R2.pass>0)R2.pass-=dt;}
  const lo=R2.pass>0?-26:22,gx=pv.x+ux*la-uy*lo,gy=pv.y+uy*la+ux*lo;
  const nn=R2.path[R2.pi+1],turn=nn?Math.abs(angDiff(Math.atan2(nn[1]-nd[1],nn[0]-nd[0]),Math.atan2(uy,ux))):0;
  const diff=angDiff(Math.atan2(gy-c.y,gx-c.x),c.a);let target=560*R2.skill;if(d<300&&turn>0.6)target=Math.min(target,150+d*0.7);if(Math.abs(diff)>0.6)target=Math.min(target,160);
  R2.chk=(R2.chk||0)+dt;if(R2.chk>1){R2.chk=0;const mv=hyp(c.x-(R2.lx||0),c.y-(R2.ly||0));R2.lx=c.x;R2.ly=c.y;if(mv<25&&!R2.rev)R2.rev=1.1;}
  const vf=c.vx*Math.cos(c.a)+c.vy*Math.sin(c.a);let thr=vf<target?1:-0.6,st=clamp(diff*2.4,-1,1);
  if(R2.rev>0){R2.rev-=dt;thr=-1;st=-st;if(R2.rev<=0){R2.rev=0;R2.path=null;}}
  driveCar(c,thr,st,Math.abs(diff)>1.1&&sp>200,dt);}
// ---------- GPS: shortest route along the streets (and the diagonal avenues' ends) to the objective ----------
const GPS={t:0,key:'',path:null};
function gpsRoute(tg){const now=game.t,key=Math.round(tg.x/64)+','+Math.round(tg.y/64);
  if(GPS.path&&now-GPS.t<0.6&&GPS.key===key)return GPS.path;GPS.t=now;GPS.key=key;
  const o=player.car||player,a=nodeOf(o.x,o.y),b=nodeOf(tg.x,tg.y);
  if(Math.abs(tg.x-o.x)+Math.abs(tg.y-o.y)<260){GPS.path=[{x:tg.x,y:tg.y}];return GPS.path;}
  const nodes=roadPath(a,b).map(n=>ixPt(n[0],n[1]));
  // skip the first node if it's behind us, and finish at the target itself
  if(nodes.length>1){const n0=nodes[0],n1=nodes[1];if((n1.x-n0.x)*(o.x-n0.x)+(n1.y-n0.y)*(o.y-n0.y)>0)nodes.shift();}
  nodes.push({x:tg.x,y:tg.y});GPS.path=nodes;return nodes;}


// ---------- a helicopter you can fly ----------
CT.heli={name:'Sparrow',L:44,Wd:16,max:520,acc:300,grip:10,turn:2.4,hp:160,mass:1.2,cols:['#c8c8cc','#d8382a','#2a7ae0'],heli:true};
const HELIPADS=[];
for(const[bx,by]of[[15,13],[2,6]]){const l=nearestLot((bx*P+9)*T,(by*P+9)*T);if(!l)continue;const c=makeCar('heli',l.x,l.y,0);c.alt=0;HELIPADS.push({x:l.x,y:l.y});SIGNS.push({x:l.x,y:l.y-50,text:'HELIPAD',bg:'#c9a23a',fg:'#111111',h:30,on:()=>true});}
function heliDrive(c,thr,steer,hb,dt){c.alt=c.alt||0;const pl=c===player.car;c.rot=(c.rot||0)+dt*(c.driver?34:0);
  if(pl){const up=kd.Space||tbtn.brake.on,dn=kd.ShiftLeft||kd.ShiftRight||tbtn.nos.on;if(up)c.alt=Math.min(240,c.alt+95*dt);else if(dn)c.alt=Math.max(0,c.alt-110*dt);}
  else if(!c.driver)c.alt=Math.max(0,c.alt-60*dt);
  const flying=c.alt>6,ca=Math.cos(c.a),sa=Math.sin(c.a);
  if(flying){c.a+=steer*2.3*dt;c.va=0;const want=thr*(thr>0?c.t.max:c.t.max*0.35);let vf=c.vx*ca+c.vy*sa;vf=lerp(vf,want,Math.min(1,dt*1.1));
    const vl=(-c.vx*sa+c.vy*ca)*Math.exp(-2.5*dt);c.vx=ca*vf-sa*vl;c.vy=sa*vf+ca*vl;c.driven=true;
    // tall buildings stop you
    for(const b of buildings){if(c.x<b.x-14||c.x>b.x+b.w+14||c.y<b.y-14||c.y>b.y+b.h+14)continue;const top=(b.tier?b.tier.hg2:b.hg)*BH+8;if(c.alt>top)continue;
      const dl=c.x-(b.x-14),dr=b.x+b.w+14-c.x,du=c.y-(b.y-14),dd=b.y+b.h+14-c.y,m=Math.min(dl,dr,du,dd);
      if(m===dl){c.x-=dl;c.vx=Math.min(0,c.vx)*-0.3;}else if(m===dr){c.x+=dr;c.vx=Math.max(0,c.vx)*-0.3;}else if(m===du){c.y-=du;c.vy=Math.min(0,c.vy)*-0.3;}else{c.y+=dd;c.vy=Math.max(0,c.vy)*-0.3;}
      if(Math.abs(vf)>220){damageCar(c,(Math.abs(vf)-220)*0.08,pl?'player':null);shake=Math.max(shake,4);}}
    if(pl&&R()<dt*8&&c.alt<40)puff(c.x+rr(-30,30),c.y+rr(-30,30),rr(-60,60),rr(-60,60),0.6,rr(5,9),'#d8d2c4','smoke');}
  else{c.vx*=Math.exp(-6*dt);c.vy*=Math.exp(-6*dt);c.driven=true;}
  c.skid=false;}

// ---------- robberies: 24/7 stores and the bank ----------
ROOMS.store={tx0:112,ty0:W+13,tx1:122,ty1:W+20,floor:[170,170,160],wall:[220,214,190],name:'24/7'};
ROOMS.bank={tx0:126,ty0:W+13,tx1:142,ty1:W+23,floor:[150,130,110],wall:[200,190,170],name:'GRIDLOCK SAVINGS BANK'};
for(const k of['store','bank']){const r=ROOMS[k];r.id=k;r.x0=r.tx0*T;r.y0=r.ty0*T;r.x1=r.tx1*T;r.y1=r.ty1*T;r.cx=(r.x0+r.x1)/2;r.cy=(r.y0+r.y1)/2;r.door={x:r.cx,y:r.y1-T*1.6};r.props=[];
  const hw=(r.x1-r.x0)/2,hh=(r.y1-r.y0)/2;
  r.props.push({x:r.cx,y:r.y0+T/2,k:'rwall',hl:hw,hw:T/2,rad:hw+20,ht:70,c:r.wall},{x:r.cx,y:r.y1-T/2,k:'rwall',hl:hw,hw:T/2,rad:hw+20,ht:70,c:r.wall},
    {x:r.x0+T/2,y:r.cy,k:'rwall',hl:T/2,hw:hh,rad:hh+20,ht:70,c:r.wall},{x:r.x1-T/2,y:r.cy,k:'rwall',hl:T/2,hw:hh,rad:hh+20,ht:70,c:r.wall},{x:r.door.x,y:r.y1-T*1.05,k:'rdoor',rad:30,ht:60});
  ROOMLIST.push(r);}
{const r=ROOMS.store;r.counter={x:r.cx,y:r.y0+T*2.2};r.props.push({x:r.cx,y:r.y0+T*2.2,k:'rbox',hl:T*2.4,hw:T*0.5,z0:0,z1:16,c:[200,60,50],rad:90,ht:18});
  for(let i=0;i<3;i++)r.props.push({x:r.x0+T*(2.5+i*2.4),y:r.y1-T*3,k:'rbox',hl:T*0.9,hw:T*0.4,z0:0,z1:22,c:[[230,180,60],[80,160,220],[120,200,90]][i],rad:40,ht:24});
  r.props.push({x:r.cx,y:r.y0+T*1.1,k:'rsign',text:'24/7',bg:'#d8382a',fg:'#ffffff',z:44,rad:30,ht:50});}
{const r=ROOMS.bank;r.vault={x:r.cx,y:r.y0+T*1.6};r.props.push({x:r.cx,y:r.y0+T*1.0,k:'rbox',hl:T*1.6,hw:T*0.4,z0:0,z1:50,c:[120,120,130],rad:60,ht:52},
  {x:r.cx-T*4.5,y:r.cy,k:'rbox',hl:T*0.5,hw:T*2.5,z0:0,z1:18,c:[110,70,40],rad:90,ht:20},{x:r.cx+T*4.5,y:r.cy,k:'rbox',hl:T*0.5,hw:T*2.5,z0:0,z1:18,c:[110,70,40],rad:90,ht:20},
  {x:r.cx,y:r.y0+T*2.2,k:'rsign',text:'VAULT',bg:'#202020',fg:'#ffd600',z:56,rad:30,ht:60});}
const STORES=[[7,3],[12,15]].map(([bx,by])=>{const l=nearestLot((bx*P+9)*T,(by*P+9)*T)||lotBlocks[0];const s={x:l.x-40,y:l.y+60,robT:-1e9};SIGNS.push({x:s.x,y:s.y-30,text:'24/7',bg:'#d8382a',fg:'#ffffff',h:36,on:()=>true});return s;});
const BANK=(()=>{const l=nearestLot(LM.tsq.x-2*P*T,LM.tsq.y+P*T)||lotBlocks[0];const s={x:l.x+40,y:l.y+60,robT:-1e9};SIGNS.push({x:s.x,y:s.y-40,text:'GRIDLOCK SAVINGS BANK',bg:'#1f3f6f',fg:'#ffd600',h:44,on:()=>true});return s;})();
let drill=null,robCool=0;
function updateRobbery(dt){robCool-=dt;if(game.state!=='play')return;
  if(!ROOM){if(roomCool>0||player.car||DLG.open)return;
    for(const s of STORES)if(dist2(s.x,s.y,player.x,player.y)<30*30){ROOM_FROM=s;enterRoom('store',{x:s.x,y:s.y+40});return;}
    if(dist2(BANK.x,BANK.y,player.x,player.y)<30*30){ROOM_FROM=BANK;enterRoom('bank',{x:BANK.x,y:BANK.y+40});}return;}
  const r=ROOM.r,armed=player.w>0||player.ammo[0]>0;
  if(ROOM.id==='store'&&robCool<=0&&!DLG.open&&dist2(player.x,player.y,r.counter.x,r.counter.y+T)<30*30){robCool=4;const s=ROOM_FROM;
    say([['Clerk','Welcome to 24/7. What do you want?']],null,[['SNACK $5',()=>{if(money>=5){addMoney(-5);player.hp=Math.min(PMAX(),player.hp+20);note('+20 health');}}],
      ...(armed?[['ROB THE REGISTER',()=>{if(game.t-s.robT<300){note('The register is still empty from last time');return;}s.robT=game.t;const cash=Math.round(rr(300,800));addMoney(cash);crime(400,2);showBig('ROBBERY','+$'+cash,'#ff4040',2);radioMsg('DISPATCH: Armed robbery at a 24/7. Suspect still on scene.');}]]:[]),['LEAVE',()=>{},'no']]);}
  if(ROOM.id==='bank'){const v=r.vault,near=dist2(player.x,player.y,v.x,v.y+T)<40*40;
    if(near&&!drill&&robCool<=0&&!DLG.open){robCool=4;if(game.t-BANK.robT<600){note('The vault is empty. Come back another day');return;}
      say([['Teller','Can I... help you?']],null,[['CRACK THE VAULT',()=>{if(!armed){note('You need a weapon');return;}drill={t:0};crime(800,3);radioMsg('DISPATCH: Silent alarm at Gridlock Savings! All units respond.');sfx('rocket',0.3);}],['NEVER MIND',()=>{},'no']]);}
    if(drill){if(!near){drill=null;note('You left the vault. The heist is off');return;}drill.t+=dt;if(R()<dt*10)puff(v.x+rr(-10,10),v.y+T*0.8,rr(-30,30),rr(10,40),0.4,3,'#ffd08a','spark');
      if(drill.t>=9){drill=null;BANK.robT=game.t;const cash=Math.round(rr(6000,9000));addMoney(cash);crime(0,4);showBig('BANK HEIST','+$'+cash.toLocaleString()+'  ·  get out!','#ffd600',3);radioMsg('NEWS: Daring daylight bank heist at Gridlock Savings.');}}}}
let ROOM_FROM=null;

// ---------- police radio and the news ----------
const RADIOLOG=[];let lastStars=0,wasSeen=true,newsT=50;
// GTA III's pager: a little LCD box, top left, that scrolls a message across
let PAGER=null;function pager(t){PAGER={t,at:performance.now()};sfx('pager');}
function drawPager(sc){if(!PAGER)return;const age=(performance.now()-PAGER.at)/1000;if(age>12){PAGER=null;return;}
  const w=Math.round(230*sc),h=Math.round(30*sc),x=touchMode?VW/2-w/2:Math.round(16*sc),y=touchMode?Math.round(56*sc):Math.round((mission||job||fare||sideJob||roofRun?150:14)*sc);
  ctx.save();ctx.fillStyle='#1a1e1a';rrect(x-4,y-4,w+8,h+8,6);ctx.fill();ctx.fillStyle='#8fb87a';ctx.fillRect(x,y,w,h);ctx.beginPath();ctx.rect(x+4,y,w-8,h);ctx.clip();
  ctx.font=`bold ${Math.round(15*sc)}px "Pixelify Sans",monospace`;ctx.textBaseline='middle';ctx.fillStyle='#1d2a18';const tw=ctx.measureText(PAGER.t).width;
  const span=w+tw+30*sc,off=w-((age*70*sc)%span);ctx.fillText(PAGER.t,x+4+off,y+h/2+1);ctx.restore();}
// the talk station and the ads: lines appear under the station name while you listen
const TALK=['MARTY VANCE: You\'re on Chatter 96.1. Caller, go ahead.','CALLER: Marty, why does every car in this town honk at me?','MARTY: Because you\'re in the middle of the road, Doris.',
  'MARTY: Today\'s topic: is the El train a train, or a very slow ceiling?','CALLER: I saw a man land a taxi on a hay bale. Is that legal?','MARTY: In Gridlock City? It\'s practically a sport.',
  'CALLER: The cops chased me for six blocks for jaywalking.','MARTY: Six stars of jaywalking. Respect.','MARTY: Coming up: the mayor explains potholes, again.',
  'CALLER: Marty, the Lotus Quarter lanterns are beautiful.','MARTY: Finally, a nice call. I don\'t know what to do with it.','MARTY: Stay off the bridges at rush hour. Stay off them always, really.'];
const ADS=['AD: Gridlock Savings Bank. Now with 40% fewer robberies!','AD: Blue Plate Diner. Pie so good you\'ll forget the health inspection.','AD: Iron Works Gym. Lift heavy. Get heavier.',
  'AD: Lucky Pawn. We buy anything. We ask nothing.','AD: Pizza Paolo\'s. Hot in thirty minutes or we stop answering the phone.','AD: Gridlock Motors. Cash only. No questions. Great financing.','AD: Pipsqueak. The car that parks in your pocket.'];
let radioTextT=8,talkI=0;
// the talk station speaks, using the browser's own text-to-speech: the host and the callers get different voices
function talkSay(line){try{const ss=window.speechSynthesis;if(!ss||muted)return;ss.cancel();const i=line.indexOf(': '),who=line.slice(0,i),txt=line.slice(i+2);
  const u=new SpeechSynthesisUtterance(txt);const host=/MARTY/.test(who);u.pitch=host?0.8:1.35;u.rate=host?1.08:1.15;u.volume=0.8;
  const vs=ss.getVoices().filter(v=>/^en/i.test(v.lang));if(vs.length)u.voice=vs[(host?0:3)%vs.length];ss.speak(u);}catch(_){}}
function talkStop(){try{if(window.speechSynthesis)window.speechSynthesis.cancel();}catch(_){}}
let talkWas=false;function updateRadioText(dt){const st=RADIO[radio.st],talking=!!(player.car&&game.state==='play'&&!game.paused&&!muted&&st&&st.kind==='talk');if(talkWas&&!talking)talkStop();if(talking&&!talkWas)radioTextT=0.3;talkWas=talking;
  if(!player.car||game.state!=='play')return;if(!st||st.kind==='off')return;radioTextT-=dt;if(radioTextT>0)return;
  if(st.kind==='talk'){const line=TALK[talkI++%TALK.length];radioBanner={text:st.name,sub:line,t:5.5};radioTextT=6;talkSay(line);}
  else{radioBanner={text:st.name,sub:pick(ADS),t:5};radioTextT=rr(40,70);}}
function radioMsg(t){RADIOLOG.push({t,life:6});if(RADIOLOG.length>3)RADIOLOG.shift();}
function areaName(){const o=player.car||player,d=districtAt(o.x,o.y);if(d)return d.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());const z=zoneOf(o.x,o.y);return z>=0?GANGS[z].name+' turf':'downtown';}
function updateRadioChatter(dt){for(let i=RADIOLOG.length-1;i>=0;i--){RADIOLOG[i].life-=dt;if(RADIOLOG[i].life<=0)RADIOLOG.splice(i,1);}
  const s=stars(),o=player.car||player;
  if(s>lastStars){radioMsg('DISPATCH: '+['','One','Two','Three','Four','Five','Six'][s]+'-star suspect near '+areaName()+(player.car?', driving a '+player.car.t.name:', on foot')+'.');}
  if(s===0&&lastStars>0)radioMsg('DISPATCH: All units stand down. Suspect lost.');lastStars=s;
  if(s>0){const seen=seenT<1.2;if(seen&&!wasSeen)radioMsg('DISPATCH: Eyes on the suspect near '+areaName()+'!');if(!seen&&wasSeen)radioMsg('DISPATCH: We lost visual. Search the area.');wasSeen=seen;}
  newsT-=dt;if(newsT<=0&&s===0){newsT=rr(70,140);radioMsg(pick(['NEWS: Traffic is backed up on the Gridlock Bridge again.','NEWS: Mayor promises more cops downtown. Again.','NEWS: Gang tension rising between the Red Sabres and Chrome Saints.','NEWS: Times Square screens hacked to show cat videos.','NEWS: East River declared "mostly swimmable".','WEATHER: '+(rain>0.3?'Storms rolling through the city tonight.':'Clear skies over Gridlock City.')]));}}
function drawRadioLog(sc){{const ms=Math.round((touchMode?118:150)*sc),x=(touchMode?12:16)*sc+ms/2,y=touchMode?12*sc+ms+14*sc:VH-ms-16*sc-12*sc,mins=Math.floor(((clock%1)+1)%1*1440),hh=Math.floor(mins/60),mm=mins%60;
  if(!touchMode&&rain>0.3)hudText(SEASON()==='winter'?'❄ snow':'☂ rain',x,y,Math.round(13*sc),'#ddd','center',`600 ${Math.round(13*sc)}px system-ui`);}let y=(touchMode?150:56)*sc+(PAGER&&!touchMode&&!(mission||job||fare||sideJob||roofRun)?34*sc:0);for(const m of RADIOLOG){ctx.globalAlpha=Math.min(1,m.life);hudText(m.t,18*sc,y,Math.round(13*sc),m.t.startsWith('DISPATCH')?'#9fd0ff':'#ffe9a8','left',`600 ${Math.round(13*sc)}px system-ui`);y+=18*sc;}ctx.globalAlpha=1;
  if(drill){const w=200*sc,x=VW/2-w/2,yy=VH*0.68;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x,yy,w,12*sc);ctx.fillStyle='#ffd600';ctx.fillRect(x+2,yy+2,(w-4)*clamp(drill.t/9,0,1),12*sc-4);hudText('CRACKING THE VAULT',VW/2,yy-12*sc,Math.round(14*sc),'#ffe9a8','center');}}
function extTick6(dt){updateRobbery(dt);updateRadioChatter(dt);}


// ---------- turf wars: take blocks from the gangs, earn from them, defend them ----------
const TURF={},TURFK={};let turfPayT=120,turfWave=null,turfWaveT=160;
const blockOf=(x,y)=>Math.floor(y/T/P)*NB+Math.floor(x/T/P);
function turfKill(p){if(p.gang==null||game.state!=='play')return;const bi=blockOf(p.x,p.y),bx=bi%NB,by=Math.floor(bi/NB);if(TURF[bi]||zoneOf((bx*P+9)*T,(by*P+9)*T)!==p.gang)return;
  const k=TURFK[bi]=TURFK[bi]&&game.t-TURFK[bi].t<60?{n:TURFK[bi].n+1,t:TURFK[bi].t}:{n:1,t:game.t};
  if(k.n===3)note('Two more '+GANGS[p.gang].name+' and this block is yours');
  if(k.n>=5){TURF[bi]={g:p.gang};delete TURFK[bi];addMoney(1000);addRespect(p.gang,-1);sfx('pass');showBig('TURF TAKEN','This block pays you now  ·  +$1,000','#c07cff',2.6);radioMsg('NEWS: A new crew is taking over '+GANGS[p.gang].name+' streets.');}}
function updateTurf(dt){const owned=Object.keys(TURF);
  turfPayT-=dt;if(turfPayT<=0){turfPayT=120;if(owned.length){const pay=owned.length*60;addMoney(pay);note('Turf income: +$'+pay+' from '+owned.length+' block'+(owned.length>1?'s':''));}}
  if(turfWave){turfWave.t-=dt;const left=turfWave.list.filter(q=>!q.gone).length;
    if(!left){note('Turf defended!');addMoney(300);turfWave=null;}
    else if(turfWave.t<=0){delete TURF[turfWave.bi];note(GANGS[turfWave.g].name+' took their block back');for(const q of turfWave.list)q.target=false;turfWave=null;}}
  else if(owned.length&&!mission&&game.state==='play'){turfWaveT-=dt;if(turfWaveT<=0){turfWaveT=rr(150,240);const bi=+pick(owned),bx=bi%NB,by=Math.floor(bi/NB),cx=(bx*P+9)*T,cy=(by*P+9)*T;
      if(dist2(cx,cy,player.x,player.y)>1400*1400)return;const g=TURF[bi].g,list=[];for(let i=0;i<4;i++){const q=walkNear(cx,cy,200),e=makePed(q.x,q.y,false);makeGang(e,g);e.angry=999;e.target=true;e.hp=50;pedPickNext(e);list.push(e);}
      turfWave={bi,g,list,t:90};showBig('TURF UNDER ATTACK',GANGS[g].name+' want their block back','#c07cff',2.4);}}}
// ---------- stunt trials at the construction site ----------
const STUNT=(()=>{const s={x:LM.site.x-80,y:LM.site.y+150};SIGNS.push({x:s.x,y:s.y,text:'STUNT TRIAL',bg:'#ffc21a',fg:'#111111',h:36,on:()=>true});return s;})();
let stuntCool=0,stuntLevel=0;
function updateStunt(dt){stuntCool-=dt;const c=player.car;if(stuntCool>0||!c||c.t.boat||c.t.heli||mission||DLG.open||game.state!=='play'||dist2(STUNT.x,STUNT.y,c.x,c.y)>70*70||hyp(c.vx,c.vy)>60)return;stuntCool=6;
  const need=[0.7,0.9,1.1].map(a=>+(a+stuntLevel*0.1).toFixed(1));
  say([['Stunt Trial','Land three jumps, each one bigger: '+need.join(' s, ')+' s of air. Any ramp in the city counts.']],null,[['GO',()=>{runMission({title:'Stunt Trial',stunt:true,steps:need.map((a,i)=>({k:'jump',air:a,timer:i?90:120,desc:'Jump '+(i+1)+' of 3: stay airborne '+a+' s'}))},{sub:'Level '+(stuntLevel+1)});}],['NOT NOW',()=>{},'no']]);}
function extTick7(dt){updateTurf(dt);updateStunt(dt);}

// ---------- motorcycles ----------
CT.bike={name:'Shredder',L:30,Wd:11,max:640,acc:600,grip:9.5,turn:3.5,hp:60,mass:0.45,cols:['#d8382a','#151515','#2a7ae0','#f0c020','#e0e0e0'],bike:true};
// thrown off on a hard crash
function bikeCrash(c,imp){if(c!==player.car||!c.t.bike||imp<230||game.state!=='play')return;const vx=c.vx,vy=c.vy;exitCar(true);player.vx=vx*0.4;player.vy=vy*0.4;player.jz=6;player.jv=140;hurtPlayer(12);showBig('BAILED!','','#ff9a2e',1);}
// ---------- melee: a baseball bat ----------
WEAPONS.push({name:'Baseball Bat',rate:.55,dmg:0,spd:0,spread:0,kind:'x',cdmg:0,kick:0});
// grenades (GTA III): thrown like a Molotov, but they blow up where they land
WEAPONS.push({name:'Grenades',rate:.9,dmg:0,spd:430,spread:.03,kind:'m',gren:true,cdmg:0,kick:0});
const GRENIDX=()=>WEAPONS.findIndex(w=>w.gren);
// fists (GTA III): always with you, switch to them with Q
WEAPONS.push({name:'Fists',rate:.38,dmg:0,spd:0,spread:0,kind:'x',fist:true,cdmg:0,kick:0});
// GTA III's long guns: hold right mouse (or the lock-on button) to look down the scope in first person
WEAPONS.push({name:'Sniper Rifle',rate:1.25,dmg:150,spd:2600,spread:0,kind:'b',cdmg:30,kick:6,scope:4,sniper:true,range:0.95});
WEAPONS.push({name:'Assault Rifle',rate:.1,dmg:24,spd:1400,spread:.035,kind:'b',cdmg:6,kick:1.8,scope:1.7,range:0.8});
const WIDX=n=>WEAPONS.findIndex(w=>w.name===n);
const BAT=WEAPONS.findIndex(w=>w.kind==='x');
function meleeSwing(){const ca=Math.cos(player.a),sa=Math.sin(player.a),fist=!!WEAPONS[player.w].fist;sfx('door',fist?0.3:0.5);let hit=false;
  for(const p of peds){if(p.gone)continue;const dx=p.x-player.x,dy=p.y-player.y,f=dx*ca+dy*sa,l=Math.abs(-dx*sa+dy*ca);if(f<0||f>34||l>18)continue;hit=true;
    p.hp-=fist?14:40;p.flash=0.1;p.stagger=fist?0.35:0.5;hitMarks.push({x:p.x,y:p.y,t:0.18,kill:p.hp<=0});
    if(p.hp<=0)killPed(p,'player',ca*160,sa*160);else{p.x+=ca*10;p.y+=sa*10;if(p.cop)crime(0,1);else if(p.gang!=null)p.angry=12;else if(p.brawl>0||(!p.target&&!p.fare&&!p.injured&&R()<0.35))startBrawl(p,8);else{p.state='flee';p.panic=6;p.fx=player.x;p.fy=player.y;}}}
  for(const c of cars){if(c.wreck||c===player.car)continue;const dx=c.x-player.x,dy=c.y-player.y;if(dx*ca+dy*sa<0||hyp(dx,dy)>c.t.L/2+16)continue;damageCar(c,fist?2:8,'player');hit=true;}
  if(hit){sfx('hit');shake=Math.max(shake,2);}}
// ---------- cheats: type them during play (or enter them in the pause menu) ----------
const CHEATS={
  GUNSGUNSGUNS:()=>{for(let i=1;i<WEAPONS.length;i++)player.ammo[i]=i===BAT?Infinity:Math.max(player.ammo[i]||0,i===5||i===4||WEAPONS[i].gren?20:300);return 'All weapons';},
  HEALME:()=>{player.hp=PMAX();player.armor=100;if(player.car)player.car.hp=player.car.t.hp;return 'Health and armor';},
  LEAVEMEALONE:()=>{clearHeat();return 'Wanted level cleared';},
  MOREPOLICE:()=>{crime(0,Math.min(6,stars()+2));return 'More police';},
  CASHMONEY:()=>{addMoney(10000);return '+$10,000';},
  GIVEMETANK:()=>{spawnNear('tank');return 'Tank delivered';},
  FLYBOY:()=>{const c=spawnNear('heli');if(c)c.alt=0;return 'Helicopter delivered';},
  RAINYDAY:()=>{rainTarget=1;rain=0.9;weatherT=120;return 'Storm';},
  SUNNYDAY:()=>{rainTarget=0;rain=0;FOGK=0;fogTarget=0;return 'Clear skies';},
  SNOWDAY:()=>{OPT.season='winter';rainTarget=1;rain=0.8;return 'Let it snow';},
  BIGBANG:()=>{for(const c of cars)if(c!==player.car&&!c.wreck&&dist2(c.x,c.y,player.x,player.y)<400*400){c.hp=0;ignite(c,null);}return 'Boom';},
  NIGHTOWL:()=>{clock=0.95;return 'Midnight';},EARLYBIRD:()=>{clock=0.3;return 'Morning';},
};
function spawnNear(type){const a=player.a,x=player.x+Math.cos(a)*70,y=player.y+Math.sin(a)*70;if(solidPx(x,y))return null;return makeCar(type,x,y,a);}
function tryCheat(code){code=String(code).toUpperCase().replace(/[^A-Z]/g,'');const f=CHEATS[code];if(!f)return false;const r=f();showBig('CHEAT ACTIVATED',r,'#7dff8a',2);sfx('pass');STATS.cheats=(STATS.cheats||0)+1;return true;}
let cheatBuf='';
window.addEventListener('keydown',e=>{if(!game.started||e.key.length!==1||e.target&&e.target.tagName==='INPUT')return;cheatBuf=(cheatBuf+e.key.toUpperCase()).slice(-16);for(const k in CHEATS)if(cheatBuf.endsWith(k)){cheatBuf='';if(DLG.open)dlgClose();tryCheat(k);break;}},true);
// ---------- GTA-style retry after a failed mission ----------
let RETRY=null;
function offerRetry(m){if(!m||!m.def||m.def===FINALE&&false)return;RETRY={def:m.def,opts:m.opts,g:m.g};}
function updateRetry(){if(!RETRY||DLG.open||mission||game.state!=='play'||game.paused)return;const r=RETRY;RETRY=null;
  say([['','Mission failed. Try again?']],null,[['RETRY',()=>{if(r.opts&&r.opts.race){if(player.car)startRace(r.opts.race);else note('You need a car to race');return;}runMission(r.def,r.opts);mission.g=r.g;}],['NOT NOW',()=>{},'no']]);}
// ---------- new traffic: city buses, limos, ice cream vans ----------
CT.bus={name:'City Bus',L:98,Wd:30,max:330,acc:200,grip:12,turn:1.9,hp:320,mass:3.4,cols:['#d8a020','#2a6ad8','#e0e0e0'],bus:true};
CT.limo={name:'Stretch',L:76,Wd:25,max:420,acc:300,grip:11,turn:2.2,hp:150,mass:1.8,cols:['#111111','#f0f0f0'],limo:true};
CT.icecream={name:'Mr. Whippy',L:56,Wd:26,max:360,acc:260,grip:11,turn:2.6,hp:160,mass:1.9,cols:['#f6c8e0'],icecream:true};
// ---------- more vehicles: pickups, SUVs, muscle cars, station wagons, vans, garbage trucks, roadsters, food trucks ----------
// each one has its own shape (drawVX), handling, and turns up where it belongs: SUVs and roadsters uptown, vans and garbage
// trucks in Old Town, wagons and pickups in the suburbs, taxis and limos downtown
Object.assign(CT,{
  pickup:{name:'Ranchhand',L:56,Wd:25,acc:300,grip:11,turn:2.6,hp:150,mass:1.5,cols:['#8a2a20','#2a4a6a','#d8d2c4','#3a5a2a','#6a5040','#a8a49a','#1c1c1e','#b86a20'],vx:'pickup',roofH:23},
  suv:{name:'Ridgeback',L:58,Wd:27,acc:320,grip:11,turn:2.6,hp:170,mass:1.8,cols:['#1c1c1e','#e8e8e4','#2a3a52','#5a5e62','#4a2a24','#2e4a36','#8a8478'],vx:'suv',roofH:28,twoTone:true},
  muscle:{name:'Bruiser',L:58,Wd:25,acc:560,grip:10,turn:2.9,hp:120,mass:1.2,cols:['#c0281c','#1a1a1c','#e8a020','#2a5ab0','#2e7a3a','#e8e8e2','#6a2a7a'],vx:'muscle',roofH:18},
  wagon:{name:'Homestead',L:58,Wd:24,acc:300,grip:10,turn:2.7,hp:120,mass:1.15,cols:['#7a6a52','#4a5a6a','#8a3a2a','#c8c0a8','#3a4a3a','#6a6e72','#a07a4a'],vx:'wagon',roofH:23,twoTone:true},
  van:{name:'Courier',L:62,Wd:27,acc:280,grip:11,turn:2.5,hp:180,mass:2,cols:['#e8e8e4','#d8d2c4','#2a4a7a','#c8a020','#6a6e72','#8a2a24'],vx:'van',roofH:27},
  garbage:{name:'Trash Hauler',L:82,Wd:30,acc:190,grip:12,turn:2,hp:380,mass:3.6,cols:['#3a6a3a','#2e5a4a','#e8e8e4','#5a6a2a'],vx:'garbage',truck:true,roofH:32},
  roadster:{name:'Breeze',L:46,Wd:22,acc:560,grip:11.5,turn:3.3,hp:80,mass:0.85,cols:['#d02020','#e8c020','#1a1a1c','#2a7ad0','#e8e8e4','#30a060','#e86a20'],vx:'roadster',roofH:11},
  foodtruck:{name:'Taco Truck',L:60,Wd:27,acc:260,grip:11,turn:2.5,hp:170,mass:2,cols:['#e85a2a','#2a9ad0','#e8c020','#7a3ab0','#30a060'],vx:'food',roofH:30},
});
CT.bus.roofH=36;CT.icecream.roofH=30;CT.limo.roofH=21;
// handling in the same GTA2 units as the others (front drive bias, mass, grip and gearing)
Object.assign(HANDLING,{
  pickup:{src:'Pickup',mass:20,fdb:0.3,fmb:0.6,brake:1.8,turnIn:0.2,turnRatio:0.5,res:1.5,hbs:0.3,thrust:0.16,max:0.27,anti:0.9,skid:0.08,g1:0.55,g2:0.72,g3:1.0,g2s:0.115,g3s:0.17,turbo:0},
  suv:{src:'SUV',mass:18,fdb:0.5,fmb:0.55,brake:1.9,turnIn:0.2,turnRatio:0.48,res:1.4,hbs:0.3,thrust:0.165,max:0.29,anti:0.85,skid:0.085,g1:0.55,g2:0.72,g3:1.0,g2s:0.12,g3s:0.18,turbo:0},
  muscle:{src:'Muscle',mass:15,fdb:0,fmb:0.55,brake:1.9,turnIn:0.3,turnRatio:0.38,res:1.0,hbs:0.35,thrust:0.165,max:0.385,anti:1.0,skid:0.1,g1:0.6,g2:0.72,g3:1.0,g2s:0.16,g3s:0.25,turbo:1},
  wagon:{src:'Wagon',mass:16,fdb:0.6,fmb:0.5,brake:1.75,turnIn:0.15,turnRatio:0.45,res:1.3,hbs:0.2,thrust:0.145,max:0.28,anti:1.0,skid:0.085,g1:0.55,g2:0.72,g3:1.0,g2s:0.11,g3s:0.17,turbo:0},
  van:{src:'Van',mass:20,fdb:0.5,fmb:0.6,brake:2.0,turnIn:0.22,turnRatio:0.7,res:1.4,hbs:0.3,thrust:0.16,max:0.24,anti:0.7,skid:0.1,g1:0.6,g2:0.74,g3:1.0,g2s:0.115,g3s:0.17,turbo:0},
  garbage:{src:'Garbage Truck',mass:32,fdb:0.5,fmb:0.7,brake:2.0,turnIn:0.25,turnRatio:0.7,res:2.5,hbs:0.45,thrust:0.19,max:0.16,anti:0.6,skid:0.065,g1:0.545,g2:0.675,g3:1.0,g2s:0.085,g3s:0.11,turbo:0},
  roadster:{src:'Roadster',mass:12,fdb:0.2,fmb:0.45,brake:2.1,turnIn:0.42,turnRatio:0.33,res:1.2,hbs:0.4,thrust:0.145,max:0.38,anti:1.0,skid:0.12,g1:0.6,g2:0.7,g3:1.0,g2s:0.18,g3s:0.27,turbo:0},
  foodtruck:{src:'Food Truck',mass:19,fdb:0.5,fmb:0.6,brake:2.0,turnIn:0.2,turnRatio:0.7,res:1.4,hbs:0.28,thrust:0.155,max:0.22,anti:0.6,skid:0.11,g1:0.62,g2:0.74,g3:1.0,g2s:0.11,g3s:0.16,turbo:0},
  // the big vehicles that used to borrow the sedan's handling
  bus:{src:'Bus',mass:34,fdb:0.5,fmb:0.6,brake:2.0,turnIn:0.25,turnRatio:0.8,res:2.5,hbs:0.4,thrust:0.2,max:0.17,anti:0.5,skid:0.065,g1:0.545,g2:0.675,g3:1.0,g2s:0.085,g3s:0.115,turbo:0},
  limo:{src:'Limo',mass:20,fdb:0.6,fmb:0.5,brake:1.8,turnIn:0.15,turnRatio:0.55,res:1.3,hbs:0.2,thrust:0.16,max:0.29,anti:0.9,skid:0.085,g1:0.55,g2:0.72,g3:1.0,g2s:0.11,g3s:0.17,turbo:0},
  icecream:{src:'Ice Cream Van',mass:19,fdb:0.5,fmb:0.6,brake:2.0,turnIn:0.2,turnRatio:0.7,res:1.4,hbs:0.28,thrust:0.155,max:0.22,anti:0.6,skid:0.11,g1:0.62,g2:0.74,g3:1.0,g2s:0.11,g3s:0.16,turbo:0},
  firetruck:{src:'Fire Truck',mass:30,fdb:0.5,fmb:0.65,brake:2.0,turnIn:0.25,turnRatio:0.7,res:2.2,hbs:0.4,thrust:0.2,max:0.25,anti:0.6,skid:0.08,g1:0.55,g2:0.7,g3:1.0,g2s:0.1,g3s:0.15,turbo:0},
});
for(const k of['pickup','suv','muscle','wagon','van','garbage','roadster','foodtruck','bus','limo','icecream','firetruck'])CT[k].max=HANDLING[k].max*GT*TICK;
Object.assign(FWD_BIAS,{pickup:0,suv:0.3,muscle:0,wagon:0.5,van:0.3,garbage:0,roadster:0,foodtruck:0.3,bus:0,limo:0.2,icecream:0.3,firetruck:0});
// the tow truck: a pickup with a boom; hook the car behind you with a horn tap and drag it anywhere
CT.tow=Object.assign({},CT.pickup,{name:'Wrecker',cols:['#d8a020','#c03020','#e8e8e4','#2a4a7a'],tow:true,hp:200,mass:1.9});
function towHitch(c){const ca=Math.cos(c.a),sa=Math.sin(c.a);return[c.x-ca*(c.t.L/2+6),c.y-sa*(c.t.L/2+6)];}
function towToggle(c){if(c.towing){const o=c.towing;o.towedBy=null;c.towing=null;sfx('door',0.6);note('Dropped the '+o.t.name);return;}
  const [hx,hy]=towHitch(c);let best=null,bd=46;
  for(const o of cars){if(o===c||o.wreck&&o.burn>=0||o.t.boat||o.t.heli||o.t.tank||o.t.bus||o.t.truck||o.towedBy)continue;if(o.driver&&o.driver!=='ai')continue;
    const oa=Math.cos(o.a),ob=Math.sin(o.a);for(const sd of[1,-1]){const ex=o.x+oa*o.t.L/2*sd,ey=o.y+ob*o.t.L/2*sd,d=hyp(ex-hx,ey-hy);if(d<bd){bd=d;best=[o,sd];}}}
  if(!best){note('Back up closer to a car to hook it');return;}
  const [o,sd]=best;if(o.driver==='ai'){ejectDriver(o,true);}o.ai=null;o.traffic=false;o.towedBy=c;o.towEnd=sd;c.towing=o;sfx('door',0.8);note('Hooked the '+o.t.name+'. Tap the horn again to drop it');}
function updateTow(dt){for(const c of cars){const o=c.towing;if(!o)continue;if(cars.indexOf(o)<0||o.wreck&&o.burn<0&&false||(o.driver&&o.driver!=='ai')){c.towing=null;o.towedBy=null;continue;}
  const [hx,hy]=towHitch(c);const want=Math.atan2(hy-o.y,hx-o.x)+(o.towEnd>0?0:PI);const pa=o.a,px=o.x,py=o.y;o.a=lerpAng(o.a,want,Math.min(1,dt*6));
  const oa=Math.cos(o.a)*o.towEnd,ob=Math.sin(o.a)*o.towEnd;o.x=hx-oa*(o.t.L/2+2);o.y=hy-ob*(o.t.L/2+2);
  {const ca=Math.cos(o.a),sa=Math.sin(o.a),hl=o.t.L/2-2,hw=o.t.Wd/2-2;let hit=false;for(const[f,l]of[[1,1],[1,-1],[-1,1],[-1,-1],[0,1],[0,-1]])if(solidPx(o.x+ca*hl*f-sa*hw*l,o.y+sa*hl*f+ca*hw*l)){hit=true;break;}
   if(hit){o.x=px;o.y=py;o.a=pa;o.towStuck=(o.towStuck||0)+dt;c.vx*=0.9;c.vy*=0.9;if(o.towStuck>0.7){c.towing=null;o.towedBy=null;o.towStuck=0;sfx('crash',0.5);note('The tow line snapped');continue;}}else o.towStuck=0;}
  o.vx=c.vx;o.vy=c.vy;o.va=0;
  for(const q of cars){if(q===o||q===c||q.wreck)continue;const dx=q.x-o.x,dy=q.y-o.y,d=hyp(dx,dy);if(d>(o.t.L+q.t.L)/2)continue;if(pointInCar(o,q.x,q.y,q.t.Wd/2)){const k=(d||1);q.vx+=dx/k*120;q.vy+=dy/k*120;damageCar(q,1,'player');}}
  // drag it onto the car crusher to sell it for scrap
  if(c===player.car&&hyp(c.vx,c.vy)<70)for(const cp of crusherPads)if(dist2(cp.x,cp.y,o.x,o.y)<55*55){const pay=Math.round((({compact:250,sedan:350,taxi:350,truck:600,sports:900,police:1200,swat:1500})[o.type]||300)*clamp(0.4+0.6*o.hp/o.t.hp,0.4,1));
    c.towing=null;cars.splice(cars.indexOf(o),1);for(let k=0;k<18;k++)puff(cp.x+rr(-30,30),cp.y+rr(-30,30),rr(-220,220),rr(-220,220),rr(.5,1),rr(3,6),o.col,'debris');sfx('crash');addMoney(pay);showBig('CRUSHED','+$'+pay,'#e8e05a',2);break;}}}
// paint jobs: two-tone roofs, racing stripes, company liveries, cargo in the back of pickups
const LIVERY=[[[214,58,40],'#ffffff'],[[40,110,200],'#ffffff'],[[40,150,80],'#ffffff'],[[240,190,30],'#202020'],[[120,60,150],'#ffffff']];
// which vehicles you meet depends on the part of town
const TMIX={base:['sedan','sedan','sedan','compact','compact','compact','taxi','truck','sports','police','ambulance','bus','bike','bike','pickup','suv','wagon','van','muscle'],
  '-1':['taxi','taxi','taxi','limo','bus','van','suv','sedan','sports','foodtruck','roadster'],
  '0':['van','van','pickup','pickup','garbage','truck','muscle','muscle','compact','wagon','tow'],
  '1':['suv','suv','suv','sports','roadster','roadster','limo','sedan','muscle','taxi'],
  '2':['compact','compact','van','bike','bike','foodtruck','roadster','icecream','sports'],
  res:['wagon','wagon','wagon','suv','suv','pickup','pickup','compact','icecream','garbage','sedan'],
  rare:['firetruck','icecream','limo','garbage','tow']};
function blockKindAt(x,y){const bx=clamp(Math.floor(x/T/P),0,NB-1),by=clamp(Math.floor(y/T/P),0,NB-1);return BLOCKK[by*NB+bx];}
function nearRes(x,y){for(const[dx,dy]of[[0,0],[-T*3,0],[T*3,0],[0,-T*3],[0,T*3]])if(blockKindAt(x+dx,y+dy)==='res')return true;return false;}
function trafficType(x,y){const r=R();if(r<0.03)return pick(TMIX.rare);
  if(nearRes(x,y)&&r<0.6)return pick(TMIX.res);
  const z=zoneOf(x,y);if(r<0.5&&TMIX[String(z)])return pick(TMIX[String(z)]);
  return pick(TMIX.base);}
function parkedType(x,y){if(nearRes(x,y)&&R()<0.5)return pick(['wagon','suv','pickup','compact','sedan']);
  const z=zoneOf(x,y);if(R()<0.35)return pick(z===0?['van','pickup','muscle','compact']:z===1?['suv','sports','roadster','sedan']:z===2?['compact','van','roadster','bike']:['taxi','sedan','suv','van']);
  return pick(['sedan','sedan','compact','compact','sports','truck','taxi','pickup','suv','wagon','van','muscle']);}
// the gangs drive their own kinds of car: Red Sabres muscle, Chrome Saints SUVs, Jade Lotus tuned imports
const GANG_TYPES=[['muscle','muscle','sedan'],['suv','suv','sedan'],['sports','roadster','compact']];
// ---------- traffic pulls over for sirens ----------
function sirenBehind(c){const fx=Math.cos(c.a),fy=Math.sin(c.a);for(const o of cars){if(o===c||o.wreck)continue;
  const on=(o.t.police&&o.ai&&(o.ai.mode==='chase'||o.ai.pursuit))||(o===player.car&&o.t.police&&(heat>0||duty))||(o.t.ambulance&&o.ai&&o.ai.cruise>260)||(o.t.fire&&o.vip)||(o===player.car&&(o.t.ambulance||o.t.fire)&&duty);
  if(!on)continue;const dx=o.x-c.x,dy=o.y-c.y,f=dx*fx+dy*fy;if(f>-15||f<-180)continue;if(Math.abs(-dx*fy+dy*fx)<40)return true;}return false;}
// ---------- bosses call when they have work; the minimap zooms out with speed ----------
let callT=30,MMZ=1;
function updateCalls(dt){callT-=dt;if(callT<=0){callT=150;if(!mission&&stars()===0)for(const b of BOSSES)if(storyAvail(b.g)){pager(b.name.split(' ')[0].replace(/"/g,'')+': got work for you. Come see me ('+b.ini+' on the map).');break;}}
  const sp=player.car?hyp(player.car.vx,player.car.vy):0;MMZ=lerp(MMZ,1+clamp((sp-150)/650,0,0.75),0.03);}
function extTick8(dt){updateRetry();updateCalls(dt);}

// ---------- people talk back: speech bubbles ----------
const SHOUTS={bump:['Hey!','Watch it!','Ow!','Look where you\'re going!','Jerk!'],honk:['Alright, alright!','Relax!','I\'m walking here!','Easy!'],car:['Are you crazy?!','Learn to drive!','Maniac!'],mug:['Help! Thief!','Somebody stop him!'],gun:['He\'s got a gun!','Run!','Don\'t shoot!']};
function shout(p,kind){if(!p||p.gone||p.cop||p.say&&p.say.t>0)return;if(dist2(p.x,p.y,player.x,player.y)>500*500)return;p.say={t:1.8,text:pick(SHOUTS[kind])};}
let shoutT=0;
function updateShouts(dt){shoutT-=dt;for(const p of peds)if(p.say&&p.say.t>0)p.say.t-=dt;
  if(shoutT>0)return;shoutT=0.3;
  // someone you walk into, someone who just jumped out of your way, people near gunfire
  if(!player.car)for(const p of peds){if(p.gone||p.cop)continue;if(dist2(p.x,p.y,player.x,player.y)<16*16&&R()<0.5)shout(p,'bump');}
  else{const c=player.car;if(hyp(c.vx,c.vy)>200)for(const p of peds)if(p.state==='flee'&&p.panic>1.5&&dist2(p.x,p.y,c.x,c.y)<120*120&&R()<0.15)shout(p,'car');}
  if(hornT>0.3&&player.car)for(const p of peds)if(dist2(p.x,p.y,player.car.x,player.car.y)<150*150&&R()<0.2)shout(p,'honk');}
// ---------- car alarms on parked cars ----------
let alarm=null;
function carAlarm(c){if(c.driver||c.t.boat||c.t.heli||R()>0.3)return;alarm={c,t:6};note('Car alarm!');for(const k of cars)if(k.driver==='cop'&&dist2(k.x,k.y,c.x,c.y)<500*500){crime(0,1);break;}}
function updateAlarm(dt){if(!alarm)return;alarm.t-=dt;if(Math.floor(alarm.t*4)!==Math.floor((alarm.t+dt)*4))sfx('ring',0.25);if(alarm.t<=0||player.car!==alarm.c)alarm=null;}
function extTick9(dt){updateShouts(dt);updateAlarm(dt);}

// ---------- landmarks: the stadium and the statue on the Westside beach ----------
if(STADIUM)SIGNS.push({x:STADIUM.x,y:STADIUM.y+150,text:'GRIDLOCK STADIUM',bg:'#1f3f9f',fg:'#ffffff',h:60,on:()=>true});
{let sx=null;for(let bx=0;bx<6;bx++)if(BLOCKK[(NB-1)*NB+bx]==='beach'){sx=bx;break;}const x=((sx==null?2:sx)*P+9)*T,y=((NB-1)*P+7)*T;props.push({x,y,k:'statue',rad:30,ht:130});SIGNS.push({x,y:y-60,text:'STATUE OF GRIDLOCK',bg:'#3a6a5a',fg:'#ffffff',h:24,on:()=>true});}
// ---------- AI horns: drivers honk when you block them ----------
function hornBeep(x,y,pitch){if(!AC||muted)return;const d=hyp(x-player.x,y-player.y);if(d>700)return;try{const g=AC.createGain(),o1=AC.createOscillator(),o2=AC.createOscillator(),t=AC.currentTime,v=0.08*(1-d/700);
  o1.type=o2.type='square';o1.frequency.value=pitch;o2.frequency.value=pitch*1.26;o1.connect(g);o2.connect(g);g.connect(AC.destination);g.gain.setValueAtTime(v,t);g.gain.setTargetAtTime(0,t+0.22,0.03);o1.start(t);o2.start(t);o1.stop(t+0.35);o2.stop(t+0.35);}catch(_){}}
function aiHonk(c,ai,dt,byPlayer){if(!byPlayer){ai.honkW=0;return;}ai.honkW=(ai.honkW||0)+dt;if(ai.honkW>1.2){ai.honkW=-rr(1,2.5);hornBeep(c.x,c.y,c.t.truck||c.t.bus?260:c.t.bike?520:380);if(!player.car)shoutCar(c);}}
function shoutCar(c){if(dist2(c.x,c.y,player.x,player.y)<300*300){c.say={t:1.6,text:pick(['Move it!','Get outta the road!','Come on!','Hey, buddy!'])};}}
// ---------- bus stops: shelters on the sidewalks; buses pull in, people get on and off ----------
const BUSSTOPS=[];
for(let iy=1;iy<NB;iy+=3)for(let ix=0;ix<NB;ix+=2){const ty=iy*P+4,tx=ix*P+8;if(tx>=RIVX0-2&&tx<RIVX1+2)continue;const t=tileAt(tx,ty);if(t!==WALK||nearDiag((tx+.5)*T,(ty+.5)*T,140))continue;
  const s={x:(tx+.5)*T,y:(ty+.5)*T-6,rx:(tx+.5)*T,ry:(iy*P+3.3)*T,wait:0,cool:0};BUSSTOPS.push(s);props.push({x:s.x,y:s.y+4,k:'busstop',a:0,rad:24,ht:30});}
function busNearStop(c){const fx=Math.cos(c.a),fy=Math.sin(c.a);if(Math.abs(fx)<0.9||fx<0)return null;for(const s of BUSSTOPS){const dx=s.rx-c.x,dy=s.ry-c.y,f=dx*fx+dy*fy;if(f>-20&&f<120&&Math.abs(dy)<44&&s.cool<=0)return s;}return null;}
let busT=0;
function updateBusStops(dt){for(const s of BUSSTOPS)s.cool-=dt;busT-=dt;if(busT>0)return;busT=2;
  // a few people waiting at stops near you
  for(const s of BUSSTOPS){if(dist2(s.x,s.y,player.x,player.y)>900*900||camSees(s.x,s.y))continue;const n=peds.filter(p=>p.atStop===s&&!p.gone).length;if(n<2&&R()<0.3){const p=makePed(s.x+rr(-20,20),s.y-rr(6,14),false);p.atStop=s;p.onPhone=999;p.a=PI/2;}}}
function extTick10(dt){updateBusStops(dt);}
// ================= v4.8: CURBSIDE PARKING, GARBAGE ROUTES, TACO SERVICE, FOOD-STAND QUEUES, RADIO BY CAR =================
// ---------- cars parked along the curbs, half up on the sidewalk, filled in around you as you move ----------
// Slots sit mid-block on both sides of every open street. A slot's car appears when you're near and out of sight,
// and is cleared again when you're far away, unless someone has moved or taken it.
const CURB=[];
function buildCurb(){const near=(x,y,r)=>trees.some(t=>Math.abs(t.x-x)<r&&Math.abs(t.y-y)<r)||props.some(o=>Math.abs(o.x-x)<r&&Math.abs(o.y-y)<r&&o.k!=='upole')||streetLights.some(l=>Math.abs(l.x-x)<r&&Math.abs(l.y-y)<r);
  const ok=(x,y,sx,sy)=>{const tx=Math.floor(x/T),ty=Math.floor(y/T),ti=ty*W+tx;if(tx<0||ty<0||tx>=W||ty>=W||map[ti]!==ROAD||DIAGT[ti]||BRT[ti]||RIV[ti])return false;
    const wx=Math.floor((x+sx)/T),wy=Math.floor((y+sy)/T);return map[wy*W+wx]===WALK&&!DIAGT[wy*W+wx];};
  for(let i=0;i<=NB;i++)for(let j=0;j<NB;j++){
    for(const hz of[true,false]){
      // a street segment between two crossings; sides: [curb coordinate, offset of the parked car, heading, sidewalk direction]
      // cars sit 2px off the curb line, which keeps them out of the lane even for a passing bus (see the AI 'blocked' test)
      const sides=hz?[[(i*P)*T,2,PI,-1],[(i*P+4)*T,-2,0,1]]:[[(i*P)*T,2,PI/2,-1],[(i*P+4)*T,-2,-PI/2,1]];
      for(const[cc,off,a,sd]of sides)for(let q=0;q<3;q++){const along=(j*P+5.6+q*2.4)*T,h=hash(i*31+q*7+(hz?1000:0),j*17+(sd>0?5:0));if((h&7)>=5)continue;
        const x=hz?along:cc+off,y=hz?cc+off:along,sx=hz?0:sd*24,sy=hz?sd*24:0;
        if(!ok(x,y,sx,sy)||!ok(x+(hz?26:0),y+(hz?0:26),sx,sy)||!ok(x-(hz?26:0),y-(hz?0:26),sx,sy))continue;
        if(near(x+sx*0.3,y+sy*0.3,30)||props.some(o=>o.k==='busstop'&&hyp(o.x-x,o.y-y)<140))continue;
        CURB.push({x,y,a,car:null,gone:false,h});}}}}
const CURB_TYPES=['sedan','sedan','compact','compact','compact','sports','wagon','taxi','roadster','muscle'];
let curbT=0;
function updateCurb(dt){curbT-=dt;if(curbT>0||game.state!=='play')return;curbT=0.4;if(!CURB.length)buildCurb();
  for(const s of CURB){const d=hyp(s.x-player.x,s.y-player.y);
    if(s.car){const c=s.car;if(cars.indexOf(c)<0||c.driver||c.bought||c.wreck||hyp(c.x-s.x,c.y-s.y)>6){s.car=null;s.gone=true;continue;}
      if(d>1300&&!camSees(s.x,s.y)){cars.splice(cars.indexOf(c),1);s.car=null;}}
    else if(d>1300)s.gone=false;
    else if(!s.gone&&d<820&&d>140&&!camSees(s.x,s.y)&&!carNear(s.x,s.y,40)){s.car=makeCar(CURB_TYPES[s.h%CURB_TYPES.length],s.x,s.y,s.a);s.car.curb=true;}}}
// ---------- side jobs for the Trash Hauler and the Taco Truck (tap the horn to go on duty, like the taxi) ----------
let sideJob=null,trashLevel=0,tacoLevel=0,sideCool=2;
const BINS=[];
function tacoSpots(){const out=[];for(let i=0;i<NB*NB;i++){const k=BLOCKK[i];if(!['plaza','park','cpark','ts','beach','stadium'].includes(k))continue;
  const bx=i%NB,by=Math.floor(i/NB);for(const[ox,oy]of[[9,2.5],[2.5,9]]){const sp=laneSpotNear((bx*P+ox)*T,(by*P+oy)*T);if(sp)out.push({x:sp.x,y:sp.y,name:k==='ts'?'Times Square':k==='beach'?'South Beach':k==='stadium'?'the stadium':k==='cpark'?'Central Park':k==='plaza'?'the plaza':'the park'});}}return out;}
let TACO=null;
function startSideJob(c,k){
  if(k==='trash'){if(!BINS.length)for(const o of props)if(o.k==='bin')BINS.push(o);
    const stops=[];let px=c.x,py=c.y;for(let n=0;n<6;n++){let best=null,bs=1e9;for(const b of BINS){if(stops.includes(b)||!WOK(b.x,b.y))continue;const d=hyp(b.x-px,b.y-py);if(d<260||d>1100)continue;const sc=Math.abs(d-520)+R()*260;if(sc<bs){bs=sc;best=b;}}if(!best)break;stops.push(best);px=best.x;py=best.y;}
    if(stops.length<3){note('No bins out on the street around here');return;}
    sideJob={kind:'trash',car:c,stops,i:0,tgt:stops[0],timer:Math.max(80,150-trashLevel*8),hold:0,title:'GARBAGE ROUTE'};note('Garbage route: empty '+stops.length+' bins. Stop next to each one');}
  else{if(!TACO)TACO=tacoSpots();const cand=TACO.filter(t=>{const d=hyp(t.x-c.x,t.y-c.y);return d>500&&d<2200&&WOK(t.x,t.y);});if(!cand.length){note('Nobody hungry around here');return;}
    const t=pick(cand);sideJob={kind:'taco',car:c,tgt:t,stop:0,stops:3,timer:Math.max(70,110-tacoLevel*6),serve:0,sold:0,title:'TACO SERVICE'};note('Hungry crowd at '+t.name+'. Park there to serve');}
  sfx('pickup',0.5);}
function updateSideJob(dt){const c=player.car,k=dutyKind(c);
  if(!sideJob){if(c&&duty&&(k==='trash'||k==='taco')&&!mission&&stars()===0){sideCool-=dt;if(sideCool<=0){sideCool=3;startSideJob(c,k);}}return;}
  const J=sideJob;if(c!==J.car||!duty||mission){if(c!==J.car)showBig(J.kind==='trash'?'ROUTE ABANDONED':'SHIFT OVER','You left the truck','#ff4040',2);sideJob=null;sideCool=4;return;}
  J.timer-=dt;if(J.timer<=0){showBig('OUT OF TIME','','#ff4040',2);sfx('fail');sideJob=null;sideCool=6;return;}
  const d=hyp(c.x-J.tgt.x,c.y-J.tgt.y),sp=hyp(c.vx,c.vy);
  if(J.kind==='trash'){if(d<115&&sp<45){J.hold+=dt;if(J.hold>1.2){J.hold=0;const pay=40+10*trashLevel;addMoney(pay);sfx('crash',0.25);for(let i=0;i<6;i++)puff(J.tgt.x+rr(-8,8),J.tgt.y+rr(-8,8),rr(-20,20),rr(-20,20),0.8,rr(4,7),'#9a8a6a','smoke');
        J.i++;if(J.i>=J.stops.length){trashLevel++;const b=150+trashLevel*120;addMoney(b);sfx('pass');showBig('ROUTE COMPLETE','+$'+b+'  ·  level '+trashLevel,'#7dff8a',2.4);sideJob=null;sideCool=8;return;}
        J.tgt=J.stops[J.i];J.timer+=12;note('Bin emptied +$'+pay+' · '+J.i+'/'+J.stops.length);}}else J.hold=0;}
  else{if(d<100&&sp<25){J.serve+=dt;if(J.serve>2.2){J.serve=0;J.sold++;const pay=12+4*tacoLevel;addMoney(pay);sfx('pickup',0.3);
        if(J.sold%4===0){J.stop++;if(J.stop>=J.stops){tacoLevel++;const b=120+tacoLevel*100;addMoney(b);sfx('pass');showBig('SOLD OUT','+$'+b+'  ·  '+J.sold+' tacos  ·  level '+tacoLevel,'#ffb03a',2.4);sideJob=null;sideCool=8;return;}
          const cand=TACO.filter(t=>t!==J.tgt&&hyp(t.x-c.x,t.y-c.y)>500&&hyp(t.x-c.x,t.y-c.y)<2200);J.tgt=cand.length?pick(cand):J.tgt;J.timer+=25;note('Crowd thinning out. Next: '+J.tgt.name);}}}}}
function sideJobHUD(sc,ly){const J=sideJob;hudText(J.title+(J.kind==='trash'?'  ·  BIN '+(J.i+1)+' / '+J.stops.length:'  ·  '+J.sold+' SOLD'),18*sc,ly+12*sc,Math.round(16*sc),J.kind==='trash'?'#7dff8a':'#ffb03a','left');
  const tm=Math.max(0,Math.ceil(J.timer));hudText(Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0')+'   level '+((J.kind==='trash'?trashLevel:tacoLevel)+1),18*sc,ly+40*sc,Math.round(22*sc),tm<=10&&Math.floor(game.t*4)%2?'#ff4040':'#fff','left');}
// ---------- people queue up at hot dog carts and parked food trucks ----------
let queueT=0;const STANDS=[];
function updateQueues(dt){queueT-=dt;if(queueT>0||game.state!=='play')return;queueT=0.8;if(!STANDS.length)for(const o of props)if(o.k==='hotdog')STANDS.push(o);
  const near=[];for(const o of STANDS)if(dist2(o.x,o.y,player.x,player.y)<700*700)near.push({o,ax:Math.cos(o.a||0),ay:Math.sin(o.a||0),w:12});
  for(const c of cars)if(c.type==='foodtruck'&&!c.wreck&&hyp(c.vx,c.vy)<5&&dist2(c.x,c.y,player.x,player.y)<700*700){const ca=Math.cos(c.a),sa=Math.sin(c.a),sd=c.curbSide||1;
    near.push({o:c,x0:c.x-ca*c.t.L*0.14-sa*sd*(c.t.Wd/2+12),y0:c.y-sa*c.t.L*0.14+ca*sd*(c.t.Wd/2+12),ax:-sa*sd,ay:ca*sd,w:12,truck:true});}
  const night=clock>0.96||clock<0.25,want=night?1:(sideJob&&sideJob.kind==='taco'?4:3);
  for(const s of near){const q=peds.filter(p=>!p.gone&&p.q&&p.q.st===s.o);if(q.length>=want)continue;
    let pick2=null,bd=1e9;for(const p of peds){if(p.gone||p.cop||p.gang!=null||p.target||p.busker||p.beach||p.state!=='walk'||p.q||p.chat>0||p.goCar)continue;const d=dist2(p.x,p.y,s.o.x,s.o.y);if(d<360*360&&d<bd){bd=d;pick2=p;}}
    if(!pick2)continue;const n=q.length,bx=s.truck?s.x0:s.o.x+s.ax*14,by=s.truck?s.y0:s.o.y+s.ay*14;
    pick2.q={st:s.o,x:bx+s.ax*n*s.w,y:by+s.ay*n*s.w,a:Math.atan2(-s.ay,-s.ax),t:rr(7,16),walk:0};}}
function queueTick(p,dt){const q=p.q;if(!q)return false;if(p.state!=='walk'||(q.st.wreck)){p.q=null;return false;}
  const dx=q.x-p.x,dy=q.y-p.y,d=hyp(dx,dy);
  if(d>3){q.walk+=dt;if(q.walk>20){p.q=null;return false;}const a=Math.atan2(dy,dx),v=Math.min(55,d*4);p.vx=Math.cos(a)*v;p.vy=Math.sin(a)*v;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a=a;p.moving=true;p.anim+=dt*9;return true;}
  p.vx=p.vy=0;p.moving=false;p.a=q.a;q.t-=dt;if(R()<dt*0.4)p.anim+=1;if(q.t<=0){p.q=null;p.a+=PI;}return true;}
// ---------- the radio picks a station that suits the car (and remembers it per car) ----------
function stationFor(c){const t=c.type;if(c.t.police||c.t.ambulance||c.t.fire||c.t.army||t==='bus'||t==='garbage')return RADIO.length-1;
  if(c.gang!=null)return c.gang%(RADIO.length-1);
  const pref={muscle:0,pickup:0,truck:0,bike:0,sports:1,roadster:1,limo:1,suv:1,icecream:1,compact:2,van:2,sedan:2,taxi:2,wagon:2,foodtruck:2}[t];
  return pref!=null&&R()<0.75?pref:Math.floor(R()*(RADIO.length-1));}
// ---------- rooftop stashes: duffel bags of cash on roofs you can only reach by climbing ----------
function updateStash(){if(player.car||game.state!=='play')return;for(const k of STASH){if(k.got||Math.abs(k.x-player.x)>22||Math.abs(k.y-player.y)>22||Math.abs((player.jz||0)-k.z)>14)continue;
  k.got=true;const n=STASH.filter(q=>q.got).length,pay=300+n*50;addMoney(pay);sfx('pickup');
  if(n===STASH.length){addMoney(8000);showBig('ALL STASHES','+$8,000 bonus','#ffd600',3);}else showBig('ROOFTOP STASH','+$'+pay+'  ·  '+n+' / '+STASH.length,'#9fe06a',2);}}
// ================= v4.11: YOUR CREW =================
// Take turf and your own crew (in purple) starts hanging out on your blocks. Gangs that love you (respect 3+) count as
// allies. Allies near you shoot it out with the cops and with rival gangs, your turf hides you from the police, and you
// can recruit up to three of them (T, or CREW on a phone) to follow you. They ride in your car's spare seats and lean
// out to shoot at whatever is after you; any that don't fit wait where you left them.
const CREW_COL='#9a5ad8',FOLLOW=[];let crewSpawnT=0,crewTickT=0;
function seatsOf(c){const t=c.t,k=c.type;if(!c||t.tank)return 0;if(t.bus)return 3;if(t.bike||t.heli)return 1;if(t.boat)return 2;
  if(['sports','roadster','muscle','compact','truck','garbage','ambulance','icecream','foodtruck','firetruck','armytruck','fbi'].includes(k))return 1;
  if(k==='pickup'||k==='van')return 2;return 3;}
function makeCrew(p,bi){p.crew=true;p.gang=null;p.col=CREW_COL;p.hp=CREWUP.armor?110:60;p.home=bi;p.state='walk';p.shootT=rr(.3,.8);p.hair=pick(['#222','#3a2a1a','#111']);
  const bx=bi%NB,by=Math.floor(bi/NB);p.homeX=(bx*P+9)*T;p.homeY=(by*P+9)*T;}
const isAlly=p=>!!p&&!p.gone&&(p.crew||p.follow||(p.gang!=null&&respect[p.gang]>=3&&!(p.angry>0)));
function crewHostile(q){if(q.gone||q.injured||q.crew||q.follow)return false;
  return(q.cop&&q.state==='cop'&&stars()>0)||(q.gang!=null&&!isAlly(q)&&(q.angry>0||respect[q.gang]<=-2))||(q.target&&!q.cop&&q.gang==null&&!q.busker&&!q.boss&&!!mission)||(q.thief&&q.state==='flee');}
function crewTarget(x,y,r){let best=null,bd=r*r;
  for(const q of peds){if(!crewHostile(q))continue;const d=dist2(q.x,q.y,x,y);if(d<bd&&los(x,y,q.x,q.y)){bd=d;best=q;}}
  if(stars()>0)for(const c of cars){if(c.wreck||c.driver!=='cop'||c===player.car)continue;const d=dist2(c.x,c.y,x,y);if(d<bd&&los(x,y,c.x,c.y)){bd=d;best=c;}}
  return best;}
function crewShoot(p,tg,dt){p.gun=true;const d=hyp(tg.x-p.x,tg.y-p.y),a=Math.atan2(tg.y-p.y,tg.x-p.x);p.a=lerpAng(p.a,a,0.3);
  let sp=d>230?140:d<80?-50:0;if(p.follow&&hyp(player.x-p.x,player.y-p.y)>240)sp=0;
  p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp;p.moving=sp!==0;p.anim+=dt*20;p.x+=p.vx*dt;p.y+=p.vy*dt;circleTiles(p,6);
  p.shootT-=dt;if(p.shootT<=0){p.shootT=rr(.55,1.05)*(CREWUP.guns&&(p.crew||p.follow)?0.6:1);const aa=a+rr(-0.08,0.08)*(sp!==0?1.6:1); // your crew can actually shoot
    fireBullet(p.x+Math.cos(aa)*12,p.y+Math.sin(aa)*12,aa,850,'crew',CREWUP.guns?12:9,'b',6);
    sfx('shot',nearPlayer(p.x,p.y,600)?0.4:0.12);puff(p.x+Math.cos(aa)*14,p.y+Math.sin(aa)*14,0,0,0.06,9,'#fff2a8','flash');if(tg.cop)tg.foe=p;}}
// one crew member's (or ally's) turn: fight, follow you, or hang out on the home block. Returns true when it moved them.
function crewTick(p,dt){if(p.state==='flee'){p.state='walk';p.panic=0;}
  p.scanT=(p.scanT||0)-dt;if(p.scanT<=0){p.scanT=0.4;p.foe=game.state==='play'?crewTarget(p.x,p.y,p.follow?360:300):null;}
  const f=p.foe;if(f&&(f.gone||f.wreck||(f.cop&&stars()===0)||(f.ai&&f.driver!=='cop'&&!f.gang)))p.foe=null;
  if(p.foe){crewShoot(p,p.foe,dt);return true;}
  p.gun=false;
  if(p.follow){if(player.car||p.wait){p.vx=p.vy=0;p.moving=false;if(!player.car&&hyp(player.x-p.x,player.y-p.y)<420)p.wait=false;return true;}
    // walk in a loose wedge at your sides (not straight behind you, where they'd block the camera)
    const k=Math.max(0,FOLLOW.indexOf(p)),SL=[[-8,-30],[-8,30],[-30,-54]][k%3],ca=Math.cos(player.body),sa=Math.sin(player.body),
      gx=player.x+ca*SL[0]-sa*SL[1],gy=player.y+sa*SL[0]+ca*SL[1],d=hyp(gx-p.x,gy-p.y),far=hyp(player.x-p.x,player.y-p.y);
    if(d>10){const sp=far>200?185:d>60?165:Math.max(60,hyp(player.vx,player.vy)+30),a=Math.atan2(gy-p.y,gx-p.x);p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp;p.a=lerpAng(p.a,a,Math.min(1,dt*10));
      p.x+=p.vx*dt;p.y+=p.vy*dt;circleTiles(p,6);p.moving=true;p.anim+=dt*sp*0.18;}
    else{p.vx=p.vy=0;p.moving=false;p.a=lerpAng(p.a,player.a,Math.min(1,dt*4));}
    return true;}
  if(p.crew&&p.homeX!=null){if(dist2(p.x,p.y,p.homeX,p.homeY)>190*190){const a=Math.atan2(p.homeY-p.y,p.homeX-p.x);p.vx=Math.cos(a)*50;p.vy=Math.sin(a)*50;p.a=a;p.x+=p.vx*dt;p.y+=p.vy*dt;circleTiles(p,6);p.moving=true;p.anim+=dt*9;return true;}
    // hanging out: mostly standing around, now and then a few steps
    p.idleT=(p.idleT||0)-dt;if(p.idleT<=0){p.idleT=rr(2,6);p.idleA=R()<0.4?R()*TAU:null;}
    if(p.idleA!=null&&p.idleT>1.2){p.vx=Math.cos(p.idleA)*30;p.vy=Math.sin(p.idleA)*30;p.a=p.idleA;p.x+=p.vx*dt;p.y+=p.vy*dt;circleTiles(p,6);p.moving=true;p.anim+=dt*6;}
    else{p.vx=p.vy=0;p.moving=false;}return true;}
  return false;}
// recruit (or send home) the nearest crew member or friendly gang member
function recruitNear(){if(player.car||game.state!=='play')return;let best=null,bd=80*80;
  for(const p of peds){if(p.gone||!isAlly(p))continue;const d=dist2(p.x,p.y,player.x,player.y);if(d<bd){bd=d;best=p;}}
  if(!best){note(TURF&&Object.keys(TURF).length?'Walk up to one of your crew (purple) to recruit them':'Take some turf, or win a gang over, to have a crew');return;}
  if(best.follow){best.follow=false;best.wait=false;FOLLOW.splice(FOLLOW.indexOf(best),1);if(best.crew&&best.home!=null){const bx=best.home%NB,by=Math.floor(best.home/NB);best.homeX=(bx*P+9)*T;best.homeY=(by*P+9)*T;}note('Sent home. Crew: '+FOLLOW.length+'/3');return;}
  if(FOLLOW.length>=crewMax()){note('Your crew is full ('+crewMax()+'). Press T next to one to send them home');return;}
  best.follow=true;best.wait=false;best.state='walk';FOLLOW.push(best);sfx('pickup',0.4);
  best.say={text:pick(['Let\'s ride.','I got you.','Where we going?','Say less.']),t:2};
  note((best.crew?'Crew member':GANGS[best.gang].name+' member')+' is with you  ·  '+FOLLOW.length+'/'+crewMax());}
function seatCrew(c){let free=seatsOf(c),n=0;for(const p of FOLLOW){if(p.seated)continue;if(free>0&&hyp(p.x-c.x,p.y-c.y)<300){p.seated=c;p.gone=true;p.wait=false;free--;n++;}else p.wait=true;}
  const left=FOLLOW.filter(p=>!p.seated).length;if(n||left)note((n?n+' crew in the car':'')+(n&&left?' · ':'')+(left?left+' waiting here (no seats)':''));}
function unseatCrew(c){let i=0;const ca=Math.cos(c.a),sa=Math.sin(c.a);for(const p of FOLLOW){if(p.seated!==c)continue;const sd=i%2?1:-1,f=(Math.floor(i/2)-0.5)*14;i++;
  p.x=c.x+ca*f-sa*sd*(c.t.Wd/2+10);p.y=c.y+sa*f+ca*sd*(c.t.Wd/2+10);p.seated=null;p.gone=false;p.vx=p.vy=0;p.state='walk';p.scanT=0;if(peds.indexOf(p)<0)peds.push(p);}}
function crewReset(){for(const p of FOLLOW){p.follow=false;p.seated=null;}FOLLOW.length=0;}
function callBackup(){if(!Object.keys(TURF).length){note('You need turf before you have a crew to call');return false;}if(FOLLOW.length>=crewMax()){note('Your crew is already with you');return false;}
  let n=0;for(let i=0;i<20&&FOLLOW.length<crewMax();i++){const a=R()*TAU,d=rr(220,320),x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d,t=tileAt(Math.floor(x/T),Math.floor(y/T));
    if(t!==WALK&&t!==ROAD&&t!==LOT&&t!==GRASS||camSees(x,y))continue;const p=makePed(x,y,false);makeCrew(p,+pick(Object.keys(TURF)));p.follow=true;p.homeX=null;FOLLOW.push(p);n++;}
  if(n){note(n+' of your crew are on their way');sfx('ring',0.4);return true;}note('Nobody can reach you here');return false;}
function updateCrew(dt){
  // tidy the follower list
  for(let i=FOLLOW.length-1;i>=0;i--){const p=FOLLOW[i];if(p.seated)continue;if(p.gone||!p.follow||p.hp<=0||peds.indexOf(p)<0){if(peds.indexOf(p)<0&&!p.gone)note('A crew member got left behind');if(p.gone&&!p.seated&&p.hp<=0)note('You lost a crew member');p.follow=false;FOLLOW.splice(i,1);}}
  for(const p of FOLLOW)if(p.seated&&(p.seated!==player.car||p.seated.wreck))unseatCrew(p.seated);
  // passengers lean out and shoot at whatever is after you
  const c=player.car;if(c&&game.state==='play')for(const p of FOLLOW){if(p.seated!==c)continue;p.shootT=(p.shootT||0)-dt;if(p.shootT>0)continue;p.shootT=rr(.65,1.2);
    const tg=crewTarget(c.x,c.y,340);if(!tg)continue;const a=Math.atan2(tg.y-c.y,tg.x-c.x),aa=a+rr(-0.12,0.12);
    fireBullet(c.x+Math.cos(aa)*(c.t.Wd/2+8),c.y+Math.sin(aa)*(c.t.Wd/2+8),aa,850,'crew',9,'b',6,0,c.vx,c.vy);sfx('shot',0.35);puff(c.x+Math.cos(aa)*(c.t.Wd/2+10),c.y+Math.sin(aa)*(c.t.Wd/2+10),0,0,0.06,9,'#fff2a8','flash');if(tg.cop)tg.foe=null;}
  // your crew hangs out on your turf
  crewSpawnT-=dt;if(crewSpawnT<=0&&game.state==='play'){crewSpawnT=2;
    for(const k in TURF){const bi=+k,bx=bi%NB,by=Math.floor(bi/NB),cx=(bx*P+9)*T,cy=(by*P+9)*T;if(dist2(cx,cy,player.x,player.y)>1100*1100)continue;
      if(peds.filter(q=>!q.gone&&q.crew&&q.home===bi&&!q.follow).length>=3)continue;const q=walkNear(cx,cy,200);if(camSees(q.x,q.y))continue;makeCrew(makePed(q.x,q.y,false),bi);}}}
// ================= v4.12: WAYPOINTS, MISSION REPLAY, GANG WARS, CREW UPGRADES, REPUTATION, TURF PRESSURE, POLICE =================
// ---------- your own waypoint: click or tap the big map (TAB) to set it, again on it to clear it ----------
let WAYPOINT=null,roofRun=null;
function bigMapGeom(){const s=Math.min(VW,VH)*0.92;return{ox:(VW-s)/2,oy:(VH-s)/2,k:s/WPX,s};}
function bigMapTap(sx,sy){const g=bigMapGeom();if(sx<g.ox||sy<g.oy||sx>g.ox+g.s||sy>g.oy+g.s)return false;const x=(sx-g.ox)/g.k,y=(sy-g.oy)/g.k;
  if(WAYPOINT&&hyp(x-WAYPOINT.x,y-WAYPOINT.y)<16/g.k){WAYPOINT=null;note('Waypoint cleared');return true;}WAYPOINT={x,y};sfx('pickup',0.3);note('Waypoint set. Follow the route on the map');return true;}
function updateWaypoint(){if(WAYPOINT&&hyp((player.car||player).x-WAYPOINT.x,(player.car||player).y-WAYPOINT.y)<70){WAYPOINT=null;note('You\'ve arrived');sfx('pass',0.4);}}
function bigMapExtras(P2,icon,kk){
  // turf under pressure blinks orange; gang war block red
  for(const k in TURF){const t=TURF[k];if(!(t.p>0))continue;const bi=+k,[a,b2]=P2((bi%NB)*P*T+4*T,Math.floor(bi/NB)*P*T+4*T);if(t.p>=2&&Math.floor(game.t*2)%2)continue;ctx.strokeStyle=t.p>=2?'#ff7a2a':'#ffb35a';ctx.lineWidth=2;ctx.strokeRect(a,b2,10*T*kk,10*T*kk);}
  if(GWAR){const bi=GWAR.bi,[a,b2]=P2((bi%NB)*P*T+4*T,Math.floor(bi/NB)*P*T+4*T);ctx.fillStyle='rgba(255,40,40,.35)';ctx.fillRect(a,b2,10*T*kk,10*T*kk);}
  if(WAYPOINT){const[a,b2]=P2(WAYPOINT.x,WAYPOINT.y);ctx.fillStyle='#ff4fa8';ctx.beginPath();ctx.moveTo(a,b2);ctx.lineTo(a-7,b2-16);ctx.lineTo(a+7,b2-16);ctx.closePath();ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.stroke();}
  ctx.font='600 12px system-ui';ctx.fillStyle='#ddd';ctx.textAlign='center';const g=bigMapGeom();ctx.fillText(touchMode?'Tap the map to set a waypoint · tap outside to close':'Click to set a waypoint · TAB to close',VW/2,g.oy+g.s+14);}
// ---------- replay finished story missions from the pause menu ----------
function missionsHTML(){let h='<h2>MISSIONS</h2><p class="note">Replay any story mission you\'ve finished, for half the pay. Lose the cops first.</p>';
  CHAPTERS.forEach((ch,g)=>{h+=`<p style="color:${GANGS[g].col};margin:10px 0 2px">${BOSSES[g].name}</p>`;ch.forEach((m,i)=>{const done=i<STORY.prog[g];h+=`<div class="opt"><span>${done?m.title:'<i style="color:#666">locked</i>'}</span>${done?`<button data-rep="${g},${i}">REPLAY</button>`:''}</div>`;});});
  if(STORY.fin)h+=`<div class="opt"><span>${FINALE.title}</span><button data-rep="f">REPLAY</button></div>`;return h;}
function replayMission(key){if(mission||stars()>0||game.state!=='play'){note(stars()>0?'Lose the cops first':'Finish what you\'re doing first');return;}
  const def=key==='f'?FINALE:CHAPTERS[+key.split(',')[0]][+key.split(',')[1]],g=key==='f'?0:+key.split(',')[0];togglePause();runMission(def,{sub:'Replay',replay:true});mission.g=g;mission.gang=-1;}
// ---------- gang wars: start one on a rival block (phone), hold out against three waves ----------
let GWAR=null;
function startGangWar(){const bi=blockOf(player.x,player.y),bx=bi%NB,by=Math.floor(bi/NB),z=zoneOf((bx*P+9)*T,(by*P+9)*T);
  if(GWAR||mission){note('You\'re busy');return false;}if(z<0||TURF[bi]||['park','cpark','river','beach','stadium'].includes(BLOCKK[bi])){note('Stand in a rival gang\'s block to start a war');return false;}
  if(respect[z]>=3){note(GANGS[z].name+' are your friends. Lose their respect first');return false;}
  GWAR={bi,g:z,wave:0,waves:3,list:[],t:4,cx:(bx*P+9)*T,cy:(by*P+9)*T};showBig('GANG WAR',GANGS[z].name+' are coming. Hold the block!','#ff4040',2.6);sfx('ring');
  radioMsg('NEWS: Gunfire reported on '+GANGS[z].name+' turf.');return true;}
function updateGangWar(dt){const W2=GWAR;if(!W2)return;
  if(game.state!=='play'||dist2(player.x,player.y,W2.cx,W2.cy)>900*900){showBig('GANG WAR LOST','You left the block','#ff4040',2.4);sfx('fail');for(const q of W2.list)q.target=false;GWAR=null;return;}
  W2.list=W2.list.filter(q=>!q.gone);
  if(W2.list.length){W2.wt=(W2.wt||0)+dt;if(W2.wt>90){showBig('GANG WAR LOST','They held their ground','#ff4040',2.4);sfx('fail');for(const q of W2.list)q.target=false;GWAR=null;}return;}
  W2.t-=dt;if(W2.t>0)return;
  if(W2.wave>=W2.waves){TURF[W2.bi]={g:W2.g,v:game.playT||0,p:0};const pay=2000+trashLevel*0;addMoney(pay);addRespect(W2.g,-1.5);sfx('pass');showBig('GANG WAR WON','The block is yours  ·  +$'+pay.toLocaleString(),'#c07cff',3);GWAR=null;return;}
  W2.wave++;W2.wt=0;W2.t=5;const n=3+W2.wave+(CREWUP.guns?1:0);
  for(let i=0;i<n;i++){let q=null;for(let k=0;k<20;k++){const a=R()*TAU,d=rr(260,380),x=W2.cx+Math.cos(a)*d,y=W2.cy+Math.sin(a)*d,t=tileAt(Math.floor(x/T),Math.floor(y/T));if((t===WALK||t===ROAD||t===LOT)&&!camSees(x,y)){q={x,y};break;}}if(!q)q=walkNear(W2.cx,W2.cy,300);
    const e=makePed(q.x,q.y,false);makeGang(e,W2.g);e.angry=999;e.target=true;e.hp=45+W2.wave*10;if(W2.wave===3&&i<2)player.ammo[1]>=0&&(e.heavy=true);pedPickNext(e);W2.list.push(e);}
  note('Wave '+W2.wave+' of '+W2.waves+': '+n+' '+GANGS[W2.g].name);}
// ---------- crew upgrades (phone): better guns, body armor, a fourth slot, turf guards ----------
const CREWUP={guns:0,armor:0,slot:0,guard:0};
const crewMax=()=>3+(CREWUP.slot?1:0);
function crewUpgrades(){if(!Object.keys(TURF).length){note('You need turf before you have a crew');return;}
  const opts=[['guns','Crew SMGs',3000,'They fire faster and hit harder'],['armor','Crew body armor',2500,'Your crew can take more'],['slot','Fourth crew slot',5000,'Up to 4 followers'],['guard','Turf guards',2000,'Your blocks hold out twice as long']].filter(o=>!CREWUP[o[0]]);
  if(!opts.length){say([['Crew','We\'re fully kitted out, boss.']]);return;}
  say([['Crew','What are we spending turf money on?']],null,opts.map(([k,n,pr,d])=>[n.toUpperCase()+' $'+pr.toLocaleString(),()=>{if(money<pr){note('Not enough cash');return;}addMoney(-pr);CREWUP[k]=1;sfx('pickup');note(n+': '+d);}]).concat([['NOTHING',()=>{},'no']]));}
// ---------- reputation you can see: friendly greetings and honks, Ammu-Nation discounts, ambushes near your safehouses ----------
const GREET=['Yo, homie!','Respect.','Looking sharp.','Our streets are your streets.','Need anything, call us.'];
let repT=0,ambushT=90;
function updateReputation(dt){repT-=dt;if(repT>0||game.state!=='play')return;repT=0.6;
  if(!player.car)for(const p of peds){if(p.gone||p.gang==null||p.greeted||respect[p.gang]<3||p.angry>0)continue;if(dist2(p.x,p.y,player.x,player.y)<80*80){p.greeted=true;p.say={text:pick(GREET),t:2.2};p.a=Math.atan2(player.y-p.y,player.x-p.x);}}
  for(const c of cars){if(c.gang==null||c.greeted||!c.driver||c===player.car||respect[c.gang]<3)continue;if(dist2(c.x,c.y,(player.car||player).x,(player.car||player).y)<130*130){c.greeted=true;hornBeep(c.x,c.y,380);}}
  ambushT-=0.6;if(ambushT<=0&&stars()===0&&!mission&&!GWAR){ambushT=rr(120,200);
    for(const sh of SAFEHOUSES){if(!sh.owned||dist2(sh.x,sh.y,player.x,player.y)>450*450)continue;const g=zoneOf(sh.x,sh.y);if(g<0||respect[g]>-3)continue;
      let n=0;for(let k=0;k<30&&n<3;k++){const a=R()*TAU,d=rr(250,360),x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d,t=tileAt(Math.floor(x/T),Math.floor(y/T));if(t!==WALK&&t!==ROAD||camSees(x,y))continue;const e=makePed(x,y,false);makeGang(e,g);e.angry=60;pedPickNext(e);n++;}
      if(n){showBig('AMBUSH!',GANGS[g].name+' were waiting for you','#ff4040',2);}break;}}}
const gunDiscount=()=>{const z=zoneOf(player.x,player.y);return z>=0&&respect[z]>=3?0.8:1;};
// ---------- turf slips away if you neglect it: visit your blocks (or buy turf guards) ----------
let turfPT=0;
function updateTurfPressure(dt){if(game.state!=='play')return;const now=game.playT||0,bi=blockOf(player.x,player.y);
  if(TURF[bi]){TURF[bi].v=now;TURF[bi].p=0;}
  turfPT-=dt;if(turfPT>0)return;turfPT=60;const keys2=Object.keys(TURF);
  for(const k of keys2){const t=TURF[k];if(t.v==null)t.v=now;const away=now-t.v,limit=CREWUP.guard?720:360;
    if(away>limit){t.p=(t.p||0)+1;t.v=now-limit*0.5;
      if(t.p===2)note('One of your blocks is under pressure from the '+GANGS[t.g].name+' (orange on the map). Pay it a visit');
      if(t.p>=3){delete TURF[k];note('The '+GANGS[t.g].name+' took back a block while you were away');sfx('fail',0.5);}}}}
// ---------- smarter police: spike strips, a chopper over the rooftops, and cops who search where they last saw you ----------
const SPIKES=[];
function spawnSpikes(){const c0=player.car;if(!c0)return false;const sp=hyp(c0.vx,c0.vy);if(sp<120)return false;const dx=c0.vx/sp,dy=c0.vy/sp;
  for(let tries=0;tries<6;tries++){const dd=FOG1*0.7+tries*70,px=c0.x+dx*dd,py=c0.y+dy*dd,tx=Math.floor(px/T),ty=Math.floor(py/T);if(tx<0||ty<0||tx>=W||ty>=W||map[ty*W+tx]!==ROAD)continue;
    const mx=tx%P,my=ty%P;if((mx<4)===(my<4))continue;const vert=mx<4,k=vert?Math.floor(tx/P):Math.floor(ty/P),x=vert?(k*P+2)*T:(tx+.5)*T,y=vert?(ty+.5)*T:(k*P+2)*T;
    SPIKES.push({x,y,a:vert?0:PI/2,hl:60,t:70});const cp=makePed(x+(vert?70:0),y+(vert?0:70),true);cp.state='cop';cp.gun=true;radioMsg('DISPATCH: Spike strip deployed ahead of the suspect.');return true;}
  return false;}
let spikeT=25;
function updatePolice(dt){const s=stars();
  if(s>=3&&player.car&&game.state==='play'){spikeT-=dt;if(spikeT<=0){spikeT=spawnSpikes()?rr(28,45):4;}}else spikeT=Math.max(spikeT,12);
  for(let i=SPIKES.length-1;i>=0;i--){const k=SPIKES[i];k.t-=dt;if(k.t<=0||dist2(k.x,k.y,player.x,player.y)>2200*2200){SPIKES.splice(i,1);continue;}
    for(const c of cars){if(c.flat||c.t.tank||c.t.boat||c.t.heli||c.air>0)continue;const dx=c.x-k.x,dy=c.y-k.y,ca=Math.cos(k.a),sa=Math.sin(k.a),f=dx*ca+dy*sa,l=-dx*sa+dy*ca;
      if(Math.abs(f)<6+c.t.L*0.3&&Math.abs(l)<k.hl){c.flat=true;if(c===player.car){showBig('TIRES SHREDDED','Find a spray shop to fix them','#ff9a2e',2);sfx('crash',0.5);shake=Math.max(shake,5);}}}}
  // sparks from shredded tires
  for(const c of cars)if(c.flat&&!c.wreck&&hyp(c.vx,c.vy)>80&&R()<dt*14&&dist2(c.x,c.y,player.x,player.y)<700*700)puff(c.x+rr(-10,10),c.y+rr(-10,10),rr(-60,60),rr(-60,60),0.2,2,'#ffd27a','spark');}
// ---------- losing the cops in style: a respray out of sight, or switching cars where nobody sees ----------
let resprayCool=0,lastCarSwap=null;
function updateEscapes(dt){resprayCool-=dt;const c=player.car;if(!c||stars()===0||game.state!=='play'||resprayCool>0)return;
  if(seenT>1.2&&!c.t.boat)for(const sp of sprayPads)if(dist2(sp.x,sp.y,c.x,c.y)<70*70&&hyp(c.vx,c.vy)<70){resprayCool=8;
    if(money<250){note('A respray costs $250');return;}addMoney(-250);c.col=pick(CT.sedan.cols.concat(CT.sports.cols));c.flat=false;clearHeat();sfx('spray');
    for(let i=0;i<14;i++)puff(c.x+rr(-30,30),c.y+rr(-30,30),rr(-20,20),rr(-20,20),rr(.4,.9),rr(6,12),'#e8e8e8','smoke');showBig('FRESH PAINT','The cops lost you  ·  -$250','#3ee07a',2.2);radioMsg('DISPATCH: We lost the vehicle. Suspect may have changed paint.');return;}}
function carSwapEscape(c){if(stars()>0&&seenT>1.2&&c!==lastCarSwap){const s=stars();heat=TH[Math.max(0,s-1)]+1;radioMsg('DISPATCH: Suspect switched vehicles. We\'re looking for the wrong car.');note('You switched cars out of sight: one star less');}lastCarSwap=c;}
// ---------- climbing ladders: push toward the wall to go up, pull back to go down, jump to let go ----------
let climbIn=0;
function climbPre(fwd,dt){const L=player.climb;
  if(!L){if(player.car||player.riding||game.state!=='play'||fwd<0.3)return false;
    for(const q of LADDERS){if(Math.abs(q.x-player.x)>40||Math.abs(q.y-player.y)>40)continue;const rx=player.x-q.x,ry=player.y-q.y,o=rx*q.nx+ry*q.ny,sl=Math.abs(rx*q.dx+ry*q.dy);if(sl>9)continue;
      const topRel=q.top-GH(q.px,q.py),facing=Math.cos(player.body)*q.nx+Math.sin(player.body)*q.ny;
      if(player.jz<4&&o>0&&o<16&&facing<-0.55){player.climb=q;q.dir=1;player.climbZ=player.jz;sfx('door',0.3);return true;}            // from the sidewalk
      if(Math.abs(player.jz-topRel)<6&&o<2&&o>-14&&facing>0.55){player.climb=q;q.dir=-1;player.climbZ=topRel-1;sfx('door',0.3);return true;} // from the roof
    }return false;}
  const topRel=L.top-GH(L.px,L.py);climbIn=fwd;player.climbZ+=L.dir*fwd*80*dt;player.anim+=Math.abs(fwd)*dt*10;
  if(kd.Space&&!player.jumpHeld){player.climb=null;player.jv=120;player.vx=L.nx*90;player.vy=L.ny*90;player.jumpHeld=true;return false;}
  if(player.climbZ>=topRel){player.climb=null;player.x=L.x-L.nx*14;player.y=L.y-L.ny*14;player.jz=topRel+0.5;player.jv=0;player.peak=player.jz;return true;}
  if(player.climbZ<=0){player.climb=null;player.jz=0;player.jv=0;player.peak=0;player.x=L.px+L.nx*4;player.y=L.py+L.ny*4;return true;}
  return true;}
function climbPost(){const L=player.climb;if(!L)return;player.x=L.px;player.y=L.py;player.jz=player.climbZ;player.jv=0;player.vx=player.vy=0;player.peak=player.jz;
  player.body=player.a=Math.atan2(-L.ny,-L.nx);player.moving=Math.abs(climbIn)>0.1;}
// ================= v4.12 (part 2): DINER, GYM, PAWN SHOP, ROOFTOP PLANKS AND RUNS, COLLECTIBLES, RAIN AND NIGHT, COUNTRYSIDE =================
// ---------- three new places to walk into ----------
ROOMS.diner={tx0:146,ty0:W+13,tx1:158,ty1:W+21,floor:[200,196,186],wall:[120,170,170],name:'BLUE PLATE DINER'};
ROOMS.gym={tx0:162,ty0:W+13,tx1:176,ty1:W+22,floor:[90,80,72],wall:[150,150,156],name:'IRON WORKS GYM'};
ROOMS.pawn={tx0:180,ty0:W+13,tx1:190,ty1:W+20,floor:[120,96,70],wall:[170,150,110],name:'LUCKY PAWN'};
for(const k of['diner','gym','pawn']){const r=ROOMS[k];r.id=k;r.x0=r.tx0*T;r.y0=r.ty0*T;r.x1=r.tx1*T;r.y1=r.ty1*T;r.cx=(r.x0+r.x1)/2;r.cy=(r.y0+r.y1)/2;r.door={x:r.cx,y:r.y1-T*1.6};r.props=[];
  const hw=(r.x1-r.x0)/2,hh=(r.y1-r.y0)/2;
  r.props.push({x:r.cx,y:r.y0+T/2,k:'rwall',hl:hw,hw:T/2,rad:hw+20,ht:70,c:r.wall},{x:r.cx,y:r.y1-T/2,k:'rwall',hl:hw,hw:T/2,rad:hw+20,ht:70,c:r.wall},
    {x:r.x0+T/2,y:r.cy,k:'rwall',hl:T/2,hw:hh,rad:hh+20,ht:70,c:r.wall},{x:r.x1-T/2,y:r.cy,k:'rwall',hl:T/2,hw:hh,rad:hh+20,ht:70,c:r.wall},{x:r.door.x,y:r.y1-T*1.05,k:'rdoor',rad:30,ht:60});
  ROOMLIST.push(r);}
{const r=ROOMS.diner;r.counter={x:r.cx,y:r.y0+T*2.2};r.props.push({x:r.cx,y:r.y0+T*2.2,k:'rbox',hl:T*3.2,hw:T*0.5,z0:0,z1:16,c:[200,60,60],rad:110,ht:18});
  for(let i=-3;i<=3;i++)r.props.push({x:r.cx+i*T*0.9,y:r.y0+T*3.1,k:'rbox',hl:3,hw:3,z0:0,z1:10,c:[220,220,220],rad:8,ht:10});
  for(const sx of[-1,1])for(let j=0;j<2;j++)r.props.push({x:r.cx+sx*T*4,y:r.y0+T*(4.4+j*1.6),k:'rbox',hl:T*0.9,hw:T*0.5,z0:0,z1:12,c:[170,40,40],rad:34,ht:14});
  r.props.push({x:r.cx,y:r.y0+T*1.1,k:'rsign',text:'BLUE PLATE',bg:'#2a7a8a',fg:'#ffffff',z:48,rad:30,ht:56});}
{const r=ROOMS.gym;r.counter={x:r.cx,y:r.y0+T*2.2};r.props.push({x:r.cx,y:r.y0+T*2.2,k:'rbox',hl:T*1.6,hw:T*0.5,z0:0,z1:16,c:[60,60,66],rad:60,ht:18});
  for(let i=0;i<3;i++)r.props.push({x:r.x0+T*(2.5+i*3),y:r.y1-T*3,k:'rbox',hl:T*0.9,hw:T*0.35,z0:0,z1:8,c:[40,40,44],rad:34,ht:10},{x:r.x0+T*(2.5+i*3),y:r.y1-T*3,k:'rbox',hl:T*1.1,hw:2,z0:12,z1:14,c:[150,150,156],rad:40,ht:16});
  r.props.push({x:r.x1-T*3,y:r.cy,k:'rbox',hl:T*1.8,hw:T*1.8,z0:0,z1:2,c:[40,80,160],rad:70,ht:4},{x:r.cx,y:r.y0+T*1.1,k:'rsign',text:'IRON WORKS',bg:'#202020',fg:'#ffb03a',z:48,rad:30,ht:56});}
{const r=ROOMS.pawn;r.counter={x:r.cx,y:r.y0+T*2.2};r.props.push({x:r.cx,y:r.y0+T*2.2,k:'rbox',hl:T*2.2,hw:T*0.5,z0:0,z1:16,c:[110,80,50],rad:80,ht:18});
  for(const sx of[-1,1])r.props.push({x:r.cx+sx*T*3.4,y:r.y1-T*3,k:'rbox',hl:T*0.5,hw:T*1.4,z0:0,z1:26,c:[90,70,50],rad:50,ht:28});
  r.props.push({x:r.cx,y:r.y0+T*1.1,k:'rsign',text:'LUCKY PAWN',bg:'#d8a020',fg:'#202020',z:48,rad:30,ht:56});}
const PLACES=[['diner',4,5,'BLUE PLATE DINER','#2a7a8a'],['gym',4,12,'IRON WORKS GYM','#202020'],['pawn',13,14,'LUCKY PAWN','#d8a020']].map(([id,bx,by,txt,bg])=>{
  const l=nearestLot((bx*P+9)*T,(by*P+9)*T)||lotBlocks[0];const d={id,x:l.x-60,y:l.y-40};SIGNS.push({x:d.x,y:d.y-36,text:txt,bg,fg:'#ffffff',h:40,on:()=>true});return d;});
let placeCool=0;
function updatePlaces(dt){placeCool-=dt;if(placeCool>0||player.car||DLG.open||game.state!=='play')return;
  if(!ROOM){if(roomCool>0)return;for(const d of PLACES)if(dist2(d.x,d.y,player.x,player.y)<30*30){enterRoom(d.id,{x:d.x,y:d.y+40});return;}return;}
  const r=ROOM.r;if(!r.counter||!['diner','gym','pawn'].includes(ROOM.id)||dist2(player.x,player.y,r.counter.x,r.counter.y+T)>30*30)return;placeCool=4;
  const buy=(p,f)=>()=>{if(money<p){note('Not enough cash');return;}addMoney(-p);sfx('pickup');f();};
  if(ROOM.id==='diner')say([['Waitress','What\'ll it be, hon?']],null,[['COFFEE $5',buy(5,()=>{player.hp=Math.min(PMAX(),player.hp+15);note('+15 health');})],['BURGER $15',buy(15,()=>{player.hp=PMAX();note('Full health');})],
    ['BLUE PLATE SPECIAL $40',buy(40,()=>{player.hp=PMAX();player.armor=Math.max(player.armor||0,25);note('Full health and a little armor');})],['NOTHING',()=>{},'no']]);
  else if(ROOM.id==='gym'){if(GYM>=5){say([['Trainer','You\'re in the best shape of your life. Nothing left to teach you.']]);return;}const pr=150+GYM*100;
    say([['Trainer','A session costs $'+pr+'. Every one makes you tougher.']],null,[['TRAIN $'+pr,buy(pr,()=>{GYM++;player.hp=PMAX();showBig('TOUGHER','Max health '+PMAX(),'#ffb03a',2);})],['LATER',()=>{},'no']]);}
  else say([['Pawnbroker','Everything\'s a bargain. Mostly.']],null,[['BODY ARMOR $350',buy(350,()=>{player.armor=100;note('Body armor on');})],['BASEBALL BAT $60',buy(60,()=>{player.w=BATIDX();note('Bat ready');})],
    ['SMG AMMO +100 $350',buy(350,()=>{if(player.ammo[1]!==Infinity)player.ammo[1]=(player.ammo[1]||0)+100;player.w=1;note('SMG loaded');})],['JUST LOOKING',()=>{},'no']]);}
// ---------- planks across the alleys, so rooftops link up into routes ----------
const PLANKS=[],RUNS=[],RUNBEST={};
// (planks and runs need the buildings' heights and ladders, so they're built by initWorld412 after the buildings are set up)
function initPlanksRuns(){{const cand=buildings.filter(b=>!b.outside&&b.st!=='house'&&b.kind!=='stadium');
  for(let i=0;i<cand.length;i++)for(let j=i+1;j<cand.length;j++){const A=cand[i],B=cand[j];
    const ox=Math.min(A.x+A.w,B.x+B.w)-Math.max(A.x,B.x),oy=Math.min(A.y+A.h,B.y+B.h)-Math.max(A.y,B.y);let pl=null;
    if(oy>=26){const g1=B.x-(A.x+A.w),g2=A.x-(B.x+B.w),gap=Math.max(g1,g2);if(gap>=24&&gap<=80){const x=g1>0?A.x+A.w+gap/2:B.x+B.w+gap/2,y=Math.max(A.y,B.y)+oy/2;pl={x,y,a:0,hl:gap/2+7};}}
    else if(ox>=26){const g1=B.y-(A.y+A.h),g2=A.y-(B.y+B.h),gap=Math.max(g1,g2);if(gap>=24&&gap<=80){const y=g1>0?A.y+A.h+gap/2:B.y+B.h+gap/2,x=Math.max(A.x,B.x)+ox/2;pl={x,y,a:PI/2,hl:gap/2+7};}}
    if(!pl)continue;const ra=A.base+(A.tier?A.hg:A.hg)*BH,rb=B.base+B.hg*BH;if(Math.abs(ra-rb)>8||Math.min(ra,rb)<60)continue;if(hash(A.id,B.id)%10>5)continue;
    const ca=Math.cos(pl.a),sa=Math.sin(pl.a),gA=(A.x<=pl.x&&pl.x<=A.x+A.w)?0:1,end=(sg)=>{const ex=pl.x+ca*pl.hl*sg,ey=pl.y+sa*pl.hl*sg;return bldAt(ex,ey);};
    const e1=end(-1),e2=end(1);if(!e1||!e2||e1===e2)continue;const z1=e1.base+e1.hg*BH,z2=e2.base+e2.hg*BH,g0=GH(pl.x,pl.y);
    pl.z=(z1+z2)/2-g0;PLANKS.push(pl);WALKS.push({x:pl.x,y:pl.y,a:pl.a,hl:pl.hl,hw:5.5,h0:z1-g0+0.5,h1:z2-g0+0.5});props.push({x:pl.x,y:pl.y,k:'plank',a:pl.a,hl:pl.hl,z:pl.z,rad:pl.hl+4,ht:pl.z+2});}}
// ---------- rooftop runs: timed checkpoint races across connected roofs, started from a roof with a ladder ----------
{const roofs=buildings.filter(b=>!b.outside&&b.st!=='house'&&b.kind!=='stadium'&&b.hg>=1.5),top=b=>b.base+b.hg*BH;
  const near=(A,B)=>{const ox=Math.min(A.x+A.w,B.x+B.w)-Math.max(A.x,B.x),oy=Math.min(A.y+A.h,B.y+B.h)-Math.max(A.y,B.y),gx=Math.max(A.x-(B.x+B.w),B.x-(A.x+A.w)),gy=Math.max(A.y-(B.y+B.h),B.y-(A.y+A.h));
    return(oy>=20&&gx<=2)||(ox>=20&&gy<=2);};
  const nb=b=>{if(b._nb)return b._nb;b._nb=[];for(const q of roofs){if(q===b)continue;if(Math.abs(q.x-b.x)>260||Math.abs(q.y-b.y)>260)continue;const dz=top(q)-top(b);
      if(near(b,q)&&dz<=7&&dz>=-45)b._nb.push(q);}
    for(const pl of PLANKS){const e1=bldAt(pl.x-Math.cos(pl.a)*pl.hl,pl.y-Math.sin(pl.a)*pl.hl),e2=bldAt(pl.x+Math.cos(pl.a)*pl.hl,pl.y+Math.sin(pl.a)*pl.hl);if(e1===b&&e2)b._nb.push(e2);if(e2===b&&e1)b._nb.push(e1);}return b._nb;};
  const starts=buildings.filter(b=>b.lad&&b.hg>=2).sort((p2,q)=>hash(p2.id,333)-hash(q.id,333));
  for(const s0 of starts){if(RUNS.length>=4)break;if(RUNS.some(r=>hyp(r.sx-s0.lad.x,r.sy-s0.lad.y)<900))continue;
    const path=[s0],seen=new Set([s0]);let cur=s0;for(let k=0;k<12&&path.length<6;k++){const opts=nb(cur).filter(q=>!seen.has(q));if(!opts.length)break;cur=opts[hash(cur.id,k+7)%opts.length];seen.add(cur);path.push(cur);}
    if(path.length<4)continue;const L=s0.lad,sx=L.x-L.nx*18,sy=L.y-L.ny*18;
    const cps=path.slice(1).map(b=>{const x=b.x+b.w/2,y=b.y+b.h/2;return{x,y,z:roofAbs(b,x,y)-GH(x,y)};});
    let len=hyp(cps[0].x-sx,cps[0].y-sy);for(let k=1;k<cps.length;k++)len+=hyp(cps[k].x-cps[k-1].x,cps[k].y-cps[k-1].y);
    const r={id:RUNS.length,sx,sy,sz:roofAbs(s0,sx,sy)-GH(sx,sy),cps,time:Math.round(len/95+8+cps.length*2)};RUNS.push(r);
    SIGNS.push({x:sx,y:sy,text:'ROOFTOP RUN',bg:'#7a3ab0',fg:'#ffffff',h:r.sz+30,on:()=>true});}}}
let runCool=0;
function updateRoofRun(dt){runCool-=dt;
  if(roofRun){const R2=roofRun,c=R2.cps[R2.i];R2.timer-=dt;R2.t+=dt;
    if(R2.timer<=0||player.car||(player.jz<4&&!player.climb)){showBig(player.jz<4?'YOU FELL':'OUT OF TIME','Rooftop run failed','#ff4040',2);sfx('fail');roofRun=null;runCool=4;return;}
    if(hyp(player.x-c.x,player.y-c.y)<30&&Math.abs(player.jz-c.z)<14){R2.i++;sfx('pickup',0.5);
      if(R2.i>=R2.cps.length){const t=R2.t,best=RUNBEST[R2.run.id],pay=600+Math.max(0,Math.round(R2.timer))*20;addMoney(pay);RUNBEST[R2.run.id]=best?Math.min(best,t):t;
        showBig('RUN COMPLETE',t.toFixed(1)+' s'+(best&&t<best?'  ·  NEW BEST':'')+'  ·  +$'+pay,'#c07cff',3);sfx('pass');roofRun=null;runCool=6;}
      else note('Checkpoint '+R2.i+' / '+R2.cps.length);}
    return;}
  if(runCool>0||mission||DLG.open||player.car||game.state!=='play')return;
  for(const r of RUNS)if(hyp(player.x-r.sx,player.y-r.sy)<34&&Math.abs(player.jz-r.sz)<10){runCool=5;
    say([['Rooftop Run','Hit '+r.cps.length+' checkpoints across the roofs in '+r.time+' s. Touch the street and you\'re out.'+(RUNBEST[r.id]?' Best: '+RUNBEST[r.id].toFixed(1)+' s':'')]],null,[['GO',()=>{roofRun={run:r,cps:r.cps,i:0,timer:r.time,t:0};showBig('GO!','','#ffd600',0.8);}],['NOT NOW',()=>{},'no']]);break;}}
function roofRunHUD(sc,ly){const R2=roofRun;hudText('ROOFTOP RUN  ·  '+R2.i+' / '+R2.cps.length,18*sc,ly+12*sc,Math.round(16*sc),'#c9a0ff','left');const tm=Math.max(0,R2.timer);hudText(tm.toFixed(1)+' s',18*sc,ly+40*sc,Math.round(22*sc),tm<=5&&Math.floor(game.t*4)%2?'#ff4040':'#fff','left');}
// ---------- collectibles: three golden guns, a secret car, and twelve gang tags to spray over ----------
const GOLDG=[],GOLDGOT={};
function initGold(){{const lads=buildings.filter(b=>b.lad&&b.hg>=2.5).sort((p2,q)=>hash(q.id,77)-hash(p2.id,77)),b=lads.find(q=>!STASH.some(k=>bldAt(k.x,k.y)===q));
  if(b){const x=b.x+b.w/2,y=b.y+b.h/2;GOLDG.push({w:0,x,y,z:roofAbs(b,x,y)-GH(x,y)+0.5,name:'Golden Pistol'});}
  {const x=(CPARK.x0*P+6)*T,y=(CPARK.y1*P+10)*T;GOLDG.push({w:2,x,y,z:0,name:'Golden Shotgun'});}
  {const x=WPX+640,y=(15*P+2)*T+170;GOLDG.push({w:1,x,y,z:0,name:'Golden SMG'});}}}
function applyGold(){if(GOLDGOT[0]){WEAPONS[0].name='Golden Pistol';WEAPONS[0].dmg=60;}if(GOLDGOT[1]){WEAPONS[1].name='Golden SMG';player.ammo[1]=Infinity;}if(GOLDGOT[2]){WEAPONS[2].name='Golden Shotgun';player.ammo[2]=Infinity;}}
function updateGold(){if(player.car||game.state!=='play')return;for(const g of GOLDG){if(GOLDGOT[g.w]||hyp(player.x-g.x,player.y-g.y)>20||Math.abs((player.jz||0)-g.z)>14)continue;
  GOLDGOT[g.w]=1;applyGold();player.w=g.w;sfx('pickup');showBig(g.name.toUpperCase(),g.w===0?'Double damage':'Never runs out of ammo','#ffd600',3);}}
// the secret car: a gold Phantom parked behind a farmhouse out east
CT.phantom={name:'Phantom',L:52,Wd:24,acc:640,grip:12,turn:3.4,hp:160,mass:1.1,cols:['#d4af37'],vx:'muscle',roofH:18};
HANDLING.phantom={src:'Secret',mass:14,fdb:0.2,fmb:0.48,brake:2.4,turnIn:0.42,turnRatio:0.34,res:1.15,hbs:0.4,thrust:0.18,max:0.47,anti:1.0,skid:0.13,g1:0.62,g2:0.72,g3:1.0,g2s:0.2,g3s:0.3,turbo:1};
CT.phantom.max=HANDLING.phantom.max*GT*TICK;FWD_BIAS.phantom=0;
let SECRET=null;
function spawnSecret(){const b=OUTB[0],SECRETSPOT=b?{x:b.x-40,y:b.y+b.h/2,a:PI/2}:{x:WPX+500,y:WPX/2,a:0};SECRET=makeCar('phantom',SECRETSPOT.x,SECRETSPOT.y,SECRETSPOT.a,'#d4af37');SECRET.stripe=[20,20,22];SECRET.secret=true;}
let secretFound=false;
function updateSecret(){if(!secretFound&&player.car&&player.car.secret){secretFound=true;showBig('SECRET CAR FOUND','The Phantom: the fastest thing in Gridlock City','#ffd600',3.2);sfx('pass');}}
const TAGS=[];
function initTags(){{for(let g=0;g<3;g++){const cand=buildings.filter(b=>!b.outside&&b.st!=='house'&&b.st!=='glass'&&zoneOf(b.x+b.w/2,b.y+b.h/2)===g&&b.w>=64&&b.h>=64).sort((p2,q)=>hash(p2.id,g*11+5)-hash(q.id,g*11+5));
  for(const b of cand){if(TAGS.filter(t=>t.g===g).length>=4)break;if(TAGS.some(t=>hyp(t.x-b.x,t.y-b.y)<500))continue;
    for(let f=0;f<4;f++){const[ax,ay,bx2,by2]=faceWall(b,f),len=hyp(bx2-ax,by2-ay),dx=(bx2-ax)/len,dy=(by2-ay)/len,nx=dy,ny=-dx,sx=len*0.28,x=ax+dx*sx,y=ay+dy*sx;
      const t=tileAt(Math.floor((x+nx*16)/T),Math.floor((y+ny*16)/T));if(t!==WALK||(b.lad&&b.feFace===f))continue;
      TAGS.push({b,g,x,y,nx,ny,dx,dy,done:false});props.push({x:x+nx*0.3,y:y+ny*0.3,k:'tag',tag:TAGS[TAGS.length-1],a:Math.atan2(dy,dx),rad:14,ht:24});break;}}}}}
let tagHold=0;
function updateTags(dt){if(player.car||game.state!=='play'){tagHold=0;return;}let at=null;
  for(const t of TAGS){if(t.done)continue;const rx=player.x-t.x,ry=player.y-t.y,o=rx*t.nx+ry*t.ny,sl=Math.abs(rx*t.dx+ry*t.dy);if(o>0&&o<22&&sl<14){at=t;break;}}
  if(!at){tagHold=0;return;}tagHold+=dt;if(R()<dt*20)puff(at.x+at.nx*3+rr(-6,6)*at.dx,at.y+at.ny*3+rr(-6,6)*at.dy,at.nx*20,at.ny*20,0.4,rr(2,4),'#b77cff','smoke');
  if(tagHold>1.4){at.done=true;tagHold=0;addRespect(at.g,-0.3);addMoney(150);sfx('spray');const n=TAGS.filter(t=>t.done).length;
    if(n===TAGS.length){addMoney(5000);showBig('ALL TAGS SPRAYED','The whole city knows your name  ·  +$5,000','#c07cff',3);}else showBig('TAG SPRAYED',n+' / '+TAGS.length+'  ·  over the '+GANGS[at.g].name+'  ·  +$150','#c07cff',2);}}
// ---------- rain and night: wet reflections, splashes, steaming manholes ----------
let steamT=0;
function updateWeatherFx(dt){steamT-=dt;
  if(rain>0.35)for(const c of cars){if(c.t.boat||c.t.heli||c.air>0)continue;const sp=hyp(c.vx,c.vy);if(sp<120||dist2(c.x,c.y,player.x,player.y)>600*600||R()>dt*sp*0.06)continue;
    const ca=Math.cos(c.a),sa=Math.sin(c.a),sd=R()<0.5?1:-1;puff(c.x-ca*c.t.L*0.35-sa*sd*c.t.Wd*0.5,c.y-sa*c.t.L*0.35+ca*sd*c.t.Wd*0.5,-c.vx*0.15+rr(-30,30),-c.vy*0.15+rr(-30,30),0.35,rr(2,4),'#cfdcec','smoke');}
  if(rain>0.35&&!player.car&&player.moving&&R()<dt*8)puff(player.x+rr(-4,4),player.y+rr(-4,4),rr(-20,20),rr(-20,20),0.3,2,'#cfdcec','smoke');
  // manhole steam: night, rain or winter
  if(steamT<=0){steamT=0.3;if(LIGHTK>0.2||rain>0.3||SEASON()==='winter'){const tx0=Math.floor(CX/T),ty0=Math.floor(CY/T);
    for(let j=-14;j<=14;j++)for(let i=-14;i<=14;i++){const tx=tx0+i,ty=ty0+j;if(tx<0||ty<0||tx>=W||ty>=W)continue;const ti=ty*W+tx;if(map[ti]!==ROAD||DIAGT[ti]||TILEH[ti]%29!==0)continue;
      puff((tx+.5)*T+rr(-3,3),(ty+.5)*T+rr(-3,3),rr(-8,8),rr(-8,8),rr(1.4,2.2),rr(5,8),'#e8ecf0','smoke');}}}}
// a reflection under a light on wet ground: a soft streak below where the light meets the road
function wetGlint(gx,gy,ly,col,a){if(rain<0.3||LIGHTK<0.1)return;const len=Math.min(40,Math.max(4,(gy-ly)*0.55));L3.globalCompositeOperation='lighter';L3.fillStyle=col;
  for(let k=0;k<4;k++){L3.globalAlpha=a*rain*LIGHTK*(1-k/4)*0.35;L3.fillRect(R2(gx-1.5+k*0.3),R2(gy+k*len/4),3,Math.max(1,R2(len/4)));}L3.globalAlpha=1;L3.globalCompositeOperation='source-over';}
// ---------- the countryside: hay bales, a windmill and dirt jumps on the farm roads ----------
function initCountry(){{const ys=[3,9,15].map(iy=>(iy*P+2)*T);
  for(const yy of ys)for(const dx of[380,900])addRamp(WPX+dx,yy,0,'dirt');
  for(let i=0;i<26;i++){const x=WPX+rr(200,1100),y=rr(300,WPX-300);if(ys.some(q=>Math.abs(q-y)<60)||Math.abs(x-(WPX+640))<60||GH(x,y)>150)continue;props.push({x,y,k:'hay',a:rr(0,PI),rad:12,ht:14});}
  props.push({x:WPX+760,y:(9*P+2)*T-140,k:'windmill',rad:40,ht:120});}}
function updateStages(dt){syncBarriers();if(cityOpen()||game.state!=='play'||SUB||ROOM)return;const o=player.car||player;
  if(o.x>RIVX1*T&&o.y>0&&o.y<WPX+400){if(stars()<4){crime(0,4);showBig('KEEP OUT','The east side is closed to you for now','#ff4040',2.4);}}}
// dock workers in hard hats and hi-vis keep the port busy while you're nearby
let dockT=0;function updateDockers(dt){dockT-=dt;if(dockT>0||game.state!=='play')return;dockT=1.5;
  const near=[...DOCKB].map(k=>k.split(',').map(Number)).filter(([bx,by])=>hyp((bx*P+9)*T-player.x,(by*P+9)*T-player.y)<1300);if(!near.length)return;
  if(peds.filter(p=>!p.gone&&p.docker).length>=7)return;
  for(let i=0;i<10;i++){const [bx,by]=pick(near),x=(bx*P+5+rr(0,8))*T,y=(by*P+5+rr(0,8))*T,ti=Math.floor(y/T)*W+Math.floor(x/T);
    if(map[ti]!==LOT||camSees(x,y))continue;const q=makePed(x,y,false);q.docker=true;q.col=pick(['#e8701a','#e8c81a','#3a5a8a']);q.hat=pick(['#f0c020','#f0f0ea','#e8701a']);pedPickNext(q);return;}}
function extTick14(dt){updateDockers(dt);updateRadioText(dt);updateStages(dt);updateTow(dt);updateDrops(dt);updatePlaces(dt);updateRoofRun(dt);updateGold();updateSecret();updateTags(dt);updateWeatherFx(dt);}
function extTick13(dt){extTick14(dt);updateWaypoint();updateGangWar(dt);updateReputation(dt);updateTurfPressure(dt);updatePolice(dt);updateEscapes(dt);}
function extTick12(dt){updateCrew(dt);extTick13(dt);}
function extTick11(dt){updateCurb(dt);updateSideJob(dt);updateQueues(dt);updateStash();extTick12(dt);}


window.__roomsReady=true;

