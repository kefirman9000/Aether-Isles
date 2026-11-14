// ================= CARS =================
const CT={
  compact:{name:'Pipsqueak',L:42,Wd:21,max:360,acc:300,grip:9,turn:3.1,hp:80,mass:.8,cols:['#8e2b22','#2c4f86','#a08422','#2f6b3c','#a9a9a4','#9a5a22','#5a3a6a']},
  sedan:{name:'Cruiser',L:52,Wd:24,max:430,acc:330,grip:10,turn:2.8,hp:110,mass:1,cols:['#2c3a48','#5e6567','#6e2019','#1f4766','#b8b8b0','#173d24','#4a352c','#46304f']},
  sports:{name:'Viper',L:50,Wd:24,max:640,acc:580,grip:11,turn:3.3,hp:90,mass:.9,cols:['#a8101c','#c9a400','#1a7da0','#9a1a5e','#151515','#b84a10']},
  truck:{name:'Hauler',L:74,Wd:28,max:300,acc:190,grip:12,turn:2.1,hp:200,mass:2.4,cols:['#525252','#4a5e30','#7a4824','#24303c'],truck:true},
  taxi:{name:'Cabbie',L:52,Wd:24,max:450,acc:340,grip:10,turn:2.9,hp:110,mass:1,cols:['#d6a80c'],taxi:true},
  police:{name:'Squad Car',L:54,Wd:25,max:590,acc:520,grip:11.5,turn:3.2,hp:150,mass:1.4,cols:['#e4e4e4'],police:true},
  fbi:{name:'Fed Cruiser',L:54,Wd:25,max:650,acc:580,grip:12.5,turn:3.3,hp:230,mass:1.7,cols:['#141414'],police:true,fbi:true},
  armytruck:{name:'Army Truck',L:78,Wd:30,max:340,acc:270,grip:13,turn:2.2,hp:450,mass:3.4,cols:['#4a5a2a'],police:true,army:true,truck:true},
  tank:{name:'Tank',L:70,Wd:42,max:190,acc:240,grip:30,turn:1.7,hp:2600,mass:9,cols:['#55602e'],police:true,army:true,tank:true},
  ambulance:{name:'Ambulance',L:62,Wd:27,max:480,acc:400,grip:11.5,turn:2.7,hp:220,mass:2.1,cols:['#f2f2f0'],ambulance:true},
  swat:{name:'SWAT Van',L:64,Wd:28,max:470,acc:420,grip:12,turn:2.6,hp:280,mass:2.6,cols:['#1c1e24'],police:true,swat:true},
};
let cars=[];
function makeCar(type,x,y,a,col){
  const t=CT[type];
  const c={type,t,x,y,a,vx:0,vy:0,va:0,col:col||pick(t.cols),hp:t.hp,burn:-1,burnBy:null,wreck:false,wreckT:0,driver:null,ai:null,traffic:false,id:++uid,skid:false,sp:null,flash:0,lastBy:null,copsOut:0,vip:false,gang:null,shootT:1,cc:[[0,0],[0,0],[0,0]],smokeT:0};
  decorateCar(c);cars.push(c);return c;
}
function newAI(mode,dir,k,cruise){return{mode,dir,k,lastI:-1,turn:-1,sw:0,ti:0,tj:0,cruise:cruise||rr(130,200),blockT:0,stuckT:0,revT:0}}
function acquireLane(c){
  const d=((Math.round(c.a/(PI/2))%4)+4)%4;
  const k=(d===0||d===2)?clamp(Math.round((c.y/T-2)/P),0,NB):clamp(Math.round((c.x/T-2)/P),0,NB);
  c.ai=newAI('lane',d,k,rr(140,200));
}
const TRAFFIC_TYPES=['bus','limo','icecream','bike','bike','firetruck','sedan','sedan','sedan','compact','compact','compact','taxi','truck','sports','police','ambulance'];

