// ================= AI =================
function aiLane(c,dt){
  const ai=c.ai;
  const tx=Math.floor(c.x/T),ty=Math.floor(c.y/T);
  if(tx>=0&&ty>=0&&tx<W&&ty<W&&tx%P<4&&ty%P<4){
    const ix=Math.floor(tx/P),iy=Math.floor(ty/P),key=ix*100+iy;
    if(key!==ai.lastI){
      ai.lastI=key;ai.ti=ix;ai.tj=iy;
      const d=ai.dir,opts=[];
      const ok=dd=>(dd===0?ix<NB:dd===1?iy<NB:dd===2?ix>0:iy>0)&&linkOK(ix,iy,dd);
      if(ok(d))opts.push(d,d,d);
      if(ok((d+1)&3))opts.push((d+1)&3);
      if(ok((d+3)&3))opts.push((d+3)&3);
      let nd=opts.length?pick(opts):d;if(ai.follow&&opts.length){let bd=1e18;for(const o of opts){const dd=dist2((ix+DX[o])*PT,(iy+DY[o])*PT,ai.follow.x,ai.follow.y);if(dd<bd){bd=dd;nd=o;}}}
      if(nd!==d){ai.turn=nd;ai.sw=nd===1?(ix*P+1)*T:nd===3?(ix*P+3)*T:nd===0?(iy*P+3)*T:(iy*P+1)*T;}
      else ai.turn=-1;
    }
  }
  if(ai.turn>=0){
    const d=ai.dir,along=(d===0||d===2)?c.x:c.y;
    const passed=(d===0||d===1)?along>=ai.sw-4:along<=ai.sw+4;
    if(passed){ai.dir=ai.turn;ai.k=(ai.turn===0||ai.turn===2)?ai.tj:ai.ti;ai.turn=-1;}
  }
  const d=ai.dir,lc=laneCoord(d,ai.k)+(ai.pass>0?[-32,32,32,-32][d]:0);
  const spd=hyp(c.vx,c.vy),look=50+spd*0.35;if(ai.pass>0)ai.pass-=dt;
  let gx,gy;
  if(d===0||d===2){gx=c.x+DX[d]*look;gy=lc}else{gx=lc;gy=c.y+DY[d]*look}
  const diff=angDiff(Math.atan2(gy-c.y,gx-c.x),c.a);
  let steer=clamp(diff*2.2,-1,1);
  let target=ai.cruise;if(c.driver==='ai'&&sirenBehind(c)){target=Math.min(target,60);ai.pull=1;}
  if(ai.turn>=0){const along=(d===0||d===2)?c.x:c.y;if(Math.abs(along-ai.sw)<120)target=Math.min(target,100)}
  if(Math.abs(diff)>0.5)target=Math.min(target,100);
  if(!(c.driver==='cop'&&heat>0)&&ai.cruise<250){const sd=tlStopDist(c);if(sd!=null)target=sd<5?0:Math.min(target,sd*1.7+4);}
  // obstacles ahead
  const fx=Math.cos(c.a),fy=Math.sin(c.a),D=c.t.L/2+22+spd*0.45,hw=c.t.Wd/2;
  let blocked=false;
  for(const o of cars){
    if(o===c)continue;const rx=o.x-c.x,ry=o.y-c.y;
    if(rx*rx+ry*ry>(D+80)*(D+80))continue;
    const f=rx*fx+ry*fy;if(f<=0)continue;
    const l=Math.abs(-rx*fy+ry*fx);
    if(f<D+o.t.L/2&&l<hw+o.t.Wd/2+2){blocked=true;ai.bo=o;break;}
  }
  if(blocked&&ai.bo&&hyp(ai.bo.vx,ai.bo.vy)<15&&!(ai.bo.ai&&ai.bo.ai.mode==='lane'&&tlStopDist(ai.bo)!=null)){ai.staticT=(ai.staticT||0)+dt;if(ai.staticT>1.4){ai.pass=3.2;ai.staticT=0;ai.revT=0.7;}}else if(!blocked)ai.staticT=0;
  if(ai.pass>0&&blocked&&ai.bo&&hyp(ai.bo.vx,ai.bo.vy)<15)blocked=false;
  if(!blocked)for(const p of peds){if(p.gone)continue;const rx=p.x-c.x,ry=p.y-c.y;if(rx*rx+ry*ry>(D+20)*(D+20))continue;const f=rx*fx+ry*fy;if(f>0&&f<D&&Math.abs(-rx*fy+ry*fx)<hw+9){blocked=true;break;}}
  let byP=false;if(blocked&&ai.bo===player.car&&player.car)byP=true;
  if(!blocked&&!player.car&&game.state==='play'){const rx=player.x-c.x,ry=player.y-c.y;const f=rx*fx+ry*fy;if(f>0&&f<D&&Math.abs(-rx*fy+ry*fx)<hw+10){blocked=true;byP=true;ai.bo=null;}}
  if(c.driver==='ai')aiHonk(c,ai,dt,byP&&blocked);
  if(c.t.bus&&c.driver==='ai'){if(ai.stopT>0){ai.stopT-=dt;target=0;if(ai.stopT<=0&&ai.stopAt){ai.stopAt.cool=25;for(const p of peds)if(p.atStop===ai.stopAt&&!p.gone)p.gone=true;if(R()<0.6){const q=makePed(ai.stopAt.x+rr(-10,10),ai.stopAt.y-8,false);pedPickNext(q);}}}
    else{const st=busNearStop(c);if(st){const f=(st.rx-c.x)*Math.cos(c.a);const sp=hyp(c.vx,c.vy);target=Math.min(target,Math.max(45,(f-40)*1.5));if(f<60||(f<120&&sp<25)){ai.stopT=4;ai.stopAt=st;}}}}
  if(blocked){ai.blockT+=dt;if(ai.blockT<3.5)target=0;if(ai.blockT>5.5)ai.blockT=0;}else ai.blockT=Math.max(0,ai.blockT-dt*2);
  const vf=c.vx*fx+c.vy*fy;
  let thr=vf<target-10?1:vf>target+15?-1:0.15;
  if(target===0)thr=vf>5?-1:0;
  // stuck vs walls
  if(target>0&&spd<12){ai.stuckT+=dt;if(ai.stuckT>2){ai.revT=1;ai.stuckT=0}}else ai.stuckT=0;
  if(ai.revT>0){ai.revT-=dt;thr=-1;steer=-steer;}
  driveCar(c,thr,steer,false,dt);
}
function aiChase(c,dt){
  const ai=c.ai,tg=player.car||player,hidden=seenT>1.2,px=hidden?lastSeenX:tg.x,py=hidden?lastSeenY:tg.y;
  const d=hyp(px-c.x,py-c.y),spd=hyp(c.vx,c.vy);
  let gx=px,gy=py;
  if(hidden&&d<90){ai.searchA=(ai.searchA||R()*TAU)+dt*0.6;gx=c.x+Math.cos(ai.searchA)*200;gy=c.y+Math.sin(ai.searchA)*200;}
  else if(!(d<230&&los(c.x,c.y,px,py))){const n=ffNext(c.x,c.y,4);if(n){gx=n[0];gy=n[1];}}
  let follow=false,desired=0;
  if(player.car&&!hidden&&d<340&&!c.t.tank&&game.state==='play'){
    const pc=player.car,pca=Math.cos(pc.a),psa=Math.sin(pc.a),ps=pc.vx*pca+pc.vy*psa;
    ai.bumpCD=(ai.bumpCD==null?rr(4,7):ai.bumpCD)-dt;
    if(ai.bumpT>0){ai.bumpT-=dt;if(d<pc.t.L/2+c.t.L/2+6||ai.bumpT<=0){ai.bumpT=0;ai.bumpCD=Math.max(3.5,rr(7,11)-stars()*0.6);}}
    else if(stars()>=2&&ai.bumpCD<=0&&d<170)ai.bumpT=1.1;
    if(!(ai.bumpT>0)){follow=true;const slot=c.id%3,stand=80+slot*34;
      if(Math.abs(ps)<110){ // you're slow or stopped: pull up at a distance, then the crew gets out
        const ux=(px-c.x)/(d||1),uy=(py-c.y)/(d||1);gx=px-ux*stand;gy=py-uy*stand;desired=clamp((d-stand)*1.6,0,320);
        if(d<stand+50&&Math.abs(ps)<40&&spd<45&&c.copsOut<1&&!c.t.tank){const crewN=c.t.army?3:c.t.swat||c.t.fbi?2:1;const p1=ejectDriver(c,false);p1.state='cop';p1.heavy=!!(c.t.swat||c.t.fbi||c.t.army);p1.kind=c.type;
          for(let i=1;i<crewN;i++){const q=makePed(c.x-Math.sin(c.a)*(c.t.Wd/2+10)+rr(-10,10),c.y+Math.cos(c.a)*(c.t.Wd/2+10)+rr(-10,10),true);q.state='cop';q.car=c;q.heavy=p1.heavy;q.kind=c.type;q.hp=p1.heavy?80:50;c.copsOut++;}return;}}
      else{const back=90+slot*42,lat=(slot===1?-1:slot===2?1:0)*36;gx=pc.x-pca*back-psa*lat;gy=pc.y-psa*back+pca*lat;
        if(Math.abs(angDiff(Math.atan2(gy-c.y,gx-c.x),c.a))>1.5){gx=c.x+pca*120;gy=c.y+psa*120;}
        desired=Math.max(0,ps+clamp(((gx-c.x)*pca+(gy-c.y)*psa)*1.3,-140,170));}}
  }
  const diff=angDiff(Math.atan2(gy-c.y,gx-c.x),c.a);
  let thr=1,steer=clamp(diff*2.6,-1,1);
  if(Math.abs(diff)>0.9&&spd>240)thr=-0.4;
  if(follow){const vf=c.vx*Math.cos(c.a)+c.vy*Math.sin(c.a);thr=vf<desired-12?1:vf>desired+18?-0.8:0.15;if(desired<15)thr=vf>8?-0.8:0;}
  {const s=stars(),cap=[0,290,360,470][s]||0,vf=c.vx*Math.cos(c.a)+c.vy*Math.sin(c.a);if(cap&&vf>cap)thr=Math.min(thr,vf>cap+40?-0.5:0);
   if(s<=2){steer=clamp(diff*1.7,-1,1);if(Math.abs(diff)>0.55&&spd>150)thr=Math.min(thr,0.1);}}
  if(spd<25){ai.stuckT+=dt;if(ai.stuckT>1.1){ai.revT=0.9;ai.stuckT=0}}else ai.stuckT=0;
  if(ai.revT>0){ai.revT-=dt;thr=-1;steer=-steer;}
  if(c.t.tank&&Math.abs(diff)>0.6)thr=0.2;
  if(!player.car&&d<190&&game.state==='play'&&!hidden&&!c.t.tank){
    thr=spd>40?-1:0;
    if(spd<70&&c.copsOut<1){const crewN=c.t.army?3:c.t.swat||c.t.fbi?2:1;const p1=ejectDriver(c,false);p1.state='cop';p1.heavy=!!(c.t.swat||c.t.fbi||c.t.army);p1.kind=c.type;
      for(let i=1;i<crewN;i++){const q=makePed(c.x-Math.sin(c.a)*(c.t.Wd/2+10)+rr(-10,10),c.y+Math.cos(c.a)*(c.t.Wd/2+10)+rr(-10,10),true);q.state='cop';q.car=c;q.heavy=p1.heavy;q.kind=c.type;q.hp=p1.heavy?80:50;c.copsOut++;}
      if(false&&stars()>=2){const p2=makePed(c.x-Math.sin(c.a)*(c.t.Wd/2+10),c.y+Math.cos(c.a)*(c.t.Wd/2+10),true);p2.state='cop';p2.car=c;c.copsOut++;}return;}
  }
  driveCar(c,thr,steer,false,dt);
}
function updatePed(p,dt){
  p.moving=false;
  if(p.flash>0)p.flash-=dt;
  if(p.stagger>0){p.stagger-=dt;return;}
  if(p.rope){p.vx=p.vy=0;p.moving=false;p.jz=Math.max(0,(p.jz||0)-75*dt);if(heli){p.x+=(heli.x-p.x)*0;}if(p.jz<=0){p.rope=false;p.jz=0;}return;}
  if(p.state==='cop'){updateCop(p,dt);return;}
  if(p.injured){p.vx=p.vy=0;p.moving=false;return;}
  if(p.boss){p.vx=p.vy=0;p.moving=false;return;}
  if((p.crew||p.follow)&&crewTick(p,dt))return;
  if(p.gang!=null&&isAlly(p)&&(stars()>0||dist2(p.x,p.y,player.x,player.y)<400*400)){p.scanT=(p.scanT||0)-dt;if(p.scanT<=0){p.scanT=0.5;p.foe=dist2(p.x,p.y,player.x,player.y)<600*600?crewTarget(p.x,p.y,300):null;}if(p.foe&&!p.foe.gone&&!p.foe.wreck){crewShoot(p,p.foe,dt);return;}}
  if(p.brawl>0&&brawlTick(p,dt))return;
  if(lifePed(p,dt))return;
  if(p.fare){p.vx=p.vy=0;if(player.car)p.a=Math.atan2(player.car.y-p.y,player.car.x-p.x);return;}
  if(p.gang!=null){
    if(p.angry>0)p.angry-=dt;
    if((p.angry>0||respect[p.gang]<=-2)&&game.state==='play'){const tg=player.car||player,d=hyp(tg.x-p.x,tg.y-p.y);
      if(d<340&&los(p.x,p.y,tg.x,tg.y)){gangAttack(p,tg,d,dt);return;}}
    p.gun=false;
  }
  let sp=0,gx=p.tx,gy=p.ty;
  if(p.state==='flee'){
    p.panic-=dt;sp=118;
    let ax=p.x-p.fx,ay=p.y-p.fy;const l=hyp(ax,ay)||1;
    gx=p.x+ax/l*40+rr(-10,10);gy=p.y+ay/l*40+rr(-10,10);
    if(p.panic<=0){p.state='walk';const tx=Math.floor(p.x/T),ty=Math.floor(p.y/T);
      let best=null,bd=1e9;for(let j=-4;j<=4;j++)for(let i=-4;i<=4;i++){if(walkable(tileAt(tx+i,ty+j))){const dd=i*i+j*j;if(dd<bd){bd=dd;best=[tx+i,ty+j]}}}
      if(best){p.tx=(best[0]+.5)*T;p.ty=(best[1]+.5)*T;}else{p.tx=p.x;p.ty=p.y}
    }
  }else{
    sp=p.cross?62:p.jog?96:44;
    if(dist2(p.x,p.y,p.tx,p.ty)<16)pedPickNext(p);
  }
  const dx=gx-p.x,dy=gy-p.y,l=hyp(dx,dy);
  if(l>1){p.vx=dx/l*sp;p.vy=dy/l*sp;p.a=lerpAng(p.a,Math.atan2(dy,dx),Math.min(1,dt*10));p.moving=true;p.anim+=dt*sp*0.18;}
  else{p.vx=p.vy=0}
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  if(circleTiles(p,6)&&p.state==='walk')pedPickNext(p);
}
function updateCop(p,dt){
  const s=stars();
  if(s===0||game.state!=='play'){p.state='walk';p.gun=false;p.foe=null;pedPickNext(p);return;}
  if(p.foe){const f=p.foe;if(f.gone||dist2(f.x,f.y,p.x,p.y)>320*320)p.foe=null;else{const a=Math.atan2(f.y-p.y,f.x-p.x);p.a=lerpAng(p.a,a,0.3);p.vx=p.vy=0;p.moving=false;p.gun=true;p.shootT-=dt;
    if(p.shootT<=0&&los(p.x,p.y,f.x,f.y)){p.shootT=rr(.7,1.3);const aa=npcAim(a,false);fireBullet(p.x+Math.cos(aa)*12,p.y+Math.sin(aa)*12,aa,850,'cop',6,'b',5);sfx('shot',nearPlayer(p.x,p.y,600)?0.4:0.12);}return;}}
  const tg=player.car||player,px=tg.x,py=tg.y,d=hyp(px-p.x,py-p.y);
  if(player.car&&p.car&&!p.car.wreck&&p.car.burn<0&&!p.car.driver&&d>170){
    const cx=p.car.x,cy=p.car.y,dc=hyp(cx-p.x,cy-p.y);
    if(dc<p.car.t.L/2+14){p.gone=true;p.car.copsOut=Math.max(0,p.car.copsOut-1);if(!p.car.driver){p.car.driver='cop';p.car.ai=newAI('chase',0,0);p.car.copsOut=0;}
      for(const q of peds)if(q!==p&&q.car===p.car&&q.state==='cop'){q.gone=true;}return;}
    const a=Math.atan2(cy-p.y,cx-p.x);p.a=lerpAng(p.a,a,0.3);p.vx=Math.cos(a)*150;p.vy=Math.sin(a)*150;
  }else{
    const hidden=seenT>1.2,see=!hidden&&d<330&&los(p.x,p.y,px,py);
    let gx=px,gy=py;
    if(!(d<170&&see)){const n=ffNext(p.x,p.y,2);if(n){gx=n[0];gy=n[1];}}
    const a=Math.atan2(gy-p.y,gx-p.x);p.a=lerpAng(p.a,see?Math.atan2(py-p.y,px-p.x):a,0.3);
    const shoots=s>=3||p.heavy;
    let sp=152;if(shoots&&see&&d<200)sp=55;
    if(d>13){p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp}else{p.vx=p.vy=0}
    if(shoots){p.gun=true;p.shootT-=dt;
      if(p.shootT<=0&&see&&d<280){p.shootT=p.heavy?rr(.45,.8):rr(1.0,1.7);const aa=npcAim(Math.atan2(py-p.y,px-p.x),hyp(p.vx,p.vy)>5&&d>13)+rr(-0.07,0.07);
        fireBullet(p.x+Math.cos(aa)*12,p.y+Math.sin(aa)*12,aa,850,'cop',p.heavy?7:5,'b',5);sfx('shot',nearPlayer(p.x,p.y,600)?0.5:0.2);
        puff(p.x+Math.cos(aa)*14,p.y+Math.sin(aa)*14,0,0,0.06,9,'#fff2a8','flash');}}
    if(!player.car&&d<18&&!hidden){const run=hyp(player.vx,player.vy)>70||player.jz>4;bustT+=dt*(run?0.7:1.7);p.vx*=0.2;p.vy*=0.2;if(!bustNote){bustNote=true;note('A cop has hold of you! Run or fight back');}}
    if(player.car&&d<player.car.t.L/2+16&&hyp(player.car.vx,player.car.vy)<35)bustT+=dt*1.1;
  }
  p.moving=true;p.anim+=dt*25;
  p.x+=p.vx*dt;p.y+=p.vy*dt;circleTiles(p,6);
}

