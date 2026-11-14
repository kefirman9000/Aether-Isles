// ================= CAMERA =================
// GTA III camera views, cycled with V (Select / R3 on a controller): close, normal, far and top-down
const CAMV=[{n:'CLOSE',d:0.72,h:0.82},{n:'NORMAL',d:1,h:1},{n:'FAR',d:1.38,h:1.32},{n:'HIGH',top:true}];
const camMode=()=>{if(OPT.camMode==null)OPT.camMode=OPT.cam<1?0:OPT.cam>1?2:1;return OPT.camMode|0;};
function cycleCam(){OPT.camMode=(camMode()+1)%CAMV.length;saveOpts();note('Camera: '+CAMV[OPT.camMode].n.toLowerCase());}
// ---- scoped first-person aim (sniper rifle, assault rifle): the camera moves to your eyes and the view zooms in ----
const SCOPE={on:false,z:1,zw:0};
function scopeWanted(){const w=WEAPONS[player.w];if(!w||!w.scope||player.car)SCOPE.touch=false;return !!(w&&w.scope&&!player.car&&!player.riding&&game.state==='play'&&!SCENE.on&&((touchMode&&SCOPE.touch)||(mouse.rdown&&!touchMode)||(pad.on&&(OPT.pad==='classic'?pad.lock:pad.brake>0.5))));}
const cam={x:0,y:0,zoom:1.4,yaw:-PI/2,h:40,dist:90,base:null,idle:9,px:0,py:0,wasFoot:false};
// ---- GTA III-style on foot: free-orbit camera, camera-relative movement and lock-on targeting ----
const GTA3MOVE=()=>OPT.gta3!==false;
const LOCK={t:null,held:false,flick:0,rx0:0,hp0:1},SOFT={t:null,at:-9};
function lockable(p){return!p.gone&&!p.boss&&!p.follow&&!p.crew}
const lockHostile=p=>p.state==='cop'||p.angry>0||p.brawl>0||(p.gang!=null&&respect[p.gang]<=-2)||!!p.target;
// best person to lock onto: near the way you (or the camera) face, hostiles first; side=-1/1 flicks to the next one left/right
function pickLock(baseA,cur,side){let best=null,bs=1e9;const ca=cur?Math.atan2(cur.y-player.y,cur.x-player.x):baseA;
  for(const p of peds){if(p===cur||!lockable(p))continue;const dx=p.x-player.x,dy=p.y-player.y,d=hyp(dx,dy);if(d>400||d<6)continue;
    const a=Math.atan2(dy,dx);let sc;
    if(side){const r=angDiff(a,ca)*side;if(r<=0.02||r>1.6)continue;sc=r+d/1600;}
    else{const da=Math.abs(angDiff(a,baseA));if(da>1.05)continue;sc=da+d/900-(lockHostile(p)?0.45:0);}
    if(sc<bs&&los(player.x,player.y,p.x,p.y)){bs=sc;best=p;}}
  return best;}
function setLock(p){LOCK.t=p;if(p){LOCK.hp0=Math.max(p.hp,1);sfx('door',0.25);}}
function footLook(dt){
  if(!GTA3MOVE()){LOCK.t=null;cam.base=null;return;}
  // coming out of a car, or teleported (respawn, interiors, the subway): start from where the camera or you face
  const jumped=hyp(player.x-cam.px,player.y-cam.py)>160;
  if(cam.base==null||!cam.wasFoot)cam.base=cam.yaw;
  if(jumped)cam.base=player.body;
  cam.wasFoot=true;cam.px=player.x;cam.py=player.y;
  const held=!WEAPONS[player.w].scope&&((mouse.rdown&&!touchMode)||(pad.on&&(OPT.pad==='classic'?pad.lock:pad.brake>0.5)));
  if(held&&!LOCK.held)setLock(pickLock(cam.base,null,0));
  LOCK.held=held;if(!held)LOCK.t=null;
  if(LOCK.t&&(!lockable(LOCK.t)||hyp(LOCK.t.x-player.x,LOCK.t.y-player.y)>480))LOCK.t=null;
  let orbit=0;
  if(LOCK.t){// drag the mouse or flick the right stick to switch targets
    LOCK.flick+=(mouse.turn||0)+(mouse.look||0)*0.5;if(Math.abs(LOCK.flick)>45){const n=pickLock(cam.base,LOCK.t,Math.sign(LOCK.flick));if(n)setLock(n);LOCK.flick=0;}
    if(pad.on&&Math.abs(pad.rx)>0.7&&Math.abs(LOCK.rx0)<=0.7){const n=pickLock(cam.base,LOCK.t,Math.sign(pad.rx));if(n)setLock(n);}
    const ta=Math.atan2(LOCK.t.y-player.y,LOCK.t.x-player.x);cam.base=lerpAng(cam.base,ta,Math.min(1,dt*7));cam.idle=0;}
  else if(SCOPE.on&&touchMode&&aimJoy.active){orbit=aimJoy.x*1.6*dt/SCOPE.z;cam.pitch=clamp((cam.pitch||0)+aimJoy.y*1.1*dt/SCOPE.z,-0.95,0.95);}
  else{LOCK.flick=0;orbit=(mlLocked()?(mouse.look||0)*0.0033:(mouse.turn||0)*0.006)*(OPT.msens||1)/(SCOPE.on?SCOPE.z:1)+(pad.on?pad.rx*2.9*dt/(SCOPE.on?SCOPE.z:1):0);if(SCOPE.on&&!mlLocked())orbit+=(mouse.turn||0)*0.003;}
  LOCK.rx0=pad.on?pad.rx:0;mouse.turn=0;mouse.look=0;
  if(orbit){cam.base+=orbit;cam.idle=0;}else cam.idle+=dt;
  // after a moment without touching the camera it drifts back behind you while you move (but not when you run at it)
  if(!LOCK.t&&!mlLocked()&&cam.idle>0.7&&player.moving){const d=Math.abs(angDiff(player.body,cam.base));if(d<2.1)cam.base=lerpAng(cam.base,player.body,Math.min(1,dt*2.4*(1-d/2.4)));}
}
function baseScale(){return clamp(Math.sqrt(VW*VH)/900*(VH>VW?0.86:1),0.5,2.2)}