// ===== Driving: a port of GTA2's per-tick car physics (CarPhysics in the GTA2 decompilation) =====
// GTA2 works in "tile units per tick" at 30 ticks/s. We scale one GTA2 tile to GT pixels (about one car
// length), run the same formulas, and raise per-tick factors to the power of (frame time x 30) so it runs
// smoothly at any frame rate.
const GT=56,TICK=30;
// Handling values straight from GTA2's nyc.gci (the GTA2 car each type uses is in 'src').
const HANDLING={
  compact:{src:'Bug',mass:6.3,fdb:1.0,fmb:0.45,brake:1.265,turnIn:0.3,turnRatio:0.175,res:1.5,hbs:0.65,thrust:0.095,max:0.235,anti:1.0,skid:0.05,g1:0.55,g2:0.625,g3:1.0,g2s:0.125,g3s:0.152,turbo:0},
  sedan:{src:'Aniston BD4',mass:14.5,fdb:0.6,fmb:0.5,brake:1.75,turnIn:0.145,turnRatio:0.45,res:1.25,hbs:0.18,thrust:0.146,max:0.3,anti:1.0,skid:0.085,g1:0.55,g2:0.725,g3:1.0,g2s:0.11,g3s:0.175,turbo:0},
  taxi:{src:'Taxi',mass:14.5,fdb:1.0,fmb:0.55,brake:2.5,turnIn:0.15,turnRatio:0.45,res:1.0,hbs:0.2,thrust:0.13,max:0.219,anti:1.0,skid:0.065,g1:0.6,g2:0.75,g3:1.0,g2s:0.125,g3s:0.175,turbo:0},
  sports:{src:'Z-Type',mass:15.0,fdb:1.0,fmb:0.5,brake:2.0,turnIn:0.4,turnRatio:0.35,res:1.175,hbs:0.4,thrust:0.145,max:0.405,anti:1.0,skid:0.12,g1:0.6,g2:0.7,g3:1.0,g2s:0.19,g3s:0.284,turbo:1},
  truck:{src:'Box Truck',mass:28.0,fdb:0.5,fmb:0.7,brake:2.0,turnIn:0.25,turnRatio:0.65,res:2.5,hbs:0.45,thrust:0.185,max:0.175,anti:0.75,skid:0.065,g1:0.545,g2:0.675,g3:1.0,g2s:0.088,g3s:0.114,turbo:0},
  police:{src:'Cop Car',mass:14.5,fdb:1.0,fmb:0.5,brake:2.0,turnIn:0.433,turnRatio:0.4,res:1.25,hbs:0.4,thrust:0.15,max:0.415,anti:1.0,skid:0.115,g1:0.55,g2:0.68,g3:1.0,g2s:0.18,g3s:0.29,turbo:1},
  fbi:{src:'Special Agent Car',mass:15.0,fdb:1.0,fmb:0.6,brake:2.0,turnIn:0.155,turnRatio:0.45,res:1.2,hbs:0.35,thrust:0.165,max:0.3,anti:0.8,skid:0.085,g1:0.55,g2:0.7,g3:1.0,g2s:0.13,g3s:0.195,turbo:0},
  ambulance:{src:'Ambulance',mass:18.0,fdb:0.55,fmb:0.55,brake:2.0,turnIn:0.22,turnRatio:0.7,res:1.3,hbs:0.28,thrust:0.165,max:0.25,anti:0.6,skid:0.11,g1:0.62,g2:0.74,g3:1.0,g2s:0.115,g3s:0.17,turbo:0},
  swat:{src:'SWAT Van',mass:22.0,fdb:0.5,fmb:0.6,brake:2.0,turnIn:0.25,turnRatio:0.8,res:1.4,hbs:0.3,thrust:0.175,max:0.225,anti:0.5,skid:0.13,g1:0.65,g2:0.75,g3:1.0,g2s:0.115,g3s:0.166,turbo:0},
  armytruck:{src:'Box Truck',mass:28.0,fdb:0.5,fmb:0.7,brake:2.0,turnIn:0.25,turnRatio:0.65,res:2.5,hbs:0.45,thrust:0.185,max:0.175,anti:0.75,skid:0.065,g1:0.545,g2:0.675,g3:1.0,g2s:0.088,g3s:0.114,turbo:0},
};
for(const k in HANDLING)if(CT[k])CT[k].max=HANDLING[k].max*GT*TICK;
CT.tank.max=0.1*GT*TICK; // GTA2 Tank max_speed 0.100
function hand(c){
  const t=c.t;if(t.h)return t.h;
  const H=Object.assign({},HANDLING[c.type]||(c.type==='tow'?HANDLING.pickup:null)||HANDLING.sedan);
  H.m=H.mass*1.1;                                   // ConvertMass: mass * 1.1
  const w=t.Wd/GT,h=t.L/GT,fm=H.m*H.fmb,rm=H.m*(1-H.fmb),base=(h*h*0.25+w*w)/12,hq=h*0.25;
  H.cg=(hq*fm-hq*rm)/H.m;                           // centre of mass shift from front mass bias
  H.I=fm*base+fm*(H.cg-hq)**2+rm*base+rm*(H.cg+hq)**2; // moment of inertia (front + rear halves)
  H.fw=t.L*0.3/GT-H.cg;H.rw=-t.L*0.3/GT-H.cg;      // wheel offsets from the centre of mass
  H.half=H.thrust/2;H.fifth=H.thrust/5;
  H.long=t.L>64;
  return t.h=H;
}
function carGear(c){const H=hand(c),v=hyp(c.vx,c.vy)/(GT*TICK);return v>H.g3s?3:v>H.g2s?2:1;}
function driveCar(c,thr,steer,hb,dt){if(c.t.heli){heliDrive(c,thr,steer,hb,dt);return;}
  if(c.air>0){c.skid=false;return;} // airborne: no grip, no steering
  if((c.driver==='ai'||c.driver==='cop')&&!c.t.tank&&!(c.ai&&c.ai.mode==='chase')&&!(c.gang!=null&&respect[c.gang]<=-3))return driveCarAI(c,thr,steer,hb,dt);
  const t=c.t;c.driven=true;
  if(t.tank){ // tanks pivot on the spot
    const ca=Math.cos(c.a),sa=Math.sin(c.a);let vf=c.vx*ca+c.vy*sa;
    vf=lerp(vf,thr*t.max*(thr<0?0.6:1),Math.min(1,dt*1.5));
    c.va=lerp(c.va,steer*t.turn,Math.min(1,dt*6));c.a+=c.va*dt;
    c.vx=Math.cos(c.a)*vf;c.vy=Math.sin(c.a)*vf;c.skid=false;return;
  }
  const G3H=c.driver==='player'&&OPT.handling==='gta3',H=hand(c),n=dt*TICK,isP=c.driver==='player',m=H.m*(isP?(G3H?1.4:1.05):1);
  // GTA III-style handling: the wheel turns in progressively instead of snapping, the car feels heavier and slides less
  if(G3H){c.sm=lerp(c.sm||0,steer,Math.min(1,dt*(Math.abs(steer)>Math.abs(c.sm||0)?4.2:9)));steer=c.sm;}
  const g=c.g||(c.g={fg:false,bg:false,fb:false,pedal:0,bp:0,hbc:0});
  let vx=c.vx/(GT*TICK),vy=c.vy/(GT*TICK),w=c.va/TICK;
  const fx=Math.cos(c.a),fy=Math.sin(c.a),speed=hyp(vx,vy),aligned=vx*fx+vy*fy>=0;
  // HandleUserInputs: what the gas/brake keys mean depends on which way the car is rolling
  const gasKey=thr>0.02,brakeKey=thr<-0.02;
  if(speed<0.004){g.fg=gasKey;g.bg=brakeKey;g.fb=false;}
  else if(aligned){if(g.bg){g.fg=g.bg=g.fb=false;}else{g.fg=gasKey;g.fb=brakeKey;g.bg=false;}}
  else if(g.fg){g.fg=g.bg=g.fb=false;}
  else{g.fb=gasKey;g.bg=brakeKey;g.fg=false;}
  // ApplyThrottleInput: pedal ramps 0.25/tick up to 5 (AI part-throttle caps it lower)
  if(g.fg||g.bg)g.pedal=Math.min(5*clamp(Math.abs(thr),0.2,1),g.pedal+0.25*n);else g.pedal=Math.max(0,g.pedal-0.25*n);
  // ApplyBrakePhysics: pressure ramps 0.25/tick up to 1, times brake friction
  if(g.fb)g.bp=Math.min(1,g.bp+0.25*n);else g.bp=0;
  const brakeF=g.bp*H.brake*(rain>0.5?0.8:1);
  g.hbc=hb?Math.min(128,g.hbc+n):0;
  // UpdateSteeringAngle: player steering shrinks with speed^2, AI steering is fixed
  const sfac=isP?Math.max(0.6-speed*speed,0.25)/(0.6*0.8):1;
  const pointing=H.turnRatio*steer*sfac,turning=Math.abs(steer)>0.05;
  // ComputeEngineTorque: half thrust + pedal * fifth thrust, times the gear multiplier
  // GetDamageFactorOnSpeed: past half damage, thrust and top speed fall off linearly
  const dfrac=1-clamp(c.hp/t.hp,0,1),dmg=dfrac>=0.5?Math.max(0.15,(1-dfrac)/0.5):1;
  // IsTurboActive: turbo cars double the pedal part of their thrust once the pedal is past 3
  const turboK=H.turbo&&g.pedal>=3?2:1;let torque=0;
  if(g.bg)torque=(speed===0&&hb)?0:-(H.half+g.pedal*H.fifth*turboK)*H.g1;
  else if(g.fg)torque=(speed===0&&hb)?0:(H.half+g.pedal*dmg*H.fifth*turboK)*(speed>H.g3s?H.g3:speed>H.g2s?H.g2:H.g1);
  const wet=1-rain*0.25;
  let Fx=0,Fy=0,tq=0,skidF=0,skidR=0;
  const wheel=(off,ang,frx,fry,drive)=>{
    const rx=fx*off,ry=fy*off,pvx=vx-w*ry,pvy=vy+w*rx;
    const wc=Math.cos(ang),ws=Math.sin(ang),lon=pvx*wc+pvy*ws,lat=-pvx*ws+pvy*wc;
    const flon=-lon*fry+drive,flat=-lat*frx;
    const wx=wc*flon-ws*flat,wy=ws*flon+wc*flat;
    Fx+=wx;Fy+=wy;tq+=rx*wy-ry*wx;return Math.abs(flat);
  };
  // CalculateFrontWheelForce: grip 1 (+turn in while steering), rolling 0.139 + 80% of the brakes
  skidF=wheel(H.fw,c.a+pointing,(turning?1+H.turnIn:1)*wet,0.139+brakeF*0.8,torque*H.fdb);
  // CalculateRearWheelForce: grip 1 (-turn in), handbrake slide + ramping handbrake, x rear end stability;
  // the rear steers against the front at low speed and with it at high speed
  {let frx=(turning?1-H.turnIn:1)*wet,fry=0.139+brakeF*0.2;
    if(hb){frx*=H.hbs;fry+=H.brake*g.hbc/128;}
    frx*=H.res;fry*=H.res;
    const rv=(0.6-speed)/(3.8*0.6);
    skidR=wheel(H.rw,c.a-pointing*rv,frx,fry,torque*(1-H.fdb));}
  // UpdateLinearAndAngularAccel + IntegrateAndClampVelocities
  vx+=Fx/m*n;vy+=Fy/m*n;w+=tq/H.I*n;
  if(Math.abs(vx)+Math.abs(vy)<1/256&&!g.fg&&!g.bg){vx=vy=0;}
  if(Math.abs(w)<1/256&&!turning)w=0;
  // StabilizeVelocityAtSpeed: every tick keep 90% of sideways speed, 97% of forward speed, 88% of spin
  {const ca=Math.cos(c.a),sa=Math.sin(c.a);
    if(Math.abs(vx)<=1/128&&Math.abs(vy)<=1/128){const k=Math.pow(0.9,n);vx*=k;vy*=k;}
    else{let lon=vx*ca+vy*sa,lat=-vx*sa+vy*ca;lat*=Math.pow(G3H&&!hb?0.86:0.9,n);lon*=Math.pow(0.97,n);vx=ca*lon-sa*lat;vy=sa*lon+ca*lat;}
    w*=Math.pow(G3H?0.85:0.88,n);}
  // EnforceGearSensitiveMaxSpeed: max speed going forwards, gear 2 speed going backwards
  {const sp=hyp(vx,vy),cap=(vx*fx+vy*fy>=0?H.max:H.g2s)*dmg*(c.flat?0.55:1);if(sp>cap){vx*=cap/sp;vy*=cap/sp;}if(c.flat&&sp>0.05)w+=(Math.random()-0.5)*0.004*n;}
  // ApplyArrowSteerAssist: on a road, gas held (pedal >= 2), no steering, within 25 deg of the lane
  // direction -> spin straight onto it, capped at 0.26 x speed (0.13 for long vehicles)
  let assist=0;
  if(isP&&OPT.assist!==false&&!turning&&g.pedal>=2&&aligned&&speed>0){
    const tx=Math.floor(c.x/T),ty=Math.floor(c.y/T);
    const dg=tx>=0&&ty>=0&&tx<W&&ty<W?DIAGT[ty*W+tx]:0;
    if(dg&&tileAt(tx,ty)===ROAD&&!(tx%P<4||ty%P<4)){const d=DIAGS[dg-1],ang=Math.atan2(d.uy,d.ux),axis=Math.abs(angDiff(ang,c.a))<PI/2?ang:ang+PI,e=angDiff(axis,c.a);
      if(Math.abs(e)<22*PI/180){const cap=(H.long?0.06:0.12)*hyp(vx,vy)*n;assist=clamp(e,-cap,cap);}}
    else if(tileAt(tx,ty)===ROAD){const mx=tx%P,my=ty%P,vert=mx<4,horz=my<4;
      if(vert!==horz){const axis=vert?(Math.sin(c.a)>=0?PI/2:-PI/2):(Math.cos(c.a)>=0?0:PI),e=angDiff(axis,c.a);
        if(Math.abs(e)<15*PI/180){const cap=(H.long?0.06:0.12)*hyp(vx,vy)*n;assist=clamp(e,-cap,cap);}}}
  }
  // the assist only turns the car for this step and is subtracted again afterwards (Field74Subtract),
  // so it never builds up spin
  c.a+=w*n+assist;
  c.vx=vx*GT*TICK;c.vy=vy*GT*TICK;c.va=w*TICK;
  c.skid=(skidF>=H.skid*0.9||skidR>=H.skid*0.9)&&speed>0.04;
}
// AI drivers keep a simpler grip-limited controller so traffic and cops can hold their lanes
const FWD_BIAS={compact:1,sedan:0.5,taxi:0.5,truck:0,sports:0,police:0.2,fbi:0.2,swat:0.3,armytruck:0.3,tank:0.5};
function physOf(c){
  const t=c.t;if(t.ph)return t.ph;
  const L=t.L,Wd=t.Wd;
  t.ph={lf:L*0.32,lr:L*0.32,I:(L*L+Wd*Wd)/12,C:16,muF:t.grip*88,muR:t.grip*84,turnIn:0.18,rearStab:1,hbSlide:0.22,
    steer:0.5*(t.turn/3),rearSteer:0.12,fBias:FWD_BIAS[c.type]!=null?FWD_BIAS[c.type]:0.4,roll:0.17};
  return t.ph;
}
function driveCarAI(c,thr,steer,hb,dt){
  const t=c.t,ph=physOf(c);c.driven=true;
  if(t.tank){ // tanks pivot on the spot
    const ca=Math.cos(c.a),sa=Math.sin(c.a);let vf=c.vx*ca+c.vy*sa;
    vf=lerp(vf,thr*t.max*(thr<0?0.6:1),Math.min(1,dt*1.5));
    c.va=lerp(c.va,steer*t.turn,Math.min(1,dt*6));c.a+=c.va*dt;
    c.vx=Math.cos(c.a)*vf;c.vy=Math.sin(c.a)*vf;c.skid=false;return;
  }
  const dmg=c.hp<t.hp*0.3?0.7:1,wet=1-rain*0.3;
  const ca0=Math.cos(c.a),sa0=Math.sin(c.a),vf0=c.vx*ca0+c.vy*sa0;
  const braking=thr<0&&vf0>15,reversing=thr<0&&!braking;
  c.brakeP=braking?Math.min(1,(c.brakeP||0.35)+dt*2.4):0.35;
  c.hbP=hb?Math.min(1,(c.hbP||0)+dt*0.9):0;
  const spd=hyp(c.vx,c.vy);
  const sf=clamp(1-Math.pow(spd/(t.max*1.1),2),0.3,1);
  const delta=steer*ph.steer*sf;
  const n=dt>0.02?2:1,h=dt/n;let skid=false;
  for(let k=0;k<n;k++){
    const ca=Math.cos(c.a),sa=Math.sin(c.a),vf=c.vx*ca+c.vy*sa;
    const gr=vf<t.max*0.34?1.3:vf<t.max*0.68?1.0:0.72;
    let drive=0;
    if(thr>0)drive=vf<-10?t.acc*2.4:(vf<t.max*dmg?t.acc*gr*thr*dmg:0);
    else if(reversing)drive=vf>-t.max*0.35?t.acc*0.6*thr:0;
    let ax=0,ay=0,tq=0;
    for(let w=0;w<2;w++){
      const front=w===0,d=front?ph.lf:-ph.lr,rx=ca*d,ry=sa*d;
      const pvx=c.vx-c.va*ry,pvy=c.vy+c.va*rx;
      const wa=c.a+(front?delta:-delta*ph.rearSteer*Math.max(0,1-spd/180));
      const wc=Math.cos(wa),ws=Math.sin(wa);
      const lon=pvx*wc+pvy*ws,lat=-pvx*ws+pvy*wc;
      let grip=steer?(front?1+ph.turnIn:1-ph.turnIn):1;if(!front)grip*=ph.rearStab;
      let mu=(front?ph.muF:ph.muR)*wet;
      if(!front&&hb){grip*=ph.hbSlide;mu*=lerp(0.55,ph.hbSlide*1.3,c.hbP);}
      let fl=-lat*ph.C*grip;
      if(Math.abs(fl)>mu){fl=Math.sign(fl)*mu;if(Math.abs(lat)>45&&spd>70)skid=true;}
      const bias=front?ph.fBias:1-ph.fBias;
      let flon=drive*bias-lon*ph.roll;
      if(braking)flon-=Math.sign(lon)*t.acc*1.0*c.brakeP*(front?1.2:0.8);
      if(!front&&hb&&Math.abs(lon)>5)flon-=Math.sign(lon)*t.acc*1.4*c.hbP;
      if(thr===0&&Math.abs(lon)<8)flon-=lon*6;
      const fx=wc*flon-ws*fl,fy=ws*flon+wc*fl;
      ax+=fx;ay+=fy;tq+=rx*fy-ry*fx;
    }
    c.vx+=ax*h;c.vy+=ay*h;c.va+=tq/ph.I*h;c.va*=Math.exp(-1.2*h);
    c.a+=c.va*h;
  }
  // hard top-speed cap
  {const ca=Math.cos(c.a),sa=Math.sin(c.a),vf=c.vx*ca+c.vy*sa,cap=t.max*dmg;if(vf>cap){const e=vf-cap;c.vx-=ca*e;c.vy-=sa*e;}}
  // GTA2 lane assist: gas on, no steering, roughly lined up with the road -> square up
  if(false&&steer===0&&thr>0&&spd>80&&Math.abs(c.va)<1.2){
    const tx=Math.floor(c.x/T),ty=Math.floor(c.y/T);
    if(tileAt(tx,ty)===ROAD){const axis=Math.round(c.a/(PI/2))*(PI/2),e=angDiff(axis,c.a);
      if(Math.abs(e)<0.44&&Math.abs(e)>0.002){const r=clamp(e,-1.4*dt,1.4*dt),cr=Math.cos(r),sr=Math.sin(r);c.a+=r;const vx=c.vx*cr-c.vy*sr;c.vy=c.vx*sr+c.vy*cr;c.vx=vx;}}
  }
  c.skid=skid||(hb&&spd>110);
}
function carCircles(c){
  const ca=Math.cos(c.a),sa=Math.sin(c.a),o=c.t.L/2-c.t.Wd/2;
  c.cc[0][0]=c.x+ca*o;c.cc[0][1]=c.y+sa*o;c.cc[1][0]=c.x;c.cc[1][1]=c.y;c.cc[2][0]=c.x-ca*o;c.cc[2][1]=c.y-sa*o;
}
function pointInCar(c,x,y,pad){
  const dx=x-c.x,dy=y-c.y,ca=Math.cos(c.a),sa=Math.sin(c.a);
  const lx=dx*ca+dy*sa,ly=-dx*sa+dy*ca;
  return Math.abs(lx)<c.t.L/2+(pad||0)&&Math.abs(ly)<c.t.Wd/2+(pad||0);
}
function circleTiles(o,r,sw,z){
  let hit=null;
  const x0=Math.floor((o.x-r)/T),x1=Math.floor((o.x+r)/T),y0=Math.floor((o.y-r)/T),y1=Math.floor((o.y+r)/T);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    {const tt=tileAt(tx,ty);if(!isSolid(tt)||(sw&&tt===WATER))continue;
     if(tt===BLD&&z>4&&typeof bldAt==='function'){const cx2=(tx+.5)*T,cy2=(ty+.5)*T,b=bldAt(cx2,cy2);if(b&&(FOOT_LADDER||roofAbs(b,cx2,cy2)-GH(o.x,o.y)<=z+8))continue;}}
    const cx=clamp(o.x,tx*T,tx*T+T),cy=clamp(o.y,ty*T,ty*T+T);
    const dx=o.x-cx,dy=o.y-cy,d2=dx*dx+dy*dy;
    if(d2>=r*r)continue;
    let nx,ny,pen;
    if(d2<1e-6){
      const l=o.x-tx*T,rt=tx*T+T-o.x,u=o.y-ty*T,dn=ty*T+T-o.y,m=Math.min(l,rt,u,dn);
      if(m===l){nx=-1;ny=0;pen=l+r}else if(m===rt){nx=1;ny=0;pen=rt+r}else if(m===u){nx=0;ny=-1;pen=u+r}else{nx=0;ny=1;pen=dn+r}
    }else{const d=Math.sqrt(d2);nx=dx/d;ny=dy/d;pen=r-d}
    o.x+=nx*pen;o.y+=ny*pen;
    if(!hit)hit={nx:0,ny:0};hit.nx+=nx;hit.ny+=ny;
  }
  return hit;
}
// ---- vehicle collisions: oriented boxes (they match what you see in 3D) with spin and scraping friction ----
const CAR_E=0.18,CAR_MU=0.35,SPINK=0.42;
const CARPTS=[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1],[0.5,1],[0.5,-1],[-0.5,1],[-0.5,-1]];
function crashFx(c,x,y,nx,ny,imp,other){
  if(imp<90)return;
  const by=(c.driver==='player'||(other&&other.driver==='player'))?'player':null;
  if(c===player.car||other===player.car)shake=Math.max(shake,imp/42);
  if(imp>200)for(let k=0;k<4;k++)puff(x,y,rr(-170,170),rr(-170,170),rr(.6,1.1),rr(3,5),pick(other?[c.col,other.col]:[c.col]),'debris');
  if(imp>140&&nearPlayer(x,y,700))sfx('crash',clamp(imp/500,0.2,1));
  for(let k=0;k<5;k++)puff(x,y,rr(-110,110)+nx*50,rr(-110,110)+ny*50,0.35,2,'#ffd27a','spark');
  return by;
}
function carTiles(c){if(c.t.heli&&(c.alt||0)>30)return;
  const t=c.t,hl=t.L/2,hw=t.Wd/2,m=t.mass,I=m*(t.L*t.L+t.Wd*t.Wd)/12;
  let hitN=null,maxImp=0,hx=0,hy=0;
  for(let it=0;it<2;it++){
    const ca=Math.cos(c.a),sa=Math.sin(c.a);let any=false;
    for(const q of CARPTS){
      const rx=ca*q[0]*hl-sa*q[1]*hw,ry=sa*q[0]*hl+ca*q[1]*hw,px=c.x+rx,py=c.y+ry,tx=Math.floor(px/T),ty=Math.floor(py/T);
      const SOL=c.t.boat?boatSolid:(x,y)=>isSolid(tileAt(x,y));
      if(!SOL(tx,ty))continue;
      const cands=[[px-tx*T,-1,0],[tx*T+T-px,1,0],[py-ty*T,0,-1],[ty*T+T-py,0,1]].sort((a,b)=>a[0]-b[0]);
      let ch=cands[0];for(const k of cands)if(!SOL(tx+k[1],ty+k[2])){ch=k;break;}
      const nx=ch[1],ny=ch[2];c.x+=nx*(ch[0]+0.3);c.y+=ny*(ch[0]+0.3);any=true;
      const vpx=c.vx-c.va*ry,vpy=c.vy+c.va*rx,vn=vpx*nx+vpy*ny;
      if(vn<0){
        const rn=rx*ny-ry*nx,j=-(1+CAR_E)*vn/(1/m+rn*rn/I*SPINK);
        c.vx+=nx*j/m;c.vy+=ny*j/m;c.va+=rn*j/I*SPINK;
        const tX=-ny,tY=nx,vt=vpx*tX+vpy*tY,rt=rx*tY-ry*tX;let jt=-vt/(1/m+rt*rt/I*SPINK);const mx=CAR_MU*j;jt=clamp(jt,-mx,mx);
        c.vx+=tX*jt/m;c.vy+=tY*jt/m;c.va+=rt*jt/I*SPINK;
        if(-vn>maxImp){maxImp=-vn;hitN=[nx,ny];hx=px;hy=py;}
      }
    }
    if(!any)break;
  }
  if(hitN){
    // drivers glance off walls rather than sticking (a gentle GTA2-style turn to follow the wall)
    if(c.driver){const tang=Math.atan2(hitN[0],-hitN[1]),tA=Math.abs(angDiff(tang,c.a))<PI/2?tang:tang+PI;c.va+=clamp(angDiff(tA,c.a),-1,1)*(PI/180)*TICK*0.3;}
    if(maxImp>110)damageCar(c,(maxImp-110)*0.07,c.driver==='player'?'player':null);bikeCrash(c,maxImp);
    crashFx(c,hx,hy,hitN[0],hitN[1],maxImp+20,null);
  }
}
function carPair(a,b){
  if(!!a.t.boat!==!!b.t.boat)return;if((a.t.heli&&a.alt>20)||(b.t.heli&&b.alt>20))return;if(a.driver==='race'&&b.driver==='race')return;
  if(a.air>0||b.air>0)return;
  const ra0=hyp(a.t.L,a.t.Wd)/2,rb0=hyp(b.t.L,b.t.Wd)/2,dx=b.x-a.x,dy=b.y-a.y;
  if(dx*dx+dy*dy>(ra0+rb0)*(ra0+rb0))return;
  const aF=[Math.cos(a.a),Math.sin(a.a)],aR=[-aF[1],aF[0]],bF=[Math.cos(b.a),Math.sin(b.a)],bR=[-bF[1],bF[0]];
  const ax=[aF,aR],bx=[bF,bR],ha=[a.t.L/2,a.t.Wd/2],hb=[b.t.L/2,b.t.Wd/2];
  let best=1e9,nx=0,ny=0,own=0;
  for(let k=0;k<4;k++){const n=k<2?ax[k]:bx[k-2];
    const pa=ha[0]*Math.abs(n[0]*aF[0]+n[1]*aF[1])+ha[1]*Math.abs(n[0]*aR[0]+n[1]*aR[1]);
    const pb=hb[0]*Math.abs(n[0]*bF[0]+n[1]*bF[1])+hb[1]*Math.abs(n[0]*bR[0]+n[1]*bR[1]);
    const dd=dx*n[0]+dy*n[1],ov=pa+pb-Math.abs(dd);if(ov<=0)return;
    if(ov<best){best=ov;const s=dd<0?-1:1;nx=n[0]*s;ny=n[1]*s;own=k<2?0:1;}}
  // contact point: the other box's corner that digs in deepest
  let cx=0,cy=0;{const src=own===0?b:a,sx=own===0?bx:ax,sh=own===0?hb:ha,dir=own===0?-1:1;let bv=-1e9;
    for(const s1 of[-1,1])for(const s2 of[-1,1]){const vx=src.x+sx[0][0]*sh[0]*s1+sx[1][0]*sh[1]*s2,vy=src.y+sx[0][1]*sh[0]*s1+sx[1][1]*sh[1]*s2,p=(vx*nx+vy*ny)*dir;if(p>bv){bv=p;cx=vx;cy=vy;}}}
  const ma=a.t.mass*(a.driver?1:1.5)*(a.wreck?2:1),mb=b.t.mass*(b.driver?1:1.5)*(b.wreck?2:1),tm=ma+mb;
  a.x-=nx*best*mb/tm;a.y-=ny*best*mb/tm;b.x+=nx*best*ma/tm;b.y+=ny*best*ma/tm;
  const Ia=ma*(a.t.L*a.t.L+a.t.Wd*a.t.Wd)/12,Ib=mb*(b.t.L*b.t.L+b.t.Wd*b.t.Wd)/12;
  const rax=cx-a.x,ray=cy-a.y,rbx=cx-b.x,rby=cy-b.y;
  const vax=a.vx-a.va*ray,vay=a.vy+a.va*rax,vbx=b.vx-b.va*rby,vby=b.vy+b.va*rbx,rv=(vbx-vax)*nx+(vby-vay)*ny;
  if(rv>=0)return;
  const rna=rax*ny-ray*nx,rnb=rbx*ny-rby*nx,j=-(1+CAR_E)*rv/(1/ma+1/mb+(rna*rna/Ia+rnb*rnb/Ib)*SPINK);
  a.vx-=nx*j/ma;a.vy-=ny*j/ma;a.va-=rna*j/Ia*SPINK;b.vx+=nx*j/mb;b.vy+=ny*j/mb;b.va+=rnb*j/Ib*SPINK;
  const tX=-ny,tY=nx,vt=(vbx-vax)*tX+(vby-vay)*tY,rta=rax*tY-ray*tX,rtb=rbx*tY-rby*tX;
  let jt=-vt/(1/ma+1/mb+(rta*rta/Ia+rtb*rtb/Ib)*SPINK);const mx=CAR_MU*j;jt=clamp(jt,-mx,mx);
  a.vx-=tX*jt/ma;a.vy-=tY*jt/ma;a.va-=rta*jt/Ia*SPINK;b.vx+=tX*jt/mb;b.vy+=tY*jt/mb;b.va+=rtb*jt/Ib*SPINK;
  const imp=-rv;
  // you only get the blame when you drove into them (not when a cop rams you)
  const appA=a.vx*nx+a.vy*ny,appB=-(b.vx*nx+b.vy*ny),pl=a.driver==='player'?appA:b.driver==='player'?appB:-1,ot=a.driver==='player'?appB:appA;
  if(imp>90){const by2=pl>60&&pl>=ot*0.8?'player':null;
    const ka=(a===player.car&&b.driver==='cop')?0.5:1,kb=(b===player.car&&a.driver==='cop')?0.5:1;
    damageCar(a,(imp-90)*0.06*mb/ma*ka,by2);damageCar(b,(imp-90)*0.06*ma/mb*kb,by2);
    crashFx(a,cx,cy,nx,ny,imp,b);
    if(by2&&imp>200){if(a.driver==='ai'&&a.ai)a.ai.cruise=290;if(b.driver==='ai'&&b.ai)b.ai.cruise=290;}}
}
function damageCar(c,amt,by){
  if(c.wreck||amt<=0)return;
  {const H=HANDLING[c.type];if(H)amt*=H.anti;}
  if(c.up&&c.up.armor)amt*=0.5;
  c.hp-=amt;if(by){c.lastBy=by;c.lastByT=game.t;}c.flash=0.06;
  if(c.hp<=0&&c.burn<0)ignite(c,by||(c.lastBy&&game.t-(c.lastByT||0)<6?c.lastBy:null));
}
function ignite(c,by){
  c.burn=2.4+R()*1.2;c.burnBy=by;c.hp=0;
  if(c.driver==='ai'||c.driver==='cop'){ejectDriver(c,true);}
  if(c.driver==='player'){showBig('GET OUT!','Your car is on fire','#ff5a1f',1.6);}
}
function carExplode(c){
  c.wreck=true;c.burn=-1;c.wreckT=0;c.vx*=0.3;c.vy*=0.3;c.va+=rr(-3,3);
  if(c.driver==='player'){player.hp=0;}
  if(c.driver&&c.driver!=='player'){c.driver=null;}
  c.ai=null;
  explode(c.x,c.y,c.burnBy);
  if(c.burnBy==='player'){crime(c.t.police?500:200,1);chaos();addMoney((c.t.police?250:100)*combo.n);if(frenzy&&frenzy.kind==='cars')frenzyHit();if(c.gang!=null){addRespect(c.gang,-0.6);addRespect(rivalOf(c.gang),0.3);}}
  if(nearPlayer(c.x,c.y,520))slowT=Math.max(slowT,0.4);
  if(mission&&mission.type==='hit'&&mission.car===c)missionPass();
}
function ejectDriver(c,flee){
  const ca=Math.cos(c.a),sa=Math.sin(c.a),off=c.t.Wd/2+10;
  let x=c.x+sa*off,y=c.y-ca*off;
  if(solidPx(x,y)){x=c.x-sa*off;y=c.y+ca*off;}
  const cop=c.driver==='cop';
  const p=makePed(x,y,cop);
  if(cop&&c.t.swat)p.hp=70;
  if(c.gang!=null){makeGang(p,c.gang);p.angry=12;}
  if(cop){p.state='cop';p.car=c;c.copsOut++;}
  else if(flee&&c.gang==null){p.state='flee';p.panic=rr(4,7);p.fx=c.x;p.fy=c.y;}
  c.driver=null;c.ai=null;
  return p;
}