// ================= BULLETS =================
let bullets=[],hitMarks=[],throwCharge=0,fireWasHeld=false;
function fireBullet(x,y,a,spd,own,dmg,kind,cdmg,life,ivx,ivy){bullets.push({x,y,vx:Math.cos(a)*spd+(ivx||0),vy:Math.sin(a)*spd+(ivy||0),life:kind==='r'?2.2:kind==='f'?0.3:kind==='m'?(life||0.9):0.75,own,dmg,kind,cdmg,a})}
function molotovBurst(x,y,by){
  sfx('crash',0.6);sfx('flame',3);
  for(let i=0;i<7;i++){const a=R()*TAU,d=rr(0,34);fires.push({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,t:rr(3.5,5),by});}
  for(let i=0;i<14;i++){const a=R()*TAU,s2=rr(40,160);puff(x,y,Math.cos(a)*s2,Math.sin(a)*s2,rr(.3,.6),rr(6,12),pick(['#ff7a00','#ffb300','#ff4400']),'fire');}
  panicAround(x,y,300);addMark({k:'scorch',x,y,r:34});
}
function updateFires(dt){
  for(const f of fires){f.t-=dt;if(R()<0.5)puff(f.x+rr(-6,6),f.y+rr(-6,6),rr(-10,10),rr(-40,-10),rr(.3,.6),rr(6,11),pick(['#ff7a00','#ffb300','#ff4400','#ffd35a']),'fire');
    for(const p of peds)if(!p.gone&&dist2(p.x,p.y,f.x,f.y)<18*18)killPed(p,f.by==='player'?'player':null,0,0,true);
    if(!player.car&&game.state==='play'&&dist2(player.x,player.y,f.x,f.y)<16*16)hurtPlayer(dt*45);
    for(const c of cars)if(!c.wreck&&dist2(c.x,c.y,f.x,f.y)<c.t.L*c.t.L*0.3&&pointInCar(c,f.x,f.y,4))damageCar(c,dt*22,f.by==='player'?'player':null);
  }
  fires=fires.filter(f=>f.t>0);
}
function updateBullets(dt){
  for(const b of bullets){
    const steps=Math.max(1,Math.ceil(hyp(b.vx,b.vy)*dt/9));
    const sx=b.vx*dt/steps,sy=b.vy*dt/steps;
    b.life-=dt;
    if(b.kind==='r'){puff(b.x,b.y,rr(-20,20),rr(-20,20),0.6,rr(5,9),'#bbb','smoke');}
    else if(b.kind==='f'){puff(b.x,b.y,b.vx*0.2+rr(-20,20),b.vy*0.2+rr(-20,20),0.25,rr(5,9)*(1.4-b.life*2),pick(['#ff7a00','#ffb300','#ff4400','#ffd35a']),'fire');}
    else if(b.kind==='m'){b.spin=(b.spin||0)+dt*14;}
    outer:for(let s=0;s<steps;s++){
      b.x+=sx;b.y+=sy;
      const B3=b.dz!=null;
      if(B3){const g=GH(b.x,b.y);if(b.rel!=null)b.z=g+b.rel;else b.z+=b.dz*hyp(sx,sy); // level shots follow the ground over hills
        if(b.z<g-1){b.z=g;if(b.kind==='r'){b.life=0;explode(b.x,b.y,b.own);break;}hitFx(b);b.life=0;break;}}
      if(solidPx(b.x,b.y)){let over=false;
        // a shot with height flies over buildings lower than it (and over trees when high enough)
        if(B3){const tt=tileAt(Math.floor(b.x/T),Math.floor(b.y/T)),bb=tt===BLD?bldAt(b.x,b.y):null;over=(bb&&b.z>roofAbs(bb,b.x,b.y)+1)||(tt===TREE&&b.z>GH(b.x,b.y)+70)||(tt===WATER&&b.z>GH(b.x,b.y));}
        if(!over){if(b.kind==='m'){b.x-=sx*2;b.y-=sy*2;}hitFx(b);b.life=0;break;}}
      for(const p of peds){
        if(p.gone)continue;if(dist2(p.x,p.y,b.x,b.y)<81){
          if(B3){const pz=GH(p.x,p.y)+(p.jz||0);if(b.z<pz-6||b.z>pz+38)continue;}
          if(b.own==='cop'&&p.cop)continue;
          if(b.own==='gang'&&p.gang!=null)continue;
          if(b.own==='crew'&&(isAlly(p)||(!p.cop&&p.gang==null&&!p.target)))continue;
          if(b.kind==='f'){killPed(p,b.own==='player'?'player':null,0,0,true);b.life=0;break outer;}
          if(b.kind==='m'){b.life=0;break outer;}
          if(b.kind==='r'){b.life=0;explode(b.x,b.y,b.own);break outer;}
          p.hp-=b.dmg;addMark({k:'blood',x:p.x+rr(-4,4),y:p.y+rr(-4,4),r:rr(3,6)});
          if(b.own==='player'){hitMarks.push({x:p.x,y:p.y,t:0.18,kill:p.hp<=0});p.flash=0.08;p.stagger=0.22;const bl=hyp(b.vx,b.vy)||1;p.x+=b.vx/bl*5;p.y+=b.vy/bl*5;if(nearPlayer(p.x,p.y,900))sfx('hit');}
          if(p.hp<=0)killPed(p,b.own==='player'?'player':null);
          else if(p.gang!=null){p.angry=12;}
          else if(!p.cop){p.state='flee';p.panic=6;p.fx=b.x-b.vx;p.fy=b.y-b.vy;}
          else if(b.own==='player'){crime(0,1);}
          b.life=0;break outer;
        }
      }
      for(const c of cars){
        if(c.wreck&&b.kind!=='r')continue;
        if((b.own==='player'||b.own==='crew')&&c===player.car)continue;
        if(dist2(c.x,c.y,b.x,b.y)>c.t.L*c.t.L*0.3)continue;
        if(B3&&b.z>GH(c.x,c.y)+(c.az||0)+carRoof(c)+8)continue;
        if(pointInCar(c,b.x,b.y,0)){
          if(b.kind==='r'){b.life=0;explode(b.x,b.y,b.own);break outer;}
          if(b.kind==='m'){b.life=0;break outer;}
          // a rider on a motorbike takes the bullet, not the bike: they're knocked off (or killed) and the bike skids on riderless
          if(c.t.bike&&c.driver&&c.driver!=='player'&&b.kind==='b'){const own=b.own==='player'?'player':null,vx=c.vx,vy=c.vy,rp=ejectDriver(c,true);if(rp){rp.x=c.x;rp.y=c.y;rp.hp-=b.dmg*1.5;
              if(own==='player')hitMarks.push({x:rp.x,y:rp.y,t:0.18,kill:rp.hp<=0});if(rp.hp<=0)killPed(rp,own,vx*0.5,vy*0.5);else{rp.stagger=0.8;rp.vx=vx*0.3;rp.vy=vy*0.3;}}
            c.va+=(R()-0.5)*4;if(nearPlayer(b.x,b.y,500))sfx('hit');b.life=0;break outer;}
          if(c.t.bike&&c===player.car&&b.own!=='player'&&b.own!=='crew'&&b.kind==='b'&&game.state==='play'){exitCar(true);hurtPlayer(b.dmg);note('Shot off your bike!');b.life=0;break outer;}
          if(!(c.up&&c.up.bp))damageCar(c,b.cdmg,b.own==='player'?'player':null);
          if(b.own==='player'&&!(c.up&&c.up.bp)&&!c.t.tank&&!c.t.boat&&!c.t.heli&&!c.wreck){const ca2=Math.cos(c.a),sa2=Math.sin(c.a),lx=(b.x-c.x)*ca2+(b.y-c.y)*sa2,ly=-(b.x-c.x)*sa2+(b.y-c.y)*ca2;
            // a hit near a wheel can blow the tire (the car slews and slows); a hit low at the back can catch the fuel tank
            if(!c.flat&&Math.abs(lx)>c.t.L*0.22&&Math.abs(ly)>c.t.Wd*0.25&&(b.dz==null||b.z<GH(c.x,c.y)+12)&&R()<(WEAPONS[player.w].sniper?0.8:0.3)){c.flat=true;c.va+=(R()-0.5)*2.5;puff(b.x,b.y,0,0,0.4,8,'#888','smoke');if(c.ai)c.ai.cruise=Math.min(c.ai.cruise,150);}
            else if(lx<-c.t.L*0.3&&c.burn<0&&R()<(WEAPONS[player.w].sniper?0.5:0.05)){ignite(c,'player');note('Hit the fuel tank!');}}
          if(b.own==='player')hitMarks.push({x:b.x,y:b.y,t:0.12,kill:false});
          if(b.own==='player'&&c.t.police&&c.driver)crime(0,1);if(b.own==='player')for(const q of peds)if(!q.gone&&!q.cop&&dist2(q.x,q.y,b.x,b.y)<160*160&&R()<0.1)shout(q,'gun');
          if(b.kind==='f'){b.life=0;break outer;}
          for(let k=0;k<3;k++)puff(b.x,b.y,rr(-90,90),rr(-90,90),0.25,2,'#ffe08a','spark');
          if(nearPlayer(b.x,b.y,500))sfx('hit');
          b.life=0;break outer;
        }
      }
      if(b.own!=='player'&&b.own!=='crew'&&!player.car&&game.state==='play'&&dist2(player.x,player.y,b.x,b.y)<100){
        if(b.kind==='r'){b.life=0;explode(b.x,b.y,b.own);break;}
        hurtPlayer(b.dmg);addMark({k:'blood',x:player.x,y:player.y,r:rr(3,6)});b.life=0;break;
      }
    }
    if(b.life<=0&&b.kind==='m'&&!b.done){b.done=true;if(b.gren)explode(b.x,b.y,b.own);else molotovBurst(b.x,b.y,b.own);}
  }
  bullets=bullets.filter(b=>b.life>0);
}
function hitFx(b){
  if(b.kind==='f'||b.kind==='m')return;
  if(b.kind==='r'){explode(b.x-b.vx*0.02,b.y-b.vy*0.02,b.own);return;}
  for(let k=0;k<3;k++)puff(b.x-b.vx*0.01,b.y-b.vy*0.01,rr(-70,70),rr(-70,70),0.2,2,'#ddd','spark');
}