// ================= UPDATE =================
function update(dt){
  game.t+=dt;
  const s0=stars();
  // ---- player ----
  if(game.state==='play'){
    player.cool-=dt;player.hurt=Math.max(0,player.hurt-dt);
    if(pressed.swap)swapWeapon(pressed.swap===-1?-1:1);
    if(pressed.enter&&player.riding)trainAlight();
    else if(pressed.enter&&!player.riding){if(player.car)exitCar(false);else if(!trainBoard())tryEnterCar();}
    if(player.riding){rideTick(dt);}else if(!player.car){
      footLook(dt);
      let fwd=0,turn=0;
      if(kd.KeyW||kd.ArrowUp)fwd+=1;if(kd.KeyS||kd.ArrowDown)fwd-=1;if(kd.KeyA||kd.ArrowLeft)turn-=1;if(kd.KeyD||kd.ArrowRight)turn+=1;
      if(joy.active){fwd=clamp(-joy.y*1.3,-1,1);turn=Math.abs(joy.x)>0.18?clamp(joy.x*1.3,-1,1):0;}
      if(pad.on&&(pad.lx||pad.ly)){fwd=clamp(-pad.ly*1.15,-1,1);turn=clamp(pad.lx*1.2,-1,1);}
      if(GTA3MOVE()){
        // GTA III-style: the stick / WASD point where to go relative to the camera, and you turn to run that way
        let ix=0,iy=0;if(kd.KeyW||kd.ArrowUp)iy+=1;if(kd.KeyS||kd.ArrowDown)iy-=1;if(kd.KeyA||kd.ArrowLeft)ix-=1;if(kd.KeyD||kd.ArrowRight)ix+=1;
        if(joy.active){ix=joy.x*1.3;iy=-joy.y*1.3;}
        if(pad.on&&(pad.lx||pad.ly)){ix=pad.lx*1.15;iy=-pad.ly*1.15;}
        const mag=Math.min(1,hyp(ix,iy));fwd=0;turn=0;
        if(mag>0.12){const dirA=(cam.base!=null?cam.base:cam.yaw)+Math.atan2(ix,iy);
          // on a ladder only the push into it (or away from it) counts
          if(climbPre(mag*Math.cos(angDiff(dirA,player.body)),dt)){fwd=0;}
          else{player.body=lerpAng(player.body,dirA,Math.min(1,dt*(LOCK.t?30:13)));fwd=mag*Math.max(0.25,Math.cos(angDiff(dirA,player.body)));
            if(LOCK.t){player.body=dirA;fwd=mag;}}}
        else climbPre(0,dt);
      }else{
      if(climbPre(fwd,dt)){fwd=0;turn=0;}
      // hold the right mouse button and drag to turn
      if(mouse.turn){player.body+=mouse.turn*0.006*(OPT.msens||1);mouse.turn=0;}
      player.body+=clamp(turn,-1.5,1.5)*2.8*dt;}
      // sprint: hold SHIFT (or click the left stick, or push the touch stick all the way)
      const run=fwd>0.5&&(kd.ShiftLeft||kd.ShiftRight||(joy.active&&hyp(joy.x,joy.y)>0.97)||(pad.on&&pad.run)),m=Math.abs(fwd)*(run?1.35:1),sp=fwd<0?115:run?245:168,mx=Math.cos(player.body)*fwd,my=Math.sin(player.body)*fwd;
      player.vx=lerp(player.vx,mx*sp,Math.min(1,dt*14));player.vy=lerp(player.vy,my*sp,Math.min(1,dt*14));
      const ox0=player.x,oy0=player.y;player.x+=player.vx*dt;player.y+=player.vy*dt;
      {let[fl,onCar]=footFloor(player.x,player.y,player.jz);
        // fire escape railings: you can't just walk off the edge (jump to go over them)
        if(player.onFE&&player.jv<=0&&player.jz-fl>9){player.x=ox0;player.y=oy0;player.vx*=0.2;player.vy*=0.2;[fl,onCar]=footFloor(player.x,player.y,player.jz);}
        player.onFE=FOOT_FE&&player.jz-fl<6;
        if(onCar&&player.jz>=fl-1.5&&player.jv<=0){player.x+=onCar.vx*dt;player.y+=onCar.vy*dt;}
        const grounded=player.jz<=fl+0.6&&player.jv<=0;
        if((kd.Space||tbtn.brake.on)&&grounded&&!player.jumpHeld){player.jv=180;player.jz=Math.max(player.jz,fl)+0.01;sfx('door',0.4);}
        player.jumpHeld=!!(kd.Space||tbtn.brake.on);
        // walking down stairs or a slope: stay on it rather than floating off and falling
        if(player.jv===0&&player.wasGrounded&&player.jz>fl+0.6&&player.jz-fl<=8.5){player.jz=fl;}
        player.wasGrounded=player.jv===0&&player.jz<=fl+0.6;
        if(player.jv!==0||player.jz>fl+0.6){player.peak=Math.max(player.peak||0,player.jz);player.jz+=player.jv*dt;player.jv-=640*dt;if(player.jz<=fl&&player.jv<=0){player.jz=fl;player.jv=0;
            const drop=(player.peak||0)-fl;if(drop>110&&game.state==='play'){hurtPlayer(Math.round((drop-110)*0.45));sfx('crash',0.4);if(drop>200)note('Ouch. That was a long way down');}player.peak=fl;}}
        else{if(fl>player.jz&&fl-player.jz<=8.5)player.jz=fl;player.peak=player.jz;}} // step up as far as footFloor looks (z+8)
      circleTiles(player,7,player.jz>4,player.jz);
      player.moving=m>0.1&&player.jz<=0;
      if(player.moving){const a0=player.anim;player.anim+=dt*m*13;if(Math.floor(a0/PI)!==Math.floor(player.anim/PI))sfx('step',run?1.3:1);}
      if(mouse.used&&!touchMode){const [wx,wy]=aimPoint();player.a=Math.atan2(wy-player.y,wx-player.x);}
      else player.a=lerpAng(player.a,player.body,Math.min(1,dt*14));
      if(aimJoy.active&&hyp(aimJoy.x,aimJoy.y)>0.3)player.a=joyAng(aimJoy);else if(pad.aim&&!GTA3MOVE())player.a=pad.aimA;
      if(LOCK.t)player.a=Math.atan2(LOCK.t.y-player.y,LOCK.t.x-player.x);
      const held=mouse.down||kd.KeyK||kd.ControlLeft||kd.ControlRight||tbtn.fire.on||(!SCOPE.on&&aimJoy.active&&hyp(aimJoy.x,aimJoy.y)>0.6);
      const w=WEAPONS[player.w],charging=w.kind==='m'&&!(mouse.used&&!touchMode&&!aimJoy.active);
      if(charging){if(held)throwCharge=Math.min(1,throwCharge+dt/0.9);else if(fireWasHeld){playerFire();throwCharge=0;}}
      else if(held)playerFire();
      fireWasHeld=held;climbPost();
    }else{
      const c=player.car;
      let thr=0,st=0;
      if(kd.KeyW||kd.ArrowUp)thr+=1;if(kd.KeyS||kd.ArrowDown)thr-=1;if(kd.KeyA||kd.ArrowLeft)st-=1;if(kd.KeyD||kd.ArrowRight)st+=1;
      if(joy.active&&OPT.steer==='wheel'){st=clamp(joy.x*1.5,-1,1);thr=0;}
      else if(joy.active){const m=Math.min(1,hyp(joy.x,joy.y));thr=0;st=0;
        if(m>0.2){const want=joyAng(joy),diff=angDiff(want,c.a);
          if(Math.abs(diff)<2.4){thr=m;st=clamp(diff*2.2,-1,1);if(Math.abs(diff)>1.2&&hyp(c.vx,c.vy)>260)thr=0.25;}
          else{thr=-m;st=clamp(-angDiff(want,c.a+PI)*2,-1,1);}}}
      if(tbtn.gas.on)thr=1;if(tbtn.rev.on)thr=-1;
      if(pad.on&&(pad.gas>0.04||pad.brake>0.04||pad.lx)){thr=pad.gas-pad.brake;if(Math.abs(thr)<0.04)thr=0;st=clamp(pad.lx*1.1,-1,1);}
      const hb=!!(kd.Space||tbtn.brake.on);
      driveCar(c,thr,st,hb,dt);
      if(mouse.down||kd.KeyK||kd.ControlLeft||kd.ControlRight||tbtn.fire.on||(aimJoy.active&&hyp(aimJoy.x,aimJoy.y)>0.6)){if(c.t.fire)waterCannon(dt);else playerFire();}
    }
  }else{
    game.timer-=dt;
    if(player.car)driveCar(player.car,0,0,true,dt);
    if(game.timer<=0){
      if(game.state==='wasted'){addMoney(-Math.min(money,200));respawnAt(wastedSpot());note('Hospital bill: -$200');}
      else{addMoney(-Math.min(money,Math.round(money*0.1)+100));respawnAt(nearestOf(STATIONS));note('Bail paid. Weapons confiscated.');}
    }
  }
  pressed.enter=pressed.swap=false;
  extTick(dt);

  // ---- AI cars ----
  const actR=viewR+900,actR2=actR*actR;
  const active=[];
  for(const c of cars){
    if(dist2(c.x,c.y,player.x,player.y)>actR2&&c!==player.car&&c.driver!=='race')continue;
    active.push(c);
    if(c.wreck){c.wreckT+=dt;driveCar(c,0,0,true,dt);}
    else if(c.driver==='ai'||c.driver==='cop'){
      if(!c.ai)acquireLane(c);
      if(c.driver==='cop'&&(c.ai.mode==='lane'||c.ai.mode==='diag')&&stars()>0&&dist2(c.x,c.y,player.x,player.y)<650*650)c.ai.mode='chase';
      if(c.ai.mode==='chase'&&stars()===0)acquireLane(c);
      if(c.ai.mode==='chase')aiChase(c,dt);else if(c.ai.mode==='diag')aiDiag(c,dt);else aiLane(c,dt);
      if(c.t.tank&&c.driver==='cop'){const tg=player.car||player,want=Math.atan2(tg.y-c.y,tg.x-c.x);c.turret=lerpAng(c.turret==null?c.a:c.turret,want,Math.min(1,dt*2.5));
        c.shootT-=dt;const d=hyp(tg.x-c.x,tg.y-c.y);if(game.state==='play'&&c.shootT<=0&&d<480&&Math.abs(angDiff(want,c.turret))<0.15&&los(c.x,c.y,tg.x,tg.y)){c.shootT=rr(2.4,3.4);fireBullet(c.x+Math.cos(c.turret)*42,c.y+Math.sin(c.turret)*42,c.turret,560,'cop',0,'r',0);sfx('boom',0.35);shake=Math.max(shake,4);}}
      else if(game.state==='play'&&((c.gang!=null&&respect[c.gang]<=-3)||(c.driver==='cop'&&c.ai&&c.ai.mode==='chase'&&(stars()>=4||c.t.fbi||c.t.army)))){
        c.shootT-=dt;const tg=player.car||player,d=hyp(tg.x-c.x,tg.y-c.y);
        if(c.shootT<=0&&d<260&&los(c.x,c.y,tg.x,tg.y)){c.shootT=rr(.9,1.6);const aa=npcAim(Math.atan2(tg.y-c.y,tg.x-c.x),true);
          fireBullet(c.x+Math.cos(aa)*(c.t.Wd/2+8),c.y+Math.sin(aa)*(c.t.Wd/2+8),aa,850,c.driver==='cop'?'cop':'gang',6,'b',5);sfx('smg',nearPlayer(c.x,c.y,600)?0.5:0.2);}}
    }else if(c.driver==='copboat'){copBoatAI(c,dt);
    }else if(c.driver==='race'){raceAI(c,dt);
    }else if(c.driver!=='player'){
      if(Math.abs(c.vx)+Math.abs(c.vy)>1||Math.abs(c.va)>0.01)driveCar(c,0,0,true,dt);
    }
    // integrate
    carRamps(c);carAir(c,dt);
    if(!(c.air>0)&&!c.t.tank&&!c.t.boat&&!c.t.heli&&(c.driver||Math.abs(c.vx)+Math.abs(c.vy)>30)){const gx=GH(c.x+10,c.y)-GH(c.x-10,c.y),gy=GH(c.x,c.y+10)-GH(c.x,c.y-10);
      // hills: the GTA2-tuned engines are built for flat ground, so a driven car only feels part of the slope (it
      // pulls up hills instead of bogging down, and still runs a little faster downhill); empty cars roll freely
      const up=(gx*Math.cos(c.a)+gy*Math.sin(c.a))>0,k=c.driver?(up?0.3:0.6):1;c.vx-=gx/20*560*k*dt;c.vy-=gy/20*560*k*dt;}
    c.x+=c.vx*dt;c.y+=c.vy*dt;if(!c.driven){c.a+=c.va*dt;c.va*=Math.exp(-5*dt);}c.driven=false;
    carTiles(c);
    carCircles(c);
    c.flash-=dt;
    // skids
    if(c.skid&&!c.wreck&&!c.t.boat){
      const ca=Math.cos(c.a),sa=Math.sin(c.a),bx=-ca*c.t.L*0.32,by=-sa*c.t.L*0.32,ox=-sa*c.t.Wd*0.38,oy=ca*c.t.Wd*0.38;
      const w1=[c.x+bx+ox,c.y+by+oy],w2=[c.x+bx-ox,c.y+by-oy];
      if(R()<0.3)puff(w1[0],w1[1],rr(-15,15),rr(-15,15),rr(.5,.9),rr(4,7),'#9a9a9a','smoke');
      if(c.sp){if(dist2(c.sp[0][0],c.sp[0][1],w1[0],w1[1])>36){addSkid(c.sp[0][0],c.sp[0][1],w1[0],w1[1]);addSkid(c.sp[1][0],c.sp[1][1],w2[0],w2[1]);c.sp=[w1,w2];}}
      else c.sp=[w1,w2];
    }else c.sp=null;
    // burning / smoke
    if(c.burn>=0){c.burn-=dt;for(let k=0;k<2;k++)puff(c.x+rr(-c.t.L/3,c.t.L/3),c.y+rr(-8,8),rr(-20,20),rr(-40,-10),rr(.3,.6),rr(6,11),pick(['#ff7a00','#ffb300','#ff4400']),'fire');
      if(R()<0.3)puff(c.x,c.y,rr(-15,15),rr(-30,-5),rr(1,2),rr(10,16),'#333','smoke');
      if(c.burn<0)carExplode(c);}
    else if(!c.wreck&&c.hp<c.t.hp*0.35){c.smokeT-=dt;if(c.smokeT<=0){c.smokeT=0.08;const ca=Math.cos(c.a),sa=Math.sin(c.a);puff(c.x+ca*c.t.L*0.35,c.y+sa*c.t.L*0.35,rr(-10,10),rr(-25,-5),rr(.8,1.4),rr(6,10),c.hp<c.t.hp*0.15?'#2a2a2a':'#888','smoke');}}
    else if(c.wreck&&R()<0.15)puff(c.x+rr(-8,8),c.y+rr(-8,8),rr(-8,8),rr(-20,-5),rr(1.5,2.5),rr(8,14),'#333','smoke');
  }
  for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++)carPair(active[i],active[j]);
  if(player.car){player.x=player.car.x;player.y=player.car.y;player.a=player.car.a;}

  // ---- peds ----
  for(const p of peds){
    if(p.gone)continue;
    if(dist2(p.x,p.y,player.x,player.y)>actR2)continue;
    updatePed(p,dt);
    for(const c of active){
      if(c.air>0||(c.t.heli&&c.alt>8)||dist2(c.x,c.y,p.x,p.y)>(c.t.L/2+12)**2)continue;
      for(const cc of c.cc){
        const dx=p.x-cc[0],dy=p.y-cc[1],d2=dx*dx+dy*dy,rs=c.t.Wd/2+7;
        if(d2<rs*rs){const d=Math.sqrt(d2)||1,nx=dx/d,ny=dy/d;
          const sp=hyp(c.vx,c.vy),toward=c.vx*nx+c.vy*ny;
          if(sp>70&&toward>28&&!c.wreck&&!(p===player)){const pl=c.driver==='player';killPed(p,pl?'player':null,c.vx*0.8+nx*110,c.vy*0.8+ny*110);addMark({k:'blood',x:p.x,y:p.y,r:rr(5,9)});if(pl){sfx('splat',1);shake=Math.max(shake,3);if(sp>220)chaos();}c.vx*=0.97;c.vy*=0.97;break;}
          p.x+=nx*(rs-d);p.y+=ny*(rs-d);
          if(sp>40&&!p.cop&&p.state!=='flee'){p.state='flee';p.panic=4;p.fx=c.x;p.fy=c.y;}
        }
      }
      if(p.gone)break;
    }
  }
  for(const c of active){if(c.wreck||!c.driver)continue;const sp=hyp(c.vx,c.vy);if(sp<160)continue;const ca=Math.cos(c.a),sa=Math.sin(c.a);
    for(const p of peds){if(p.gone||p.cop||p.state==='flee'||p.dodged)continue;const dx=p.x-c.x,dy=p.y-c.y,f=dx*ca+dy*sa;if(f<20||f>110)continue;const lat=-dx*sa+dy*ca;if(Math.abs(lat)>c.t.Wd)continue;
      p.dodged=true;if(R()<0.55){const s2=lat>=0?1:-1;p.state='flee';p.panic=rr(2,4);p.fx=p.x+sa*s2*40;p.fy=p.y-ca*s2*40;p.x+=-sa*s2*10;p.y+=ca*s2*10;}}}
  // player on foot vs cars
  if(!player.car&&!player.riding&&game.state==='play'){
    for(const c of active){
      if(dist2(c.x,c.y,player.x,player.y)>(c.t.L/2+12)**2)continue;
      for(const cc of c.cc){
        const dx=player.x-cc[0],dy=player.y-cc[1],d2=dx*dx+dy*dy,rs=c.t.Wd/2+7;
        if(d2<rs*rs){const d=Math.sqrt(d2)||1,nx=dx/d,ny=dy/d;
          const toward=c.vx*nx+c.vy*ny;
          if(player.jz>carRoof(c)-5)continue;
          player.x+=nx*(rs-d);player.y+=ny*(rs-d);
          if(toward>150&&!c.wreck){hurtPlayer((toward-150)*0.18);player.vx=nx*toward*0.8;player.vy=ny*toward*0.8;addMark({k:'blood',x:player.x,y:player.y,r:6});sfx('splat',0.6);}
        }
      }
    }
    circleTiles(player,7,player.jz>4,player.jz);
  }
  // bust timer
  if(game.state==='play'){
    if(bustT>0){bustT-=dt*0.55;if(bustT>1.3){bustT=0;bustNote=false;busted();}}else{bustT=0;bustNote=false;}
  }
  updateHeli(dt);updateFares(dt);updateJobs(dt);if(game.state==='play')updatePackages();menuTick(dt);
  updateBullets(dt);
  updateFires(dt);

  // ---- wanted (GTA2-style) ----
  if(heat>0&&stars()===0){heat=Math.max(0,heat-30*dt);}
  if(heat>0&&game.state==='play'){
    const s=stars(),tg=player.car||player;
    let seen=false;const SK=sightK()*(stars()<=2?0.75:1);
    for(const c of active)if(c.driver==='cop'&&c.ai&&c.ai.mode==='chase'&&dist2(c.x,c.y,tg.x,tg.y)<(620*SK)**2&&los(c.x,c.y,tg.x,tg.y)){seen=true;break;}
    if(!seen)for(const p of peds)if(p.cop&&p.state==='cop'&&!p.gone&&dist2(p.x,p.y,tg.x,tg.y)<(520*SK)**2&&los(p.x,p.y,tg.x,tg.y)){seen=true;break;}
    if(!seen&&heliSees())seen=true;if(!seen&&boatSeesPlayer(tg))seen=true;
    if(seen){seenT=0;lastSeenX=tg.x;lastSeenY=tg.y;}else seenT+=dt;
    evadeT=seenT;
    // GTA III rules: one star fades if they lose you; two or more stay until a spray shop, a bribe or getting busted/wasted
    if(s<=1&&seenT>5){clearHeat();note('You lost the cops');}
    else if(s>=2&&seenT>8&&!stickyNote){stickyNote=true;note('They lost sight of you, but your stars stay. Find a spray shop or a cop bribe');}
    if(seenT<1)stickyNote=false;
    ffT-=dt;if(ffT<=0){ffT=0.35;buildFF(seen||seenT<1?tg.x:lastSeenX,seen||seenT<1?tg.y:lastSeenY);}
    // dispatch crews for this level, dismiss ones that don't belong
    const want=DISPATCH[s]||{},have={};
    for(const c of cars)if(c.driver==='cop'&&c.ai&&c.ai.mode==='chase'&&!c.wreck){const k=COPKIND(c);have[k]=(have[k]||0)+1;
      if((have[k])>(want[k]||0)){acquireLane(c);c.traffic=true;have[k]--;}}
    copSpawnT-=dt;
    if(copSpawnT<=0)for(const k in want)if((have[k]||0)<want[k]){if(spawnTraffic(KIND_TYPE[k],true))copSpawnT=s>=4?2.4:s>=3?3.8:7;break;}
    // roadblocks from 3 stars
    roadblockT-=dt;
    if(s>=3&&roadblockT<=0&&player.car&&hyp(player.car.vx,player.car.vy)>150){
      if(spawnRoadblock(s))roadblockT=rr(18,28);else roadblockT=2;
    }
  }
  if(stars()>s0&&s0>=0)starFlash=1.2;
  starFlash=Math.max(0,starFlash-dt);

  // ---- spawn / despawn ----
  viewR=760;
  let nTraffic=0;for(const c of cars)if(c.traffic&&c.driver)nTraffic++;
  const wantTraffic=Math.round(clamp(viewR/30,18,34));
  if(nTraffic<wantTraffic)spawnTraffic(false,false);
  const despR=viewR+800;
  cars=cars.filter(c=>{
    if(c===player.car||c.vip)return true;
    const d2=dist2(c.x,c.y,player.x,player.y);
    if(c.wreck&&c.wreckT>40&&d2>(viewR+100)**2)return false;
    if(c.driver==='cop'&&c.ai&&c.ai.mode==='chase'&&heat>0&&d2<2600*2600)return true;
    if((c.traffic||(c.special&&!(c.ai&&c.ai.mode==='chase')))&&d2>despR*despR&&!(mission&&mission.car===c))return false;
    return true;
  });
  const busy=districtAt(player.x,player.y)==='TIMES SQUARE'?1.7:zoneOf(player.x,player.y)===-1?1.35:1,wantPeds=Math.round(clamp(viewR/18,30,55)*busy*(clock>0.96||clock<0.24?0.6:1));
  let nPeds=0;for(const p of peds)if(!p.gone)nPeds++;
  if(nPeds<wantPeds){spawnPed();spawnPed();}
  peds=peds.filter(p=>!p.gone&&(p.target||dist2(p.x,p.y,player.x,player.y)<(viewR+600)**2));

  // ---- pickups ----
  syncSafePickups();
  for(const k of pickups){
    if(k.sh&&!k.sh.owned)continue;
    if(k.taken){k.t-=dt;if(k.t<=0)k.taken=false;continue;}
    if(game.state==='play'&&dist2(k.x,k.y,player.x,player.y)<(player.car?30:20)**2){
      if(k.kind==='health'&&player.hp>=100)continue;
      if(k.kind==='bribe'){if(heat<=0)continue;const st=stars();heat=TH[st-1];if(heat<=0)clearHeat();note('Cop bribe: -1 wanted level');}
      else if(k.kind==='dual'){player.ammo[6]+=60;player.w=6;note('Dual pistols +60');}
      else if(k.kind==='frenzy'){if(frenzy)continue;startFrenzy();}
      else if(k.kind==='smg'){player.ammo[1]+=120;player.w=1;note('SMG +120');}
      else if(k.kind==='shotgun'){player.ammo[2]+=24;player.w=2;note('Shotgun +24');}
      else if(k.kind==='flame'){player.ammo[3]+=300;player.w=3;note('Flamethrower');}
      else if(k.kind==='molotov'){player.ammo[4]+=6;player.w=4;note('Molotovs +6');}
      else if(k.kind==='rocket'){player.ammo[5]+=5;player.w=5;note('Rocket launcher +5');}
      else if(k.kind==='grenade'){const g=GRENIDX();player.ammo[g]=(player.ammo[g]||0)+8;player.w=g;note('Grenades +8');}
      else if(k.kind==='armor'){if(player.armor>=100)continue;player.armor=100;note('Body armor');}
      else if(k.kind==='health'){player.hp=Math.min(PMAX(),player.hp+50);note('Health +50');}
      else if(k.kind==='cash'){const n=Math.round(rr(2,6))*50;addMoney(n);note('Found $'+n);}
      k.taken=true;k.t=k.kind==='frenzy'?150:k.kind==='bribe'?90:60;sfx('pickup');
    }
  }
  // ---- phones / missions ----
  if(!mission){
    if(ringing<0){ringT-=dt;if(ringT<=0){
      const cand=phones.map((p,i)=>i).filter(i=>{const d=hyp(phones[i].x-player.x,phones[i].y-player.y);return d>T*6&&(phones[i].gang<0||respect[phones[i].gang]>-2);});
      if(firstRing)cand.sort((a,b)=>dist2(phones[a].x,phones[a].y,player.x,player.y)-dist2(phones[b].x,phones[b].y,player.x,player.y));
      ringing=cand.length?(firstRing?cand[0]:pick(cand)):0;firstRing=false;
      const pg=phones[ringing].gang;note(pg>=0?'☎ '+GANGS[pg].name+' are calling a payphone':'☎ A payphone is ringing');}}
    else{
      const ph=phones[ringing];
      ringSoundT-=dt;if(ringSoundT<=0){ringSoundT=1.6;if(nearPlayer(ph.x,ph.y,450))sfx('ring',clamp(1-hyp(ph.x-player.x,ph.y-player.y)/450,0.2,1));}
      if(game.state==='play'&&!player.car&&dist2(ph.x,ph.y,player.x,player.y)<26*26){const g=ph.gang;ringing=-1;startMission(g);}
    }
  }else if(game.state==='play'){
    mission.timer-=dt;
    if(mission.type==='deliver'){
      if(player.car&&dist2(mission.x,mission.y,player.x,player.y)<75*75&&hyp(player.car.vx,player.car.vy)<90)missionPass();
    }else if(mission.type==='hit'){
      if(!mission.car||cars.indexOf(mission.car)<0){missionFail();}
      else if(mission.car.driver==='player'){note('Wreck it, don\'t drive it!');}
    }else if(mission.type==='cases'){
      for(const it of mission.items)if(!it.got&&dist2(it.x,it.y,player.x,player.y)<(player.car?34:22)**2){it.got=true;sfx('pickup');const left=mission.items.filter(i=>!i.got).length;note(left?left+' briefcase'+(left>1?'s':'')+' left':'Got them all!');}
      if(mission&&mission.items.every(i=>i.got))missionPass();
    }else if(mission.type==='escape'){
      mission.elapsed+=dt;if(stars()===0&&mission.elapsed>2)missionPass();
    }else if(mission.type==='turf'){
      if(mission.left<=0)missionPass();
    }
    if(mission&&mission.type==='story')storyTick(dt);
    if(mission&&mission.timer<=0)missionFail();
  }
  // ---- spray shop ----
  sprayCool-=dt;
  if(player.car&&game.state==='play'&&sprayCool<=0){
    for(const sp of sprayPads)if(dist2(sp.x,sp.y,player.x,player.y)<60*60&&hyp(player.car.vx,player.car.vy)<120){
      if(heat>0||player.car.hp<player.car.t.hp){
        if(money>=500){addMoney(-500);clearHeat();player.car.hp=player.car.t.hp;player.car.col=pick(player.car.t.cols.length>1?player.car.t.cols:CT.sedan.cols);
          for(let k=0;k<40;k++)puff(player.x+rr(-40,40),player.y+rr(-40,40),rr(-20,20),rr(-20,20),rr(.5,1.2),rr(8,16),'#e8e8e8','smoke');
          sfx('spray');showBig('RESPRAYED','Wanted level cleared · -$500','#3ee07a',2.2);}
        else{sfx('deny');note('Spray costs $500');}
        sprayCool=4;
      }
    }
  }
  // ---- crusher ----
  if(player.car&&game.state==='play'&&sprayCool<=0){
    for(const cp of crusherPads)if(dist2(cp.x,cp.y,player.x,player.y)<55*55&&hyp(player.car.vx,player.car.vy)<60&&!player.car.vip){
      const c=player.car,val=({compact:250,sedan:350,taxi:350,truck:600,sports:900,police:1200,swat:1500})[c.type]||300;
      const pay=Math.round(val*clamp(0.4+0.6*c.hp/c.t.hp,0.4,1));
      exitCar(true);cars.splice(cars.indexOf(c),1);
      for(let k=0;k<18;k++)puff(cp.x+rr(-30,30),cp.y+rr(-30,30),rr(-220,220),rr(-220,220),rr(.5,1),rr(3,6),c.col,'debris');
      shake=14;sfx('crash');sfx('boom',0.4);addMoney(pay);showBig('CRUSHED','+$'+pay.toLocaleString(),'#3ee07a',2.2);sprayCool=3;break;
    }
  }
  // ---- frenzy / combo / zones / weather ----
  if(frenzy&&game.state==='play'){frenzy.timer-=dt;if(frenzy.timer<=0){showBig('FRENZY FAILED','','#ff4040',2.4);sfx('fail');frenzy=null;}}
  if(combo.t>0){combo.t-=dt;if(combo.t<=0)combo.n=0;}
  for(const h of hitMarks)h.t-=dt;hitMarks=hitMarks.filter(h=>h.t>0);
  if(!inHall(player.x,player.y)&&!ROOM){const z=zoneOf(player.x,player.y),dn=districtAt(player.x,player.y),key=z+'|'+dn;if(key!==curZone){const zc=z!==Math.floor((curZone+'').split('|')[0]);curZone=key;
    if(dn&&dn!=='RIVER BRIDGE')zoneBanner={text:dn,sub:z>=0?GANGS[z].name+' turf':'Downtown',col:'#ffe9a8',t:2.6};else if(zc||dn==='RIVER BRIDGE')zoneBanner={text:dn||(z>=0?GANGS[z].name.toUpperCase()+' TURF':'DOWNTOWN'),sub:z>=0?respectLabel(z):'Police HQ district',col:dn?'#ffe9a8':z>=0?GANGS[z].col:'#cfd6e0',t:2.6};}}
  if(zoneBanner&&!big){zoneBanner.t-=dt;if(zoneBanner.t<=0)zoneBanner=null;}
  if(radioBanner){radioBanner.t-=dt;if(radioBanner.t<=0)radioBanner=null;}
  clock=(clock+dt/420)%1;
  {const lightLvl=0.5-0.5*Math.cos(clock*TAU);
  weatherT-=dt;if(weatherT<=0){weatherT=rr(50,110);rainTarget=R()<0.4?rr(.6,1):0;if(rainTarget>0&&rain<0.1)note("It's starting to rain. Roads are slick.");}
  rain=lerp(rain,rainTarget,Math.min(1,dt*0.3));
  darkness=clamp((0.62-lightLvl)/0.62,0,1)*0.8+rain*0.12;}
  if(rain>0.7&&R()<dt*0.025){lightning=1;setTimeout(()=>sfx('thunder'),rr(200,900));}
  lightning=Math.max(0,lightning-dt*3);
  for(const d of drops){d.y+=dt*1000;d.x-=dt*250;if(d.y>VH+20){d.y=-20-R()*40;d.x=R()*(VW+250);}}
  for(const f of flyers){f.t-=dt;f.b.x+=f.vx*dt;f.b.y+=f.vy*dt;f.vx*=Math.exp(-4*dt);f.vy*=Math.exp(-4*dt);f.b.a+=f.va*dt;
    if(solidPx(f.b.x,f.b.y)){f.vx*=-0.4;f.vy*=-0.4;f.b.x+=f.vx*dt*2;f.b.y+=f.vy*dt*2;}
    if(f.t<=0){addMark({k:'blood',x:f.b.x,y:f.b.y,r:rr(9,14)});addMark(f.b);}}
  flyers=flyers.filter(f=>f.t>0);
  // ---- particles ----
  for(const p of parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.type==='smoke'){p.vx*=0.97;p.vy*=0.97;p.size+=dt*10}else if(p.type==='debris'||p.type==='spark'){p.vx*=0.92;p.vy*=0.92}else if(p.type==='fire'){p.vx*=0.93;p.vy*=0.93}}
  parts=parts.filter(p=>p.life>0);
  if(big){big.t-=dt;if(big.t<=0)big=null;}
  for(const t of ticker)t.t-=dt;while(ticker.length&&ticker[0].t<=0)ticker.shift();
  if(moneyPop){moneyPop.t-=dt;if(moneyPop.t<=0)moneyPop=null;}
  shake=Math.max(0,shake-dt*30);

  // ---- camera ----
  // chase camera: sits behind the car (or you) and swings round as you turn
  SCOPE.on=scopeWanted();
  if(SCOPE.on){const w=WEAPONS[player.w];if(SCOPE.zw){SCOPE.z=clamp(SCOPE.z*(SCOPE.zw<0?1.25:0.8),1.3,w.scope*1.6);SCOPE.zw=0;}else if(SCOPE.z<1.2)SCOPE.z=w.scope;
    const py=(mouse.lookY||0)*0.0028*(OPT.msens||1)*(OPT.invertY?-1:1)/SCOPE.z+(pad.on?pad.ry*1.2*dt*(OPT.invertY?-1:1)/SCOPE.z:0);mouse.lookY=0;
    cam.pitch=clamp((cam.pitch||0)+py,-0.95,0.95);cam.pidle=0;
    if(cam.base!=null){cam.yaw=cam.base;}player.a=player.body=cam.yaw;
    cam.dist=0.5;cam.x=player.x-Math.cos(cam.yaw)*0.5;cam.y=player.y-Math.sin(cam.yaw)*0.5;cam.gz=GH(player.x,player.y);cam.h=(player.jz||0)+27;}
  else{if(SCOPE.z>1.2){SCOPE.z=1;cam.pitch=clamp(cam.pitch||0,-0.5,0.62);cam.dist=40;}}
  if(!SCENE.on&&!SCOPE.on){let want,dist,hgt,rate;
    if(player.car||player.riding){cam.wasFoot=false;LOCK.t=null;}
    if(player.car){const c=player.car,s=hyp(c.vx,c.vy),big=c.t.truck||c.t.tank||c.t.swat;
      // mouse (captured) or right stick swing the camera round the car; it drifts back behind you once you leave it alone and drive
      const orb=(mouse.look||0)*0.0033*(OPT.msens||1)+(pad.on&&OPT.pad==='classic'?pad.rx*2.6*dt:0);mouse.look=0;
      if(orb){cam.corb=angDiff((cam.corb||0)+orb,0);cam.cidle=0;}else{cam.cidle=(cam.cidle||0)+dt;if(cam.cidle>1.2&&s>40)cam.corb=lerpAng(cam.corb||0,0,Math.min(1,dt*1.8));}
      want=c.a+(cam.corb||0);
      dist=94+Math.min(56,s*0.075)+(big?28:0);hgt=42+Math.min(14,s*0.02)+(big?12:0);rate=orb?30:3.2;
      // GTA III: Q / E (L2 / R2) look left and right; both together look behind
      const lq=kd.KeyQ||tbtn.lookl.on,le=kd.KeyE||tbtn.lookr.on;if(lq&&le){want+=PI;rate=18;}else if(lq){want-=PI/2;rate=14;dist*=0.8;}else if(le){want+=PI/2;rate=14;dist*=0.8;}}
    else if(GTA3MOVE()&&cam.base!=null&&!player.riding){want=cam.base;dist=LOCK.t?84:92;hgt=LOCK.t?44:40;rate=mlLocked()?30:14;}
    else{want=player.body;dist=96;hgt=40;rate=7;}
    if(kd.KeyC||mouse.mdown||tbtn.look.on){want+=PI;rate=18;cam.lookT=0.25;}else if(cam.lookT>0){cam.lookT-=dt;rate=18;}
    {const sp=player.car?hyp(player.car.vx,player.car.vy):0,stickY=pad.on&&((!player.car&&GTA3MOVE())||(player.car&&OPT.pad==='classic'));
     const py=(mouse.lookY||0)*0.0028*(OPT.msens||1)*(OPT.invertY?-1:1)+(stickY?pad.ry*1.7*dt*(OPT.invertY?-1:1):0);mouse.lookY=0;
     if(py){cam.pitch=clamp((cam.pitch||0)+py,-0.5,0.62);cam.pidle=0;}else{cam.pidle=(cam.pidle||0)+dt;if(player.car&&cam.pidle>1.4&&sp>40)cam.pitch=lerp(cam.pitch||0,0,Math.min(1,dt*1.5));}
     const pt=cam.pitch||0;cam.hx=pt>0?pt*95:pt*22;hgt+=cam.hx;}
    {const m=CAMV[camMode()];if(m.top){const sp=player.car?hyp(player.car.vx,player.car.vy):0;dist=(player.car?175+Math.min(80,sp*0.12):135);hgt=(player.car?112+Math.min(50,sp*0.07):84);rate=Math.min(rate,player.car?2.6:6);}else{dist*=m.d;hgt*=m.h;}}
    if(game.state==='wasted'||game.state==='busted'){const k=clamp(1-game.timer/DEATH_T,0,1);dist+=k*k*110;hgt+=k*k*90;rate*=0.15;}
    cam.yaw=lerpAng(cam.yaw,want,Math.min(1,dt*rate));
    const ca=Math.cos(cam.yaw),sa=Math.sin(cam.yaw);let dd=dist;
    const inBoat=player.car&&player.car.t.boat;if(inBoat){hgt+=14;dist+=10;}if(player.car&&player.car.t.heli){dist+=50;hgt+=26;}if(player.car&&player.car.t.rc){dist*=0.55;hgt*=0.5;}
    // pull the camera in when a wall is between it and you; up on a roof or fire escape, only things taller than the camera count
    {const camZ=GH(player.x,player.y)+(player.jz||0)+hgt,hi=(player.jz||0)>12;
    for(let s2=10;s2<=dist;s2+=6){const qx=player.x-ca*s2,qy=player.y-sa*s2;if(!solidPx(qx,qy)||(inBoat&&tileAt(Math.floor(qx/T),Math.floor(qy/T))===WATER))continue;
      if(hi){const tt=tileAt(Math.floor(qx/T),Math.floor(qy/T));if(tt===TREE)continue;const bb=bldAt(qx,qy);if(bb&&roofAbs(bb,qx,qy)<camZ-6)continue;}
      dd=Math.max(24,s2-10);break;}}
    cam.dist=lerp(cam.dist,dd,Math.min(1,dt*(dd<cam.dist?16:2.5)));cam.h=lerp(cam.h,Math.max(10,hgt),Math.min(1,dt*(cam.pidle<0.3?14:3)));
    cam.x=player.x-ca*cam.dist;cam.y=player.y-sa*cam.dist;{const gz=GH(player.x,player.y)+(player.riding?EL_H+6:player.car?(player.car.az||0)*0.85:(player.jz||0)>18?player.jz-6:(player.jz||0)*0.4);cam.gz=cam.gz==null?gz:lerp(cam.gz,gz,Math.min(1,dt*(player.car&&player.car.air>0?9:5)));}}
  updateAudio();
}
let starFlash=0,sprayCool=0,curZone=-2,zoneBanner=null,radioBanner=null;
const drops=[];for(let i=0;i<220;i++)drops.push({x:Math.random()*2200,y:Math.random()*1400,l:10+Math.random()*12});