// ================= PEDS =================
let peds=[];
const SHIRTS=['#7e4a3a','#33568f','#4f6b3f','#5a4a6a','#8a5a2a','#a9a69e','#2f5e58','#9a8a3a','#5a5f63','#3a3a3a','#4a3a2a','#6a3a4a','#2e3a4a'];
const SKIN=['#f1c27d','#e0ac69','#c68642','#8d5524','#ffdbac','#a86b3c'];
const HAIR=['#222','#4a2f1b','#8b5a2b','#d9b35b','#777','#111','#b5651d'];
function makePed(x,y,cop){
  const p={x,y,a:R()*TAU,vx:0,vy:0,flash:0,stagger:0,heavy:false,kind:null,col:cop?'#2b4c9b':pick(SHIRTS),skin:pick(SKIN),hair:pick(HAIR),state:cop?'cop':'walk',tx:x,ty:y,dir:Math.floor(R()*4),panic:0,fx:0,fy:0,hp:cop?50:25,cop:!!cop,shootT:rr(.5,1.2),anim:R()*9,moving:false,gun:false,car:null,gone:false,cross:false,gang:null,angry:0,target:false,id:++uid};
  peds.push(p);return p;
}
function pedPickNext(p){
  const tx=Math.floor(p.x/T),ty=Math.floor(p.y/T);
  const opts=[];
  for(let d=0;d<4;d++)if(walkable(tileAt(tx+DX[d],ty+DY[d])))opts.push(d);
  // road crossing
  const cd=p.dir;
  const cok=!opts.includes(cd)&&tileAt(tx+DX[cd],ty+DY[cd])===ROAD&&walkable(tileAt(tx+DX[cd]*5,ty+DY[cd]*5))?crossOK(p,tx,ty,cd):false;
  if(cok==='wait'){p.tx=p.x;p.ty=p.y;return;}
  if(cok===true){
    p.tx=(tx+DX[cd]*5+.5)*T;p.ty=(ty+DY[cd]*5+.5)*T;p.cross=true;return;
  }
  if(!opts.length){
    for(let d=0;d<4;d++)if(tileAt(tx+DX[d],ty+DY[d])===ROAD&&walkable(tileAt(tx+DX[d]*5,ty+DY[d]*5))){p.dir=d;p.tx=(tx+DX[d]*5+.5)*T;p.ty=(ty+DY[d]*5+.5)*T;p.cross=true;return;}
    p.tx=p.x+rr(-30,30);p.ty=p.y+rr(-30,30);return;
  }
  let d;const rev=(p.dir+2)&3;
  if(opts.includes(p.dir)&&R()<0.8)d=p.dir;
  else{const o2=opts.filter(o=>o!==rev);d=o2.length?pick(o2):pick(opts);}
  p.dir=d;p.cross=false;
  p.tx=(tx+DX[d]+.5)*T+rr(-8,8);p.ty=(ty+DY[d]+.5)*T+rr(-8,8);
}
function panicAround(x,y,r){
  const r2=r*r;
  for(const p of peds)if(!p.cop&&!p.crew&&!p.follow&&!(p.gang!=null&&(p.angry>0||respect[p.gang]<=-2||respect[p.gang]>=3))&&dist2(p.x,p.y,x,y)<r2){p.state='flee';p.panic=rr(4,8);p.fx=x;p.fy=y;}
  for(const c of cars)if(c.driver==='ai'&&c.ai&&dist2(c.x,c.y,x,y)<r2*0.6)c.ai.cruise=Math.max(c.ai.cruise,260);
}
// GTA III-style drops: people you take down leave cash; cops and gang members leave their gun
const DROPS=[];
function dropLoot(p){if(DROPS.length>40)DROPS.shift();const o=()=>({x:p.x+rr(-8,8),y:p.y+rr(-8,8),t:30});
  if(p.cop&&R()<0.35)DROPS.push(Object.assign(o(),{kind:'shotgun'}));else if(p.gang!=null&&R()<0.5)DROPS.push(Object.assign(o(),{kind:'smg'}));
  if(R()<0.7)DROPS.push(Object.assign(o(),{kind:'cash',n:Math.round(rr(1,8))*5+(p.gang!=null?40:0)}));}