// ================= INPUT =================
const keys={},pressed={};
// kd reads a key from the keyboard or from the controller (the controller sets PADK, see pollPad)
const PADK={},kd=new Proxy(keys,{get:(o,k)=>o[k]||PADK[k]});
let mouse={x:0,y:0,down:false,used:false},touchMode=false;
window.addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.repeat){keys[e.code]=true;return;}
  keys[e.code]=true;
  if(e.code==='KeyF'||e.code==='Enter')pressed.enter=true;
  // GTA III PC: Q/E cycle weapons on foot; in a car they look left/right (both together: look behind)
  if(e.code==='KeyQ'&&!player.car)pressed.swap=-1;
  if(e.code==='KeyE'&&!player.car)pressed.swap=1;
  if(e.code==='KeyT'&&game.started&&!game.paused)recruitNear();
  if(e.code==='KeyB'&&game.started&&!game.paused&&game.state==='play')detonateBomb();
  if(e.code==='KeyM')toggleMute();
  if(e.code==='KeyV'&&game.started&&!game.paused)cycleCam();
  if(e.code==='KeyN'&&!DLG.open){mirrorOn=!mirrorOn;OPT.mirror=mirrorOn;saveOpts();note(mirrorOn?'Rear-view mirror on':'Rear-view mirror off');}
  if(e.code==='KeyR'&&player.car)setStation(radio.st+1);
  if((e.code==='KeyP'||e.code==='Escape')&&game.started)togglePause();
});
window.addEventListener('keyup',e=>{keys[e.code]=false});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.down=false;});
// ---- mouse look (GTA III PC style): click to capture the mouse; moving it turns the camera and you aim with a crosshair.
// On foot the crosshair sits just above the middle of the screen; in a car it's a free cursor for drive-bys.
const ML={exiting:false,cx:0,cy:0,dy:0};
const mlLocked=()=>document.pointerLockElement===cv;
function mlWanted(){return OPT.mouselook!==false&&!touchMode&&game.started&&!game.paused&&!DLG.open&&!BIGMAP&&game.state!=='menu';}
function mlTick(){if(!mlLocked())return;
  if(!mlWanted()){ML.exiting=true;try{document.exitPointerLock();}catch(_){}return;}
  mouse.used=true;
  if(player.car){mouse.x=VW/2;mouse.y=VH*0.4;}
  else{mouse.x=VW/2;mouse.y=SCOPE.on?OY+HOR0*SCL:VH*0.44;}}