function updateDrops(dt){for(let i=DROPS.length-1;i>=0;i--){const d=DROPS[i];d.t-=dt;if(d.t<=0){DROPS.splice(i,1);continue;}
  if(game.state!=='play'||dist2(d.x,d.y,player.x,player.y)>(player.car?28:18)**2||(player.jz||0)>10)continue;
  if(d.kind==='cash'){addMoney(d.n);}else if(d.kind==='smg'){if(player.ammo[1]===Infinity)continue;player.ammo[1]=(player.ammo[1]||0)+40;note('SMG +40');}else if(d.kind==='shotgun'){if(player.ammo[2]===Infinity)continue;player.ammo[2]=(player.ammo[2]||0)+8;note('Shotgun +8');}
  sfx('pickup',0.4);DROPS.splice(i,1);}}
// ---- GTA III-style tempers: some people you punch, and some drivers you jack, fight back with their fists.
// A jacked driver will even drag you back out of their car if you sit still next to them.
const BRAWL_SAY=['Hey! That\'s my car!','You want some?','Come here!','Big mistake, pal.','Oh, it\'s ON.'];
function startBrawl(p,t,car){p.brawl=t;p.punchT=0.6;p.dragT=0;p.jackCar=car||p.jackCar||null;p.state='walk';p.panic=0;p.say={text:pick(BRAWL_SAY),t:2};}
function brawlTick(p,dt){p.brawl-=dt;if(game.state!=='play'){p.brawl=0;return false;}
  const inMine=player.car&&player.car===p.jackCar,tg=inMine?player.car:player.car?null:player;
  if(!tg){p.brawl=Math.min(p.brawl,1);return false;}
  const dx=tg.x-p.x,dy=tg.y-p.y,d=hyp(dx,dy),reach=inMine?tg.t.Wd/2+14:15;if(d>520){p.brawl=0;return false;}
  p.a=lerpAng(p.a,Math.atan2(dy,dx),Math.min(1,dt*12));
  if(d>reach){const sp=inMine?150:138;p.vx=dx/d*sp;p.vy=dy/d*sp;p.x+=p.vx*dt;p.y+=p.vy*dt;p.moving=true;p.anim+=dt*sp*0.18;circleTiles(p,6);p.dragT=0;return true;}
  p.vx=p.vy=0;p.moving=false;
  if(inMine){if(hyp(tg.vx,tg.vy)<30){p.dragT+=dt;if(p.dragT>1.3){exitCar(true);player.hurt=0.3;hurtPlayer(5);note('Dragged out of the car!');p.dragT=0;
      // and they drive off in it
      const c=p.jackCar;if(c&&!player.car&&!c.wreck){c.driver='ai';c.traffic=true;acquireLane(c);c.ai.cruise=240;p.gone=true;}}}else p.dragT=0;return true;}
  p.punchT-=dt;if(p.punchT<=0){p.punchT=rr(0.7,1.1);hurtPlayer(rr(3,6));sfx('hit',0.45);shake=Math.max(shake,1.5);player.vx+=Math.cos(p.a)*60;player.vy+=Math.sin(p.a)*60;}
  return true;}