document.addEventListener('pointerlockchange',()=>{if(mlLocked()){ML.exiting=false;return;}
  // the player pressed Esc to let go of the mouse: pause, so the game doesn't carry on without them
  if(!ML.exiting)setTimeout(()=>{if(!game.paused&&game.started&&game.state!=='menu')togglePause();},60);ML.exiting=false;});
cv.addEventListener('mousemove',e=>{
  if(mlLocked()){const mx=e.movementX||0,my=e.movementY||0;
    mouse.look=(mouse.look||0)+mx;mouse.lookY=(mouse.lookY||0)+my;
    if(mouse.rdown)mouse.turn=(mouse.turn||0)+mx;mouse.used=true;return;}
  mouse.x=e.clientX;mouse.y=e.clientY;mouse.used=true;if(mouse.rdown)mouse.turn=(mouse.turn||0)+(e.movementX||0);});
cv.addEventListener('mousedown',e=>{if(e.button===1){mouse.mdown=true;e.preventDefault();return;}if(BIGMAP&&e.button===0){if(!bigMapTap(e.clientX,e.clientY))BIGMAP=false;return;}
  initAudio();
  if(!mlLocked()&&mlWanted()&&!touchMode){try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(_){}ML.dy=0;mouse.used=true;return;} // this click only grabs the mouse
  if(e.button===0)mouse.down=true;if(e.button===2)mouse.rdown=true;mouse.used=true;});