// ---- hidden packages unlock weapons at your safehouses (every 10), like GTA III ----
const PKG_REWARDS=[['smg','SMG'],['grenade','Grenades'],['shotgun','Shotgun'],['rocket','Rocket launcher'],['armor','Body armor']];
let safeTier=-1;
function pkgTier(){const n=PACKAGES.filter(k=>k.got).length;return Math.min(PKG_REWARDS.length,Math.floor(n/10)+(n>=PACKAGES.length?1:0));}
function syncSafePickups(){const t=pkgTier();if(t===safeTier)return;safeTier=t;
  for(let i=pickups.length-1;i>=0;i--)if(pickups[i].sh)pickups.splice(i,1);
  for(const sh of SAFEHOUSES)for(let i=0;i<t;i++)pickups.push({x:sh.x-44+i*22,y:sh.y+46,kind:PKG_REWARDS[i][0],taken:false,t:0,sh});}
function killPed(p,by,fvx,fvy,burnt){
  if(p.gone)return;if(p.boss){p.hp=9999;return;}if(by==='player'&&!p.follow&&!p.crew&&!burnt)dropLoot(p);if(by==='player'){STATS.kills++;if(p.cop)STATS.cops++;turfKill(p);}
  p.gone=true;
  const body={k:'body',x:p.x,y:p.y,a:p.a,col:burnt?'#1a1612':p.col,skin:burnt?'#1a1612':p.skin,hair:p.hair,cop:p.cop};
  if(fvx||fvy)flyers.push({b:body,vx:fvx,vy:fvy,va:rr(-12,12),t:0.55});
  else{addMark({k:'blood',x:p.x,y:p.y,r:rr(9,14)});addMark(body);}
  if(p.gang!=null&&by==='player'){addRespect(p.gang,-0.7);addRespect(rivalOf(p.gang),0.35);chaos();if(frenzy&&frenzy.kind==='gang')frenzyHit();}
  if(p.target&&mission&&mission.type==='turf'){mission.left--;if(mission.left>0)note(mission.left+' left');}
  if(nearPlayer(p.x,p.y,800))sfx('splat',0.8);
  panicAround(p.x,p.y,220);
  if(by==='player'){crime(p.cop?500:p.gang!=null?1:100,copWitness(p.x,p.y)?1:0);}
  if(p.car&&p.car.copsOut>0)p.car.copsOut--;
}