window.addEventListener('mouseup',e=>{if(e.button===1)mouse.mdown=false;if(e.button===0)mouse.down=false;if(e.button===2)mouse.rdown=false;});
cv.addEventListener('wheel',e=>{if(SCOPE.on)SCOPE.zw=e.deltaY<0?-1:1;else pressed.swap=e.deltaY<0?-1:1;e.preventDefault()},{passive:false});
// middle mouse = look behind (GTA III PC)
cv.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
cv.addEventListener('contextmenu',e=>e.preventDefault());

// touch
const joy={id:null,ox:0,oy:0,x:0,y:0,active:false},aimJoy={id:null,ox:0,oy:0,x:0,y:0,active:false};
const tbtn={cam:{id:null,on:false},scope:{id:null,on:false},lookl:{id:null,on:false},lookr:{id:null,on:false},phone:{id:null,on:false},horn:{id:null,on:false},nos:{id:null,on:false},gas:{id:null,on:false},rev:{id:null,on:false},look:{id:null,on:false},fire:{id:null,on:false},car:{id:null,on:false},brake:{id:null,on:false},gun:{id:null,on:false},radio:{id:null,on:false},pause:{id:null,on:false}};
function touchScale(){return clamp(Math.min(VW,VH)/420,0.72,1.2)*(OPT.btn||1)}
function btnLayout(){const s=touchScale(),pad=16*s,bx=VW-pad,by=VH-pad-8;
  const L={fire:{x:bx-46*s,y:by-46*s,r:46*s,label:'FIRE'},
    brake:{x:bx-148*s,y:by-34*s,r:33*s,label:'DRIFT'},
    car:{x:bx-46*s,y:by-150*s,r:33*s,label:'CAR'},
    gun:{x:bx-128*s,y:by-122*s,r:25*s,label:'GUN'},
    pause:{x:VW/2,y:24*s,r:17*s,label:'II'},phone:{x:VW/2+46*s,y:24*s,r:17*s,label:'CALL'},cam:{x:VW/2-46*s,y:24*s,r:17*s,label:'VIEW'},
    look:{x:bx-128*s,y:by-192*s,r:22*s,label:'LOOK'}};
  if(player.car)L.radio={x:bx-46*s,y:by-226*s,r:23*s,label:'RADIO'};
  if(player.car&&!player.car.t.heli){L.lookl={x:bx-212*s,y:by-232*s,r:19*s,label:'◀'};L.lookr={x:bx-168*s,y:by-262*s,r:19*s,label:'▶'};}
  if(!player.car&&WEAPONS[player.w].scope)L.scope={x:bx-212*s,y:by-150*s,r:24*s,label:SCOPE.touch?'EXIT':'SCOPE'};
  if(player.car){L.horn={x:bx-226*s,y:by-30*s,r:25*s,label:'HORN'};if((player.car.up&&player.car.up.nitro)||player.car.t.heli)L.nos={x:bx-210*s,y:by-104*s,r:22*s,label:'NOS'};
    if(OPT.steer==='wheel'){L.gas={x:bx-46*s,y:by-46*s,r:46*s,label:'GAS'};L.rev={x:bx-140*s,y:by-28*s,r:28*s,label:'BRAKE'};L.brake={x:bx-46*s,y:by-146*s,r:28*s,label:'DRIFT'};
      L.fire={x:bx-140*s,y:by-112*s,r:30*s,label:'FIRE'};L.car={x:bx-46*s,y:by-226*s,r:26*s,label:'CAR'};L.radio={x:bx-120*s,y:by-282*s,r:20*s,label:'RADIO'};L.gun={x:bx-128*s,y:by-192*s,r:20*s,label:'GUN'};L.look={x:bx-212*s,y:by-170*s,r:20*s,label:'LOOK'};}}
  return L;}