// ================= PARTICLES / DECALS =================
let parts=[],skids=[],marks=[],flyers=[],fires=[];
function puff(x,y,vx,vy,life,size,col,type){if(parts.length>800)parts.shift();parts.push({x,y,vx,vy,life,max:life,size,col,type})}
function addMark(m){if(marks.length>160)marks.shift();marks.push(m);decalMark(m)}
function addSkid(x1,y1,x2,y2){if(skids.length>700)skids.shift();skids.push([x1,y1,x2,y2]);decalSkid(x1,y1,x2,y2)}
let shake=0;
function explode(x,y,by){
  sfx('boom',nearPlayer(x,y,500)?1:0.4);
  if(nearPlayer(x,y,900))shake=Math.max(shake,22);
  puff(x,y,0,0,0.25,90,'#fff3b0','flash');
  for(let i=0;i<34;i++){const a=R()*TAU,s=rr(40,260);puff(x,y,Math.cos(a)*s,Math.sin(a)*s,rr(.4,.9),rr(8,18),pick(['#ffb02e','#ff6a00','#ffd35a','#ff3d00']),'fire');}
  for(let i=0;i<22;i++){const a=R()*TAU,s=rr(20,120);puff(x,y,Math.cos(a)*s,Math.sin(a)*s,rr(1.2,2.4),rr(12,24),pick(['#333','#444','#222']),'smoke');}
  for(let i=0;i<10;i++){const a=R()*TAU,s=rr(150,400);puff(x,y,Math.cos(a)*s,Math.sin(a)*s,rr(.5,1),3,'#222','debris');}
  addMark({k:'scorch',x,y,r:rr(38,50)});
  for(const c of cars){
    if(c.wreck)continue;const d=hyp(c.x-x,c.y-y);
    if(d<115){const f=1-d/115;damageCar(c,160*f+12,by);const n=d||1;c.vx+=(c.x-x)/n*320*f/c.t.mass;c.vy+=(c.y-y)/n*320*f/c.t.mass;c.va+=rr(-4,4)*f;}
  }
  for(const p of peds){if(!p.gone&&dist2(p.x,p.y,x,y)<95*95){const d=hyp(p.x-x,p.y-y)||1;killPed(p,by,(p.x-x)/d*320,(p.y-y)/d*320,true);}}
  if(!player.car&&game.state==='play'){const d=hyp(player.x-x,player.y-y);if(d<95)hurtPlayer(70*(1-d/95)+12);}
  panicAround(x,y,420);
}

// ================= PLAYER / STATE =================
// fire intervals follow GTA2's reload ticks (pistol 20, dual 10, smg 2, shotgun 40) scaled for 60fps play
const WEAPONS=[
  {name:'Pistol',rate:.4,dmg:30,spd:980,spread:0,kind:'b',cdmg:7,kick:3},
  {name:'SMG',rate:.075,dmg:18,spd:1000,spread:.045,kind:'b',cdmg:4,kick:1.4},
  {name:'Shotgun',rate:.8,dmg:24,spd:900,spread:0,kind:'b',cdmg:6,fan:[0,-6,6,-12,12],kick:8},
  {name:'Flamethrower',rate:.045,dmg:0,spd:380,spread:.18,kind:'f',cdmg:2.5,kick:0},
  {name:'Molotovs',rate:.8,dmg:0,spd:430,spread:.03,kind:'m',cdmg:0,kick:0},
  {name:'Rockets',rate:1.0,dmg:0,spd:520,spread:0,kind:'r',cdmg:0,kick:7},
  {name:'Dual Pistols',rate:.2,dmg:30,spd:980,spread:.01,kind:'b',cdmg:7,dual:true,kick:2.5},
];
var GYM=0;const PMAX=()=>100+GYM*10; // max health: +10 per gym session, up to 150
const player={x:0,y:0,a:0,body:0,jz:0,jv:0,vx:0,vy:0,hp:100,car:null,w:0,ammo:[Infinity,0,0,0,0,0,0],cool:0,anim:0,hurt:0,moving:false};
const game={state:'menu',t:0,paused:false,timer:0,started:false};
let money=0;try{money=+(localStorage.getItem('gridlock_money')||0)||0}catch(e){}
function saveMoney(){try{localStorage.setItem('gridlock_money',String(money))}catch(e){}}
function addMoney(n){money=Math.max(0,money+n);saveMoney();if(n>0)moneyPop={n,t:1.4};}
let moneyPop=null;
let heat=0,evadeT=0,bustT=0,copSpawnT=0,bustNote=false,stickyNote=false;
// GTA2 wanted points: 600/1600/3000/5000/8000/12000 for 1-6 stars.
const TH=[0,600,1600,3000,5000,8000,12000];
let seenT=0,lastSeenX=0,lastSeenY=0,roadblockT=12;
function stars(){let s=0;for(let i=1;i<=6;i++)if(heat>=TH[i])s=i;return s}
function crime(points,minStars){const before=stars();heat=Math.min(TH[6],heat+points);if(minStars&&heat<TH[minStars])heat=TH[minStars];
  if(stars()>before){seenT=0;lastSeenX=player.x;lastSeenY=player.y;if(before===0)note('The cops are after you!');}}
function copWitness(x,y){
  for(const c of cars)if(c.driver==='cop'&&!c.wreck&&dist2(c.x,c.y,x,y)<430*430&&los(c.x,c.y,x,y))return true;
  for(const p of peds)if(p.cop&&!p.gone&&dist2(p.x,p.y,x,y)<380*380&&los(p.x,p.y,x,y))return true;
  return false;
}
const COPKIND=c=>c.t.tank?'tank':c.t.army?'army':c.t.fbi?'fbi':c.t.swat?'swat':'police';
const DISPATCH=[null,{police:1},{police:1},{police:2},{police:2,swat:1},{fbi:2},{army:2,tank:1}];
const KIND_TYPE={police:'police',swat:'swat',fbi:'fbi',army:'armytruck',tank:'tank'};
// GTA2 NPC aim: standing still -> 1 in 3 dead on, else +-10deg; moving -> mostly off by 10 or 16deg
function npcAim(a,moving){const D10=10*PI/180,D16=16*PI/180;let r;
  if(moving){r=Math.floor(R()*5);if(r===0)r=Math.floor(R()*5);}else r=Math.floor(R()*3);
  return a+[0,-D10,D10,-D16,D16][r];}
function clearHeat(){
  heat=0;evadeT=0;seenT=0;
  for(const c of cars)if(c.ai&&c.ai.mode==='chase'){acquireLane(c);}
  for(const p of peds)if(p.cop&&p.state==='cop'){p.state='walk';p.gun=false;pedPickNext(p);}
}
function hurtPlayer(n){if(game.state!=='play')return;if(player.armor>0){const a=Math.min(player.armor,n*0.75);player.armor-=a;n-=a;}player.hp-=n;player.hurt=0.35;vib(20);if(player.hp<=0){player.hp=0;wasted();}}
function nearPlayer(x,y,r){return dist2(x,y,player.x,player.y)<r*r}

function respawnAt(sp){
  crewReset();
  if(player.car){player.car.driver=null;player.car.traffic=true;player.car=null;}
  fadeIn=1;player.riding=null;player.x=sp.x;player.y=sp.y;player.body=0;player.a=0;player.jz=0;player.jv=0;cam.yaw=0;cam.dist=96;cam.h=40;cam.x=sp.x-96;cam.y=sp.y;player.hp=PMAX();player.vx=player.vy=0;player.w=0;player.ammo=[Infinity,0,0,0,0,0,0];
  clearHeat();frenzy=null;
  for(const p of peds)if(p.cop&&dist2(p.x,p.y,sp.x,sp.y)<300*300)p.gone=true;
  game.state='play';
}
function wasted(){if(game.state!=='play')return;game.state='wasted';game.timer=DEATH_T;slowT=Math.max(slowT,1.1);STATS.wasted++;vib(300);showBig('WASTED','','#d8262c',DEATH_T);sfx('fail');if(mission)missionFail(true);}
function busted(){if(game.state!=='play')return;game.state='busted';game.timer=DEATH_T;slowT=Math.max(slowT,0.8);STATS.busted++;vib([120,60,120]);showBig('BUSTED','','#5aa2ff',DEATH_T);sfx('fail');if(mission)missionFail(true);}

// ================= MESSAGES =================
let big=null;const ticker=[];
function showBig(text,sub,col,dur){big={text,sub,col,t:dur||2.5,max:dur||2.5}}
function note(text){ticker.push({text,t:4});if(ticker.length>4)ticker.shift()}