function joyHome(){const s=touchScale();return{x:16*s+72*s,y:VH-16*s-8-72*s,r:62*s}}
function onTouch(e){
  e.preventDefault();touchMode=true;mouse.used=false;initAudio();
  if(game.paused&&e.type==='touchstart'){togglePause();return;}
  if(e.type==='touchstart'){keepAwake();if(BIGMAP){const t1=e.changedTouches[0];if(!bigMapTap(t1.clientX,t1.clientY))BIGMAP=false;return;}const t0=e.changedTouches[0],ms=118*clamp(Math.min(VW,VH)/700,0.65,1.25);if(game.started&&t0.clientX<12+ms+10&&t0.clientY<12+ms+10){BIGMAP=true;return;}}
  const L=btnLayout(),JH=joyHome();
  for(const t of e.changedTouches){
    const x=t.clientX,y=t.clientY;
    if(e.type==='touchstart'){
      let hitBtn=null;for(const k in L){const b=L[k];if(hyp(x-b.x,y-b.y)<b.r*1.3){hitBtn=k;break;}}
      if(hitBtn){tbtn[hitBtn].id=t.identifier;tbtn[hitBtn].on=true;
        if(hitBtn==='cam')cycleCam();if(hitBtn==='scope')SCOPE.touch=!SCOPE.touch;
        if(hitBtn==='car')pressed.enter=true;if(hitBtn==='gun')pressed.swap=true;
        if(hitBtn==='radio'&&player.car)setStation(radio.st+1);if(hitBtn==='pause')togglePause();if(hitBtn==='phone')phoneMenu();}
      else if(x<VW*0.5&&y>VH*0.3&&joy.id===null){
        joy.id=t.identifier;joy.ox=clamp(x,JH.r,VW*0.5);joy.oy=clamp(y,VH*0.3,VH-JH.r*0.6);joy.x=0;joy.y=0;joy.active=true;}
      else if(x>=VW*0.5&&y>VH*0.22&&aimJoy.id===null){aimJoy.id=t.identifier;aimJoy.ox=x;aimJoy.oy=y;aimJoy.x=0;aimJoy.y=0;aimJoy.active=true;}
    }else if(e.type==='touchmove'){
      if(t.identifier===joy.id){let dx=x-joy.ox,dy=y-joy.oy;const l=hyp(dx,dy),m=JH.r;if(l>m){dx=dx/l*m;dy=dy/l*m}joy.x=dx/m;joy.y=dy/m;}
      if(t.identifier===aimJoy.id){let dx=x-aimJoy.ox,dy=y-aimJoy.oy;const l=hyp(dx,dy),m=JH.r*0.8;if(l>m){dx=dx/l*m;dy=dy/l*m}aimJoy.x=dx/m;aimJoy.y=dy/m;}
    }else{
      if(t.identifier===joy.id){joy.id=null;joy.active=false;joy.x=joy.y=0;}
      if(t.identifier===aimJoy.id){aimJoy.id=null;aimJoy.active=false;aimJoy.x=aimJoy.y=0;}
      for(const k in tbtn)if(tbtn[k].id===t.identifier){tbtn[k].id=null;tbtn[k].on=false;}
    }
  }
}
['touchstart','touchmove','touchend','touchcancel'].forEach(ev=>cv.addEventListener(ev,onTouch,{passive:false}));