// ================= PICKUPS / PHONES / MISSIONS =================
const pickups=[];
function farApart(list,x,y,minD){for(const q of list)if(dist2(q.x,q.y,x,y)<minD*minD)return false;return true}
(function genPickups(){
  const kinds=['bribe','bribe','dual','smg','shotgun','rocket','health','health','cash','cash','flame','molotov','health','cash','smg','shotgun','molotov','frenzy','frenzy','frenzy','health'];
  let tries=0;
  kinds.push(...kinds);
  while(pickups.length<kinds.length&&tries<5000){tries++;
    const [tx,ty]=pick(walkTiles);const x=(tx+.5)*T,y=(ty+.5)*T;
    if(farApart(pickups,x,y,T*14))pickups.push({x,y,kind:kinds[pickups.length],taken:false,t:0,fixed:true});
  }
})();
const phones=[];
(function genPhones(){
  let tries=0;
  while(phones.length<14&&tries<5000){tries++;
    const [tx,ty]=pick(walkTiles);
    let adj=false;for(let d=0;d<4;d++)if(tileAt(tx+DX[d],ty+DY[d])===BLD)adj=true;
    if(!adj)continue;
    const x=(tx+.5)*T,y=(ty+.5)*T;
    if(farApart(phones,x,y,T*20))phones.push({x,y});
  }
})();
phones.forEach(ph=>ph.gang=zoneOf(ph.x,ph.y));
let ringing=-1,ringT=3,ringSoundT=0,mission=null,firstRing=false;
const MISSION_TYPES=['deliver','hit','cases','escape'];
let lastMissionType='';
function startMission(g){
  if(g==null)g=-1;
  const types=g>=0?MISSION_TYPES.concat(['turf','turf']):MISSION_TYPES;
  let type;do{type=pick(types)}while(type===lastMissionType);
  if(!cityOpen()&&type==='turf'&&!WOK(...(()=>{const zc=[[NB/4,NB/4],[NB*3/4,NB/4],[NB/4,NB*3/4]][rivalOf(g)];return[zc[0]*P*T,zc[1]*P*T];})()))type='deliver';
  lastMissionType=type;
  sfx('pass');
  if(type==='deliver'){
    const far=lotBlocks.filter(l=>dist2(l.x,l.y,player.x,player.y)>(T*30)**2&&WOK(l.x,l.y));
    const dest=far.length?pick(far):pick(lotBlocks);
    const d=hyp(dest.x-player.x,dest.y-player.y);
    mission={type,title:'Special Delivery',desc:'Steal any car and bring it to the drop zone',x:dest.x,y:dest.y,timer:Math.round(clamp(d/170+30,45,120)),max:0};
  }else if(type==='hit'){
    let c=null;
    for(let i=0;i<60&&!c;i++){const a=R()*TAU,dd=rr(800,1500);const s=laneSpotNear(player.x+Math.cos(a)*dd,player.y+Math.sin(a)*dd);if(s&&WOK(s.x,s.y)&&!carNear(s.x,s.y,90)){c=makeCar('sports',s.x,s.y,s.dir*PI/2,'#d4af37');c.driver='ai';c.ai=newAI('lane',s.dir,s.k,230);c.vip=true;c.t=Object.assign({},CT.sports,{hp:160});c.hp=160;if(g>=0)c.gang=rivalOf(g);}}
    if(!c){mission=null;ringT=2;return startMission(g);}
    mission={type,title:'Hit the Golden Viper',desc:'A '+(g>=0?GANGS[rivalOf(g)].name:'rival')+' boss is cruising in a gold sports car. Wreck it.',car:c,timer:150};
  }else if(type==='cases'){
    const items=[];let tries=0;
    while(items.length<4&&tries<3000){tries++;const [tx,ty]=pick(walkTiles);const x=(tx+.5)*T,y=(ty+.5)*T;const d=hyp(x-player.x,y-player.y);
      if(d>T*10&&d<T*38&&WOK(x,y)&&farApart(items,x,y,T*9))items.push({x,y,got:false});}
    mission={type,title:'Briefcase Run',desc:'Grab the 4 briefcases before the cops do',items,timer:110};
  }else if(type==='turf'){
    const rv=rivalOf(g),zc=[[NB/4,NB/4],[NB*3/4,NB/4],[NB/4,NB*3/4]][rv];
    const targets=[];let tries=0;
    while(targets.length<6&&tries<3000){tries++;const [tx,ty]=pick(walkTiles);const x=(tx+.5)*T,y=(ty+.5)*T;
      if(zoneOf(x,y)!==rv||dist2(x,y,zc[0]*P*T,zc[1]*P*T)>(T*24)**2||!farApart(targets,x,y,T*3))continue;
      const p=makePed(x,y,false);makeGang(p,rv);p.target=true;p.hp=50;pedPickNext(p);targets.push(p);}
    mission={type,title:'Turf War',desc:'Take out 6 '+GANGS[rv].name+' on their turf',targets,left:targets.length,timer:180};
  }else{
    mission={type,title:'Hot Potato',desc:'You\'re carrying stolen goods. Lose a 3-star wanted level: spray shops or cop bribes.',timer:150,elapsed:0};
    heat=Math.max(heat,TH[3]);evadeT=0;
  }
  mission.max=mission.timer;mission.gang=g;
  if(g>=0)mission.title=GANGS[g].name+': '+mission.title;
  showBig(mission.title.toUpperCase(),mission.desc,'#ffcc00',3.2);
}
function missionPass(){
  if(!mission)return;
  let reward={deliver:1500,hit:2500,cases:2000,escape:3000}[mission.type];
  if(mission.type==='deliver'&&player.car){reward+=Math.round(1000*clamp(player.car.hp/player.car.t.hp,0,1));
    const c=player.car;exitCar(true);cars.splice(cars.indexOf(c),1);note('The garage took the car');}
  addMoney(reward);sfx('pass');
  showBig('MISSION PASSED!','+$'+reward.toLocaleString(),'#3ee07a',3);
  if(mission.type==='hit'&&mission.car)mission.car.vip=false;
  if(mission.type==='turf')for(const q of mission.targets)q.target=false;
  if(mission.gang>=0){addRespect(mission.gang,2);addRespect(rivalOf(mission.gang),-1);note(GANGS[mission.gang].name+' respect you more. '+GANGS[rivalOf(mission.gang)].name+' less.');}
  mission=null;ringT=6;
}
function missionFail(silent){
  if(!mission)return;
  if(mission.type==='story'){storyFail(silent?false:'Out of time');return;}
  if(mission.type==='hit'&&mission.car){mission.car.vip=false;mission.car.traffic=true;}
  if(mission.type==='turf')for(const q of mission.targets)q.target=false;
  if(mission.gang>=0)addRespect(mission.gang,-0.5);
  mission=null;ringT=8;
  if(!silent){showBig('MISSION FAILED!','','#ff4040',2.6);sfx('fail');}
}

let frenzy=null;
function startFrenzy(){
  const kind=R()<0.5?'cars':'gang';
  if(kind==='cars'){player.ammo[5]+=25;player.w=5;frenzy={kind,goal:8,count:0,timer:50,title:'Wreck 8 cars'};}
  else{const z=zoneOf(player.x,player.y),g=z>=0?z:Math.floor(R()*3);player.ammo[1]+=300;player.w=1;
    frenzy={kind,goal:12,count:0,timer:60,title:'Take out 12 gang members'};
    for(let i=0;i<16;i++){const a=R()*TAU,d=rr(180,420),x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d;if(isSolid(tileAt(Math.floor(x/T),Math.floor(y/T))))continue;const p=makePed(x,y,false);makeGang(p,g);p.angry=60;pedPickNext(p);}}
  showBig('KILL FRENZY!',frenzy.title,'#ff3b3b',2.6);sfx('pass');
}
function frenzyHit(){frenzy.count++;if(frenzy.count>=frenzy.goal){const r=3000;addMoney(r);showBig('FRENZY PASSED','+$'+r.toLocaleString(),'#3ee07a',2.8);sfx('pass');frenzy=null;}}
function gangAttack(p,tg,d,dt){
  p.gun=true;
  const a=Math.atan2(tg.y-p.y,tg.x-p.x);p.a=lerpAng(p.a,a,0.3);
  const sp=d>150?120:d<90?-60:0;
  p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp;p.moving=sp!==0;p.anim+=dt*20;
  p.x+=p.vx*dt;p.y+=p.vy*dt;circleTiles(p,6);
  p.shootT-=dt;
  if(p.shootT<=0){p.shootT=rr(.8,1.5);const aa=npcAim(a,sp!==0);fireBullet(p.x+Math.cos(aa)*12,p.y+Math.sin(aa)*12,aa,850,'gang',6,'b',5);sfx('shot',nearPlayer(p.x,p.y,600)?0.45:0.15);puff(p.x+Math.cos(aa)*14,p.y+Math.sin(aa)*14,0,0,0.06,9,'#fff2a8','flash');}
}
// ================= SPAWNING =================
function laneSpotNear(x,y){
  const tx=Math.floor(x/T),ty=Math.floor(y/T);
  if(tx<0||ty<0||tx>=W||ty>=W)return null;
  const mx=tx%P,my=ty%P;
  if(mx<4&&my<4)return null;if(map[ty*W+tx]!==ROAD)return null;
  if(mx<4){const k=Math.floor(tx/P),d=mx<2?1:3;return{x:laneCoord(d,k),y:(ty+.5)*T,dir:d,k}}
  if(my<4){const k=Math.floor(ty/P),d=my<2?2:0;return{x:(tx+.5)*T,y:laneCoord(d,k),dir:d,k}}
  return null;
}
function carNear(x,y,r){for(const c of cars)if(dist2(c.x,c.y,x,y)<r*r)return true;return false}
let viewR=800;
function spawnTraffic(forcePolice,chase){
  for(let i=0;i<16;i++){
    let a=R()*TAU,d=viewR+rr(80,420);
    if(chase){d=rr(1050,1450);const hd=player.car?player.car.a:player.body;if(Math.abs(angDiff(a,hd+PI))<1.2)a+=PI;}
    const dsp=R()<0.3?diagSpotNear(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d):null;
    if(dsp&&!carNear(dsp.x,dsp.y,100)&&!camSees(dsp.x,dsp.y)){const c=makeCar(forcePolice?(typeof forcePolice==='string'?forcePolice:'police'):trafficType(dsp.x,dsp.y),dsp.x,dsp.y,dsp.a);c.traffic=true;c.driver=c.t.police?'cop':'ai';if(c.t.tank||c.t.army||c.t.fbi||c.t.swat)c.traffic=false,c.special=true;
      c.ai=newAI('diag',0,0);c.ai.di=dsp.di;c.ai.dir=dsp.dir;if(chase)c.ai.mode='chase';const sp=c.ai.cruise*0.8;c.vx=Math.cos(dsp.a)*sp;c.vy=Math.sin(dsp.a)*sp;return c;}
    const s=laneSpotNear(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d);
    if(!s||carNear(s.x,s.y,100)||camSees(s.x,s.y))continue;
    const z=zoneOf(s.x,s.y),gangCar=!forcePolice&&z>=0&&R()<0.22;
    const type=forcePolice?(typeof forcePolice==='string'?forcePolice:'police'):gangCar?pick(GANG_TYPES[z]):trafficType(s.x,s.y);
    const c=makeCar(type,s.x,s.y,s.dir*PI/2,gangCar?GANGS[z].car:undefined);
    if(gangCar)c.gang=z;
    c.traffic=true;c.driver=c.t.police?'cop':'ai';
    if(c.t.tank||c.t.army||c.t.fbi||c.t.swat)c.traffic=false,c.special=true;
    c.ai=newAI(chase?'chase':'lane',s.dir,s.k);
    const sp=c.ai.cruise*0.8;c.vx=DX[s.dir]*sp;c.vy=DY[s.dir]*sp;
    return c;
  }
  return null;
}
function spawnRoadblock(s){
  const c0=player.car,sp=hyp(c0.vx,c0.vy),dx=c0.vx/sp,dy=c0.vy/sp;
  for(let tries=0;tries<6;tries++){
    const dd=FOG1+60+tries*70,px=c0.x+dx*dd,py=c0.y+dy*dd;
    const tx=Math.floor(px/T),ty=Math.floor(py/T);if(tx<0||ty<0||tx>=W||ty>=W)continue;
    const mx=tx%P,my=ty%P;if((mx<4)===(my<4))continue;
    const vert=mx<4,k=vert?Math.floor(tx/P):Math.floor(ty/P);
    const type=s>=6?'armytruck':s>=5?'fbi':s>=4?'swat':'police';
    const spots=vert?[[(k*P+1)*T,(ty+.5)*T],[(k*P+3)*T,(ty+.5)*T]]:[[(tx+.5)*T,(k*P+1)*T],[(tx+.5)*T,(k*P+3)*T]];
    if(spots.some(q=>carNear(q[0],q[1],70)))continue;
    for(const q of spots){const c=makeCar(type,q[0],q[1],vert?0:PI/2);c.traffic=true;c.roadblock=true;}
    const back=vert?[0,Math.sign(dy)*40]:[Math.sign(dx)*40,0];
    for(let i=0;i<2;i++){const q=spots[i],cp=makePed(q[0]+back[0],q[1]+back[1],true);cp.state='cop';cp.heavy=s>=4;cp.kind=type;cp.gun=true;}
    note('Roadblock ahead!');return true;
  }
  return false;
}
function spawnPed(){
  for(let i=0;i<8;i++){
    const a=R()*TAU,d=viewR+rr(40,300);
    const x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d;
    const t=tileAt(Math.floor(x/T),Math.floor(y/T));
    if(t!==WALK&&t!==GRASS&&!(t===LOT&&PARKT[Math.floor(y/T)*W+Math.floor(x/T)]===9))continue;if(y>=WPX||x<0||y<0||x>=WPX)continue;
    if(camSees(x,y))continue;
    const p=makePed(x,y,R()<0.04);if(p.cop)p.state='walk';else{const z=zoneOf(x,y);if(z>=0&&R()<0.28)makeGang(p,z);}
    if(!p.cop&&p.gang==null&&PARKT[Math.floor(y/T)*W+Math.floor(x/T)]===1&&R()<0.45){p.jog=true;p.col=pick(['#ff5a8a','#5ad1ff','#ffe25a','#7cff6a']);}
    // people dress for their part of town: hard hats and hi-vis at the docks, suits uptown, tourists in Times Square
    if(!p.cop&&p.gang==null&&!p.jog){const dn=districtAt(x,y);
      if(dn==='THE DOCKS'&&R()<0.7){p.col=pick(['#e8701a','#e8c81a','#3a5a8a']);p.hat=pick(['#f0c020','#f0f0ea','#e8701a']);}
      else if((dn==='UPTOWN'||dn==='MILLIONAIRE\'S ROW'||dn==='MIDTOWN')&&R()<0.4){p.col=pick(['#2a2c34','#3a3c44','#22283a','#4a4038']);}
      else if(dn==='TIMES SQUARE'&&R()<0.5){p.col=pick(['#ff5a8a','#5ad1ff','#ffe25a','#ffffff','#7cff6a']);if(R()<0.5)p.hat=pick(['#f0e6c8','#d8302a','#2a6ad8']);}
      else if((dn==='LOTUS QUARTER'||dn==='LOTUS BAY')&&R()<0.25)p.hat='#2a2a2a';}
    pedPickNext(p);return;
  }
}

// ================= FLOW FIELD (cop pathing) =================
const FF=new Int16Array(W*W),Q=new Int32Array(W*W);
let ffT=0;
function buildFF(px,py){
  FF.fill(-1);
  let sx=clamp(Math.floor(px/T),0,W-1),sy=clamp(Math.floor(py/T),0,W-1);
  let h=0,tl=0;Q[tl++]=sy*W+sx;FF[sy*W+sx]=0;
  while(h<tl){
    const i=Q[h++],x=i%W,y=(i/W)|0,v=FF[i]+1;
    if(v>200)continue;
    if(x>0){const n=i-1;if(FF[n]<0&&!isSolid(map[n])){FF[n]=v;Q[tl++]=n}}
    if(x<W-1){const n=i+1;if(FF[n]<0&&!isSolid(map[n])){FF[n]=v;Q[tl++]=n}}
    if(y>0){const n=i-W;if(FF[n]<0&&!isSolid(map[n])){FF[n]=v;Q[tl++]=n}}
    if(y<W-1){const n=i+W;if(FF[n]<0&&!isSolid(map[n])){FF[n]=v;Q[tl++]=n}}
  }
}
const D8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function ffNext(x,y,steps){
  let tx=Math.floor(x/T),ty=Math.floor(y/T);
  if(tx<0||ty<0||tx>=W||ty>=W)return null;
  let cur=FF[ty*W+tx];if(cur<0)return null;
  for(let s=0;s<steps;s++){
    let best=cur,bx=-1,by=-1;
    for(const dd of D8){const nx=tx+dd[0],ny=ty+dd[1];if(nx<0||ny<0||nx>=W||ny>=W)continue;const v=FF[ny*W+nx];if(v<0||v>=best)continue;
      if(dd[0]&&dd[1]&&(FF[ty*W+nx]<0||FF[ny*W+tx]<0))continue;best=v;bx=nx;by=ny;}
    if(bx<0)break;tx=bx;ty=by;cur=best;
  }
  return[(tx+.5)*T,(ty+.5)*T];
}
function los(x1,y1,x2,y2){
  const d=hyp(x2-x1,y2-y1),n=Math.ceil(d/14);
  for(let i=1;i<n;i++){const t=i/n;if(solidPx(x1+(x2-x1)*t,y1+(y2-y1)*t))return false}
  return true;
}
function decorateCar(c){const t=c.t,r=Math.random;
  if(t.twoTone&&r()<0.35)c.roofc=pick([[236,236,230],[26,26,28],[180,176,166],[120,30,26]]);
  if((c.type==='muscle'&&r()<0.6)||(c.type==='sports'&&r()<0.3)||(c.type==='roadster'&&r()<0.25))c.stripe=pick([[240,240,236],[22,22,24],[230,186,30],[200,40,30]]);
  if(c.type==='pickup'&&r()<0.45)c.cargo=pick([[150,110,64],[90,90,96],[60,90,140],[170,150,110]]);
  if(c.type==='van'&&r()<0.6)c.livery=pick(LIVERY);
  if(c.type==='wagon'&&r()<0.25)c.wood=true;
  if(c.type==='foodtruck')c.awn=pick([[230,60,40],[250,210,60],[40,150,90],[240,240,236]]);
  if(c.type==='sedan'&&r()<0.12)c.roofc=pick([[236,236,230],[26,26,28]]);}