// ---- game controller (standard mapping: Xbox / PlayStation / Switch Pro) ----
const pad={on:false,lx:0,ly:0,rx:0,ry:0,gas:0,brake:0,pb:[],aim:false,aimA:0,run:false,gp:null,shake:0,ly0:0,lx0:0};
const dzn=v=>Math.abs(v)<0.18?0:(v-Math.sign(v)*0.18)/0.82;
function pollPad(){let gp=null;try{const l=navigator.getGamepads?navigator.getGamepads():[];for(const g of l)if(g&&g.connected&&g.buttons&&g.buttons.length>9){gp=g;break;}}catch(_){}
  if(!gp){if(pad.on){pad.on=false;pad.aim=false;for(const k in PADK)PADK[k]=false;}return;}
  pad.gp=gp;const B=i=>{const b=gp.buttons[PM(i)];return!!b&&(b.pressed||b.value>0.5);},b=[];for(let i=0;i<17;i++)b[i]=B(i);const edge=i=>b[i]&&!pad.pb[i];
  pad.lx=dzn(gp.axes[0]||0);pad.ly=dzn(gp.axes[1]||0);pad.rx=dzn(gp.axes[2]||0);pad.ry=dzn(gp.axes[3]||0);
  {const g7=gp.buttons[PM(7)],g6=gp.buttons[PM(6)];pad.gas=g7?g7.value:0;pad.brake=g6?g6.value:0;}
  const active=b.some(x=>x)||Math.abs(pad.lx)+Math.abs(pad.ly)+Math.abs(pad.rx)+Math.abs(pad.ry)>0.1||pad.gas>0.05||pad.brake>0.05;
  if(active){if(!pad.on){pad.on=true;if(game.started)note('Controller connected');}mouse.used=false;}
  const menuUp=document.getElementById('menu').style.display!=='none';
  const send=code=>window.dispatchEvent(new KeyboardEvent('keydown',{code,key:code,bubbles:true}));
  if(menuUp||DLG.open){for(const k in PADK)PADK[k]=false;
    const up=edge(12)||(pad.ly<-0.6&&pad.ly0>=-0.6),dn=edge(13)||(pad.ly>0.6&&pad.ly0<=0.6),lf=edge(14)||(pad.lx<-0.6&&pad.lx0>=-0.6),rt=edge(15)||(pad.lx>0.6&&pad.lx0<=0.6);
    if(up)send('ArrowUp');if(dn)send('ArrowDown');if(lf)send('ArrowLeft');if(rt)send('ArrowRight');
    if(edge(0))send('Enter');if(edge(1))send('Escape');if(edge(9)&&menuUp&&game.paused)togglePause();}
  else if(game.started&&OPT.pad==='classic'){
    // GTA III's PlayStation 2 layout: X gas / sprint, Square brake / jump, Circle fire, Triangle car, R1 handbrake / target,
    // L1 horn, L2 / R2 look left / right in a car (both: look behind) or switch weapon on foot, Select camera view
    const inCar=!!player.car;
    PADK.Space=inCar?b[5]:b[2];PADK.KeyK=b[1];PADK.KeyH=inCar&&b[4];PADK.KeyQ=inCar&&b[6];PADK.KeyE=inCar&&b[7];PADK.KeyC=b[11];PADK.ShiftLeft=inCar&&b[10];
    pad.run=!inCar&&b[0];pad.lock=!inCar&&b[5];pad.gas=inCar?(b[0]?1:0):0;pad.brake=inCar?(b[2]?1:0):0;
    if(edge(3))pressed.enter=true;if(!inCar&&edge(6))pressed.swap=-1;if(!inCar&&edge(7))pressed.swap=1;if(edge(8))cycleCam();if(edge(9))togglePause();
    if(edge(12)&&inCar)setStation(radio.st+1);if(edge(13))phoneMenu();if(edge(14))recruitNear();if(edge(15))BIGMAP=!BIGMAP;}
  else if(game.started){
    PADK.Space=b[0];PADK.KeyC=b[1];PADK.KeyH=b[2];PADK.KeyK=b[5];PADK.ShiftLeft=b[10]&&!!player.car;pad.run=b[10];PADK.KeyQ=false;PADK.KeyE=false;
    if(edge(3))pressed.enter=true;if(edge(4))pressed.swap=true;if(edge(9))togglePause();if(edge(8))BIGMAP=!BIGMAP;if(edge(11))cycleCam();
    if(edge(12)&&player.car)setStation(radio.st+1);if(edge(13))phoneMenu();if(edge(14))recruitNear();if(edge(15)){mirrorOn=!mirrorOn;OPT.mirror=mirrorOn;saveOpts();}}
  // right stick aims relative to the camera (screen up = straight ahead)
  pad.aim=OPT.pad!=='classic'&&hyp(pad.rx,pad.ry)>0.35;if(pad.aim)pad.aimA=cam.yaw+Math.atan2(pad.rx,-pad.ry);
  // rumble with crashes and explosions
  if(OPT.rumble!==false&&typeof shake!=='undefined'&&shake>pad.shake+2&&gp.vibrationActuator){try{gp.vibrationActuator.playEffect('dual-rumble',{duration:Math.min(400,60+shake*25),strongMagnitude:Math.min(1,shake/12),weakMagnitude:Math.min(1,shake/8)});}catch(_){}}
  pad.shake=typeof shake!=='undefined'?shake:0;pad.pb=b;pad.ly0=pad.ly;pad.lx0=pad.lx;}
