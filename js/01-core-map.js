'use strict';
const VERSION='4.20.1',REPO='kefirman9000/Gridlock-City',REPO_OLD='kefirman9000/aether-isles',PAGES_URL=/\.github\.io$/.test(location.hostname)?location.origin+location.pathname.replace(/[^/]*$/,''):'https://kefirman9000.github.io/Gridlock-City/'; // the site's own address, so links keep working whatever the repo is called
async function fetchLatest(){for(const rp of[REPO,REPO_OLD]){try{const r=await fetch('https://raw.githubusercontent.com/'+rp+'/main/version.json?t='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json();}catch(_){}}throw new Error('offline');}
// ================= SETUP =================
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
let VW=800,VH=600,DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);const vv=window.visualViewport;VW=Math.round(vv?vv.width:window.innerWidth);VH=Math.round(vv?vv.height:window.innerHeight);cv.style.width=VW+'px';cv.style.height=VH+'px';cv.width=Math.floor(VW*DPR);cv.height=Math.floor(VH*DPR);}
window.addEventListener('resize',resize);resize();

const PI=Math.PI,TAU=PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
let R=Math.random;
var barriersUp=false; // bridges closed while the city opens in stages (see cityOpen in 05-story.js)
let CITY_SEED=0;try{CITY_SEED=+(localStorage.getItem('gc_city_seed')||0)}catch(_){}
if(!CITY_SEED){CITY_SEED=((Math.random()*2**31)|0)||7;try{localStorage.setItem('gc_city_seed',String(CITY_SEED))}catch(_){}}
R=(a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296})(CITY_SEED);
// v4.15 reshaped the city (the docks, a third avenue), so collectibles saved against an older layout no longer line up
const SAVE_SEED=CITY_SEED+'/L3';
const rr=(a,b)=>a+R()*(b-a);
const pick=a=>a[Math.floor(R()*a.length)];
const angDiff=(a,b)=>{let d=(a-b)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d};
const lerpAng=(a,b,t)=>a+angDiff(b,a)*t;
const dist2=(ax,ay,bx,by)=>{const dx=ax-bx,dy=ay-by;return dx*dx+dy*dy};
const hyp=Math.hypot;
let uid=0;
let rain=0,rainTarget=0,weatherT=45,clock=0.79,darkness=0,lightning=0,slowT=0;

const shadeCache={};
function shade(hex,k){const key=hex+k;if(shadeCache[key])return shadeCache[key];
  let h=hex.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');
  const n=parseInt(h,16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  r=clamp(Math.round(r*k),0,255);g=clamp(Math.round(g*k),0,255);b=clamp(Math.round(b*k),0,255);
  return shadeCache[key]=`rgb(${r},${g},${b})`;}
function rrect(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect){ctx.roundRect(x,y,w,h,r)}else{ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}}

// ================= MAP =================
const T=32,P=14,NB=18,W=NB*P+4,WPX=W*T;
const ROAD=0,WALK=1,BLD=2,GRASS=3,TREE=4,LOT=5,SPRAY=6,CRUSH=7,WATER=8;
const map=new Uint8Array(W*W);
const tileAt=(x,y)=>(x<0||y<0||x>=W||y>=W)?(x>=HTX0&&x<HTX1&&y>=HTY0&&y<HTY1?hallTile(x,y):y>=W?oobRoom(x,y):countryTile(x,y)):map[y*W+x];
function oobRoom(x,y){if(!window.__roomsReady)return countryTile(x,y);const t=roomTile(x,y);return t<0?countryTile(x,y):t;}
// outside the city: drive and walk on the fields, hills and beaches; the sea is water; the world ends near the terrain edge
function countryTile(tx,ty){if(!window.__terrainReady)return BLD;const px=(tx+.5)*T,py=(ty+.5)*T;
  if(px<-HM+180||py<-HM+180||px>WPX+HM-180||py>WPX+HM-180)return BLD;
  for(const b of OUTB)if(px>b.x&&px<b.x+b.w&&py>b.y&&py<b.y+b.h)return BLD;
  const t=TTYPE[(((py+HM)/HS)|0)*HN+(((px+HM)/HS)|0)];return t===1?WATER:t===6?BLD:GRASS;}
const OUTB=[];
const setT=(x,y,t)=>{map[y*W+x]=t};
const isSolid=t=>t===BLD||t===TREE||t===WATER;
const solidPx=(x,y)=>isSolid(tileAt(Math.floor(x/T),Math.floor(y/T)));
const walkable=t=>t===WALK||t===GRASS||t===LOT||t===SPRAY||t===CRUSH;
const crusherPads=[];
const buildings=[],trees=[],walkTiles=[],lotBlocks=[],sprayPads=[],parkedSpots=[];
const SPECIAL={'1,1':'hospital','15,14':'police','4,4':'spray','15,7':'spray','3,13':'spray','16,10':'spray','9,15':'spray','5,10':'crusher','14,1':'crusher'};
let tallBlock=false;
const ROOFS=['#6e6a64','#7a6656','#5a636b','#77756b','#5f5248','#4c5555','#857c6a','#636b58','#6e5a5e','#555868','#7d5f55','#646c73'];
let hospitalSpawn,policeSpawn;
const laneCoord=(d,k)=>d===0?(k*P+3)*T:d===2?(k*P+1)*T:d===1?(k*P+1)*T:(k*P+3)*T;
const DX=[1,0,-1,0],DY=[0,1,0,-1];

// ---- city generation: districts with their own architecture, suburbs, natural parks ----
// Roads keep the GTA-style grid (traffic, cops and missions depend on it); everything inside the blocks varies.
const PARKT=new Uint8Array(W*W); // 1 park, 2 house yard, 3 plaza, 4 construction dirt, 5 Times Square paving, 6 sand, 7 boardwalk
const RIV=new Uint8Array(W*W);   // 1 river water
const RAMPS=[];
// landmark districts
// the East River: a wide channel cutting Westside Island off from the city, crossed by three bridges
const RIVX0=88,RIVX1=112,BRIDGES=[3,9,15,17],BIGB=9; // 17: the coast road crosses the river mouth by the beach
const bridgeRow=ty=>ty%P<4&&BRIDGES.includes(Math.floor(ty/P));
const BRT=new Uint8Array(W*W),DECKS=[],PIERS=[];
// ---- diagonal avenues (a Broadway through Times Square, and one across Westside Island) ----
const DIAGT=new Uint8Array(W*W);
const DIAGS=[[114,30,218,238],[2,240,86,72],[128,226,226,156]].map(([ax,ay,bx,by])=>{ax*=T;ay*=T;bx*=T;by*=T;const L=hyp(bx-ax,by-ay),ux=(bx-ax)/L,uy=(by-ay)/L;return{ax,ay,bx,by,L,ux,uy,nx:-uy,ny:ux};});
const DHW=56,DSW=84;
function diagRel(d,x,y){const px=x-d.ax,py=y-d.ay;return[px*d.ux+py*d.uy,px*d.nx+py*d.ny];} // [along, signed side]
function diagDist(d,x,y){const[t,sd]=diagRel(d,x,y);if(t<0)return hyp(x-d.ax,y-d.ay);if(t>d.L)return hyp(x-d.bx,y-d.by);return Math.abs(sd);}
const nearDiag=(x,y,r)=>DIAGS.some(d=>diagDist(d,x,y)<r);
function diagPix(i,xi,yi,nz,tx,ty){const d=DIAGS[i],[t,sd]=diagRel(d,xi,yi),a=Math.abs(sd);if(t<-DHW||t>d.L+DHW)return null;
  const grid=MXT[tx]<4||MXT[ty]<4;
  // where the avenue crosses a street, the street's own asphalt shows: no avenue sidewalk painted across it
  if(grid&&a>=DHW)return null;
  if(a<DHW){let r=43+nz,g=44+nz,b=47+nz;
    if(!grid){const PT2=P*T,ux=xi%PT2,uy=yi%PT2,eg=Math.min(Math.max(0,ux-128),PT2-ux,Math.max(0,uy-128),PT2-uy);
      // a zebra crossing on the avenue where it meets each street, then the usual markings
      // (stripes run with the traffic and alternate across the road, like the crossings on the grid streets)
      if(eg<14&&eg>6&&a<DHW-6){if((((sd+60)/6)|0)&1){r=206;g=206;b=200;}}
      else if(eg<=4){}
      else if(a<2.4&&a>0.6){r=168;g=137;b=58;}else if(Math.abs(a-28)<1&&(((t/18)|0)&1)){r=200;g=200;b=194;}else if(a>DHW-3){r=85;g=87;b=92;}}
    return[r,g,b];}
  if(a<DSW){if(a<DHW+3)return[150,147,140];const c=140+nz;return[c,c-3,c-10];}
  return null;}
function diagAvenues(){const sp=new Set();for(const k in SPECIAL)sp.add(k);
  const isSpecialTile=(tx,ty)=>{const bx=Math.floor(tx/P),by=Math.floor(ty/P);return sp.has(bx+','+by)&&tx%P>=4&&ty%P>=4;};
  DIAGS.forEach((d,i)=>{const x0=Math.floor(Math.min(d.ax,d.bx)/T)-4,x1=Math.ceil(Math.max(d.ax,d.bx)/T)+4,y0=Math.floor(Math.min(d.ay,d.by)/T)-4,y1=Math.ceil(Math.max(d.ay,d.by)/T)+4;
    for(let ty=Math.max(0,y0);ty<Math.min(W,y1);ty++)for(let tx=Math.max(0,x0);tx<Math.min(W,x1);tx++){const ti=ty*W+tx,t=map[ti];if(t===WATER||RIV[ti]||BRT[ti]||isSpecialTile(tx,ty))continue;
      const dd=diagDist(d,(tx+.5)*T,(ty+.5)*T);if(dd<DSW+18)DIAGT[ti]=i+1;
      if(dd<DHW+10){map[ti]=ROAD;PARKT[ti]=0;}else if(dd<DSW+12&&t!==ROAD){map[ti]=WALK;PARKT[ti]=0;}}});
  // buildings, trees and props in the way are cleared; leftover slivers become little triangle parks
  for(let i=buildings.length-1;i>=0;i--){const b=buildings[i];let hit=false;
    for(const d of DIAGS){for(let k=0;k<=8&&!hit;k++){const qx=b.x+b.w*((k%3)/2),qy=b.y+b.h*(Math.floor(k/3)/2);if(diagDist(d,qx,qy)<DSW+14)hit=true;}}
    if(!hit)continue;buildings.splice(i,1);
    for(let ty=Math.floor(b.y/T);ty<Math.ceil((b.y+b.h)/T);ty++)for(let tx=Math.floor(b.x/T);tx<Math.ceil((b.x+b.w)/T);tx++){const ti=ty*W+tx;if(map[ti]===BLD){map[ti]=GRASS;PARKT[ti]=1;if(R()<0.25)addTree((tx+.5)*T,(ty+.5)*T,pick(['round','round','sakura']),0.8);}}}
  const clear=o=>!nearDiag(o.x,o.y,DSW+6);
  for(const arr of[trees,props,lotBlocks,parkedSpots,RAMPS]){const keep=arr.filter(clear);arr.length=0;arr.push(...keep);}
  for(let ty=0;ty<W;ty++)for(let tx=0;tx<W;tx++){const ti=ty*W+tx;if(map[ti]===BLD&&nearDiag((tx+.5)*T,(ty+.5)*T,DSW+10)){map[ti]=WALK;PARKT[ti]=0;}}
  // street trees along the avenue
  for(const d of DIAGS)for(let t=60;t<d.L-60;t+=110)for(const s2 of[-1,1]){const x=d.ax+d.ux*t+d.nx*s2*(DHW+14),y=d.ay+d.uy*t+d.ny*s2*(DHW+14),tx=Math.floor(x/T),ty=Math.floor(y/T);
    if(map[ty*W+tx]===WALK&&tx%P>=4&&ty%P>=4&&R()<0.7)addTree(x,y,'round',0.6);}}
// ---- alleys: narrow service lanes cut through some downtown and old-town blocks (dumpsters, the odd jump) ----
function alleys(){for(let by=0;by<NB;by++)for(let bx=0;bx<NB;bx++){const k=BLOCKK[by*NB+bx];if(k!=='bld'||R()>0.32)continue;
    const x0=bx*P,y0=by*P;if(nearDiag((x0+9)*T,(y0+9)*T,9*T))continue;const hz=R()<0.5,m=pick([7,8,9]);
    const inA=(tx,ty)=>hz?(ty-y0===m||ty-y0===m+1)&&tx-x0>=4&&tx-x0<=13:(tx-x0===m||tx-x0===m+1)&&ty-y0>=4&&ty-y0<=13;
    const ax0=hz?(x0+4)*T:(x0+m)*T,ay0=hz?(y0+m)*T:(y0+4)*T,aw=hz?10*T:2*T,ah=hz?2*T:10*T;
    for(let i=buildings.length-1;i>=0;i--){const b=buildings[i];if(b.x<ax0+aw&&b.x+b.w>ax0&&b.y<ay0+ah&&b.y+b.h>ay0){buildings.splice(i,1);
      for(let ty=Math.floor(b.y/T);ty<Math.ceil((b.y+b.h)/T);ty++)for(let tx=Math.floor(b.x/T);tx<Math.ceil((b.x+b.w)/T);tx++)if(map[ty*W+tx]===BLD){map[ty*W+tx]=LOT;PARKT[ty*W+tx]=0;}}}
    for(let ty=y0+4;ty<=y0+13;ty++)for(let tx=x0+4;tx<=x0+13;tx++)if(inA(tx,ty)){map[ty*W+tx]=LOT;PARKT[ty*W+tx]=0;}
    for(const o of[0.3,0.7])props.push({x:hz?ax0+aw*o:ax0+T*(R()<0.5?0.3:1.7),y:hz?ay0+T*(R()<0.5?0.3:1.7):ay0+ah*o,k:'bin'});
    if(R()<0.35)addRamp(ax0+aw/2,ay0+ah/2,hz?(R()<0.5?0:PI):(R()<0.5?PI/2:-PI/2),'wood');}}
// traffic on the avenues
function diagSpotNear(x,y){for(let i=0;i<DIAGS.length;i++){const d=DIAGS[i],[t,sd]=diagRel(d,x,y);if(t<d.L*0.05||t>d.L*0.95||Math.abs(sd)>350)continue;
    const dir=R()<0.5?1:-1,ux=d.ux*dir,uy=d.uy*dir,lx=-uy,ly=ux;const px=d.ax+d.ux*t+lx*26,py=d.ay+d.uy*t+ly*26;
    if(map[Math.floor(py/T)*W+Math.floor(px/T)]!==ROAD)continue;return{x:px,y:py,a:Math.atan2(uy,ux),di:i,dir};}return null;}
// is the road from intersection (ix,iy) heading dd still land (or a bridge)?
// Some street segments are closed and turned into pedestrian plazas and park paths, so the city isn't a perfect grid:
// blocks merge into superblocks, streets end in T-junctions and bends.
const HTX0=28,HTX1=54,HTY0=W+13,HTY1=W+18; // the subway hall, off the south edge of the map
function hallTile(tx,ty){return tx>HTX0&&tx<HTX1-1&&ty>HTY0&&ty<HTY1-1?WALK:BLD;}
const CUT=new Set();
const segKey=(ix,iy,dd)=>dd===0?'h'+ix+','+iy:dd===2?'h'+(ix-1)+','+iy:dd===1?'v'+ix+','+iy:'v'+ix+','+(iy-1);
function linkBase(ix,iy,dd){if(dd===0&&ix>=NB||dd===2&&ix<=0||dd===1&&iy>=NB||dd===3&&iy<=0)return false;if(dd===1||dd===3)return ix!==7;const a=dd===0?ix:ix-1;return(a!==6&&a!==7)||BRIDGES.includes(iy);}
function linkOK(ix,iy,dd){if(barriersUp&&(dd===0||dd===2)){const a=dd===0?ix:ix-1;if(a===6||a===7)return false;}return linkBase(ix,iy,dd)&&!CUT.has(segKey(ix,iy,dd));}
function nodeDeg(ix,iy){let n=0;for(let d=0;d<4;d++)if(linkOK(ix,iy,d))n++;return n;}
function cutStreets(){
  const keep=new Set();const K=(k)=>keep.add(k);
  for(let i=0;i<=NB;i++){K('h'+i+',0');K('h'+i+','+NB);K('v0,'+i);K('v'+NB+','+i);K('v6,'+i);K('v8,'+i);}       // city edge and riverside drives
  for(const iy of BRIDGES)for(let a=3;a<=10;a++)K('h'+a+','+iy);                                              // bridge approaches, Gridlock Sprint
  for(let a=9;a<16;a++){K('h'+a+',5');K('h'+a+',14');}for(let b=5;b<14;b++){K('v9,'+b);K('v16,'+b);}          // under the El
  for(const k in SPECIAL){const[bx,by]=k.split(',').map(Number);K('h'+bx+','+by);K('h'+bx+','+(by+1));K('v'+bx+','+by);K('v'+(bx+1)+','+by);}
  for(const d of[0,1,2,3])K(segKey(TSQ.ix,TSQ.iy,d));
  const nodes=[];for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++)if(!(ix===7&&!BRIDGES.includes(iy)))nodes.push([ix,iy]);
  const reach=()=>{const seen=new Set(['0,0']),q=[[0,0]];while(q.length){const[x,y]=q.pop();for(let d=0;d<4;d++)if(linkOK(x,y,d)){const nx=x+DX[d],ny=y+DY[d],k=nx+','+ny;if(!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}return seen.size;};
  const base=reach(),cands=[];
  for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++)for(const d of[0,1])if(linkBase(ix,iy,d)&&!keep.has(segKey(ix,iy,d)))cands.push([ix,iy,d]);
  for(let i=cands.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[cands[i],cands[j]]=[cands[j],cands[i]];}
  let want=Math.round(cands.length*0.24);
  for(const[ix,iy,d]of cands){if(want<=0)break;const nx=ix+DX[d],ny=iy+DY[d];if(nodeDeg(ix,iy)<=2||nodeDeg(nx,ny)<=2)continue;
    const k=segKey(ix,iy,d);CUT.add(k);if(reach()<base){CUT.delete(k);continue;}want--;}}
// turn each closed segment into a pedestrian plaza, or a lawn with trees where it runs between parks
function fillCuts(){for(const k of CUT){const h=k[0]==='h',[a,b]=k.slice(1).split(',').map(Number);
  const x0=h?a*P+4:a*P,x1=h?(a+1)*P-1:a*P+3,y0=h?b*P:b*P+4,y1=h?b*P+3:(b+1)*P-1;
  const bk1=h?BLOCKK[(b-1)*NB+a]:BLOCKK[b*NB+a-1],bk2=h?BLOCKK[b*NB+a]:BLOCKK[b*NB+a],green=(bk1==='park'||bk1==='cpark'||bk1==='res')&&(bk2==='park'||bk2==='cpark'||bk2==='res');
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(x<0||y<0||x>=W||y>=W)continue;map[y*W+x]=green?GRASS:WALK;PARKT[y*W+x]=green?1:3;}
  const L=h?x1-x0+1:y1-y0+1;for(let i=1;i<L-1;i+=3){const along=i+0.5,cx=h?(x0+along)*T:(x0+2)*T,cy=h?(y0+2)*T:(y0+along)*T,ox=h?0:T*1.2,oy=h?T*1.2:0;
    if(green){if(R()<0.8)addTree(cx+ox*rr(-1,1),cy+oy*rr(-1,1),pick(['round','round','pine','sakura']),rr(0.8,1.1));}
    else{addTree(cx-ox,cy-oy,'round',0.7);props.push({x:cx-ox,y:cy-oy,k:'planter'});if(R()<0.5)props.push({x:cx+ox,y:cy+oy,k:'bench',a:h?0:PI/2});}}}}
function bridgeLift(x,iy){const t=(x-RIVX0*T)/((RIVX1-RIVX0)*T);if(t<=0||t>=1)return 0;return(iy===BIGB?44:12)*Math.sin(PI*t);}
const RIVER_BX=6,CPARK={x0:11,x1:13,y0:2,y1:5},TSQ={ix:13,iy:12};
const isTS=(bx,by)=>(bx===TSQ.ix-1||bx===TSQ.ix)&&(by===TSQ.iy-1||by===TSQ.iy);
const inCP=(bx,by)=>bx>=CPARK.x0&&bx<=CPARK.x1&&by>=CPARK.y0&&by<=CPARK.y1;
function districtAt(x,y){const tx=Math.floor(x/T),ty=Math.floor(y/T),bx=Math.floor(tx/P),by=Math.floor(ty/P),mx=tx%P,my=ty%P;
  if(tx>=RIVX0&&tx<RIVX1)return bridgeRow(ty)?(by===BIGB?'GRIDLOCK BRIDGE':'RIVER BRIDGE'):'EAST RIVER';
  if(inCP(bx,by)&&mx>=4&&my>=4)return 'CENTRAL PARK';
  if(Math.abs(tx-(TSQ.ix*P+2))<16&&Math.abs(ty-(TSQ.iy*P+2))<16)return 'TIMES SQUARE';
  if(by===NB-1&&my>=4)return 'SOUTH BEACH';
  if(BLOCKK[by*NB+bx]==='construct'&&mx>=4&&my>=4)return 'CONSTRUCTION SITE';
  if(BLOCKK[by*NB+bx]==='docks'||(bx===8&&(DOCKB.has('8,'+by))))return 'THE DOCKS';
  if(tx<0||ty<0||tx>=W||ty>=W)return null;
  const z=zoneOf(x,y);
  if(z===0)return by<3?'NORTH POINT':bx<=2?'HARBOR VIEW':'OLD TOWN';
  if(z===1)return bx>=15&&by<4?'MILLIONAIRE\'S ROW':by>=6?'MIDTOWN':'UPTOWN';
  if(z===2)return by>=15?'LOTUS BAY':'LOTUS QUARTER';
  return bx>=15?'EASTSIDE':by>=15?'SOUTHSIDE':'DOWNTOWN';}
const BLOCKK=[];let STADIUM=null;
const props=[];
const PAL={
  brick:['#8a4a3a','#7a3e30','#9a5a42','#6e4a3c','#a0644a','#84523c','#6a3a32','#94604a'],
  ware:['#6b6f72','#7a6a52','#5a6a6a','#7c7466','#5c5f52','#866a4a'],
  plaster:['#c9a46a','#b5523e','#6e9a7a','#d6c08a','#9a6a8a','#c4785a','#7aa0b0','#d9a0a0','#a8c090','#e0c0a0'],
  concrete:['#b8b4aa','#9ea4a8','#a89e90','#8c9298','#c4bcb0','#7e848a','#b0a89a'],
  glass:['#46789a','#5a8c82','#3c506e','#7890a8','#50645a','#8c785a','#5a6a8c'],
  house:['#c9b79c','#a8b5a2','#d8d2c4','#9fb3c8','#c98f6b','#e0d6a8','#b0a08a','#d6b8b8','#8fa8a0','#f0e8d8'],
  roof:['#5a3a2e','#3e4652','#6b4a3a','#4a5a3a','#7a3a2e','#45403c','#2e3440'],
  awn:['#b3261e','#2e7d4a','#d8a020','#1f5f9a','#8a2a6a','#e07030','#20807a'],
  neon:['#ff4fa8','#3ad6ff','#ffd23a','#7cff6a','#ff6a3a','#c07cff'],
};
function addBuilding(x,y,w,h,hg,col,kind,o){
  const ac=[];const n=Math.floor(rr(0,3.5));
  for(let i=0;i<n;i++)ac.push({x:rr(.15,.75),y:rr(.15,.75),s:rr(.08,.16)});
  const b=Object.assign({x:x*T,y:y*T,w:w*T,h:h*T,hg,col,kind,ac},o||{});
  if(b.tier===true){if(w>=3&&h>=3)b.tier={ins:T*rr(0.6,1.1),hg2:hg+pick([1,1.5,2,2.5,3])};else b.tier=null;}
  buildings.push(b);
}
function styleFor(z,area){
  let s=z;if(R()<0.14)s=pick([0,1,2,-1]);
  if(s===0){
    if(area>=12&&R()<0.35)return[pick([1,1.2,1.5]),pick(PAL.ware),{st:'ware'}];
    return[pick([1.5,2,2.5,3,3.5,4]),pick(PAL.brick),{st:'brick',ws:rr(15,21),wf:rr(.36,.5),wh:rr(.45,.6),shop:R()<0.35,awn:pick(PAL.awn),wt:R()<0.35}];}
  if(s===2)return[pick([1.5,2,2,2.5,3,3.5]),pick(PAL.plaster),{st:'plaster',ws:rr(14,20),wf:rr(.4,.55),wh:rr(.4,.55),shop:R()<0.8,awn:pick(PAL.awn),neon:R()<0.6,nc:pick(PAL.neon)}];
  if(s===1){
    if(R()<0.55)return[pick([3,3.5,4,4.5,5,6]),pick(PAL.glass),{st:'glass',tier:R()<0.4,ant:R()<0.3}];
    return[pick([2.5,3,3.5,4,5]),pick(PAL.concrete),{st:'conc',ws:rr(20,30),wf:rr(.5,.7),wh:rr(.5,.65),shop:R()<0.4,awn:pick(PAL.awn),bill:R()<0.2}];}
  if(R()<0.6)return[pick([4,5,6,6.5,7,8,9]),pick(PAL.glass),{st:'glass',tier:R()<0.6,ant:R()<0.4}];
  return[pick([3.5,4,5,6,7]),pick(PAL.concrete),{st:'conc',ws:rr(16,24),wf:rr(.45,.65),wh:rr(.45,.6),shop:R()<0.5,awn:pick(PAL.awn),tier:R()<0.35,bill:R()<0.25}];
}
function subdivide(x,y,w,h,d,z,ts){
  const sw=w>=4,sh=h>=4;
  if((!sw&&!sh)||(d>0&&R()<0.22)){
    if(d>0&&!ts&&R()<0.1&&w*h<=16){
      for(let j=0;j<h;j++)for(let i=0;i<w;i++)setT(x+i,y+j,LOT);
      if(R()<0.6)parkedSpots.push({x:(x+w/2)*T,y:(y+h/2)*T,a:w>=h?0:PI/2});
      return;
    }
    const s=styleFor(z,w*h);if(ts){s[0]=Math.max(s[0],pick([5,6,7,8]));s[2].ts=true;s[2].bill=false;}addBuilding(x,y,w,h,s[0],s[1],null,s[2]);return;
  }
  if(sw&&(w>=h||!sh)){const s=2+Math.floor(R()*(w-3));subdivide(x,y,s,h,d+1,z,ts);subdivide(x+s,y,w-s,h,d+1,z,ts);}
  else{const s=2+Math.floor(R()*(h-3));subdivide(x,y,w,s,d+1,z,ts);subdivide(x,y+s,w,h-s,d+1,z,ts);}
}
const TREEC={round:['#2f5a26','#3a6a2c','#24461f','#4a7a34','#567d2e','#3e6a3a'],autumn:['#b8642a','#c98a2a','#9a3a22','#d0a030'],pine:['#1f3a26','#24442c','#2a4a30'],sakura:['#f2a6c4','#e58ab0','#ffc6da']};
function treeSp(z){const r=R();if(z===2)return r<0.5?'sakura':r<0.85?'round':'pine';if(z===0)return r<0.25?'autumn':r<0.6?'round':'pine';if(z===1)return r<0.6?'round':'pine';return r<0.8?'round':'pine';}
function addTree(x,y,sp,scale){trees.push({x,y,sp,r:rr(12,18)*(scale||1),h:rr(0.8,1.3)*(scale||1),c:pick(TREEC[sp]),o1:rr(-.5,.5),o2:rr(-.5,.5)});}
function parkBlock(x0,y0,z,lake){
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){setT(x0+x,y0+y,GRASS);PARKT[(y0+y)*W+x0+x]=1;}
  if(lake||R()<0.55){const cx=lake?4:rr(2,5),cy=lake?4:rr(2,5),rx=lake?lake+rr(0,0.6):rr(1.3,2.4),ry=lake?lake:rr(1.1,2);
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){const ex=(x+.5-cx)/rx,ey=(y+.5-cy)/ry;if(ex*ex+ey*ey<1)setT(x0+x,y0+y,WATER);}}
  const ph=rr(0,TAU),amp=rr(1.2,2.4),vert=R()<0.5;
  for(let i=0;i<8;i++){const j=clamp(Math.round(3.5+Math.sin(i*0.85+ph)*amp),0,7);if(vert)setT(x0+j,y0+i,WALK);else setT(x0+i,y0+j,WALK);}
  if(R()<0.4){const k=Math.floor(rr(1,7));for(let i=0;i<8;i++)if(vert)setT(x0+i,y0+k,WALK);else setT(x0+k,y0+i,WALK);}
  const cl=[];for(let i=0;i<2+Math.floor(R()*2);i++)cl.push([rr(0,8),rr(0,8)]);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){const tx=x0+x,ty=y0+y;if(map[ty*W+tx]!==GRASS)continue;
    let p=0.06;for(const c of cl){const d2=(x+.5-c[0])**2+(y+.5-c[1])**2;p+=0.55*Math.exp(-d2/3);}
    if(R()<p){setT(tx,ty,TREE);addTree((tx+.5)*T+rr(-5,5),(ty+.5)*T+rr(-5,5),treeSp(z));}
    else{const q=R();const px=(tx+rr(.2,.8))*T,py=(ty+rr(.2,.8))*T;
      if(q<0.08)props.push({x:px,y:py,k:'bush',c:pick(['#2f5a26','#3e6a2c','#4a6a2a'])});
      else if(q<0.12)props.push({x:px,y:py,k:'rock'});
      else if(q<0.16){let nearPath=false;for(let d=0;d<4;d++)if(tileAt(tx+DX[d],ty+DY[d])===WALK)nearPath=true;if(nearPath)props.push({x:(tx+.5)*T,y:(ty+.5)*T,k:'bench'});}}}
}
function resBlock(x0,y0,z){
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){setT(x0+x,y0+y,GRASS);PARKT[(y0+y)*W+x0+x]=2;}
  for(const[lx,ly]of[[0,0],[1,0],[0,1],[1,1]]){
    const hw=pick([2,2,3]),hh=pick([2,2,3]),hx=lx?x0+7-hw:x0+1,hy=ly?y0+7-hh:y0+1;
    for(let j=0;j<hh;j++)for(let i=0;i<hw;i++)setT(hx+i,hy+j,BLD);
    addBuilding(hx,hy,hw,hh,0.8,pick(PAL.house),null,{st:'house',roof:pick(PAL.roof),rx:hw>hh||(hw===hh&&R()<0.5),chim:R()<0.45,door:ly?2:0});
    // a tree and a hedge in the front yard
    const fx=lx?x0+4+Math.floor(R()*(4-hw)):x0+hw+1+Math.floor(R()*Math.max(1,3-hw)),fy=ly?y0+7:y0;
    if(R()<0.75){const tx=clamp(fx,x0,x0+7),ty=fy;if(map[ty*W+tx]===GRASS){setT(tx,ty,TREE);addTree((tx+.5)*T,(ty+.5)*T,treeSp(z),0.9);}}
    for(let i=0;i<4;i++){const tx=x0+lx*4+i,ty=ly?y0+7:y0;if(map[ty*W+tx]===GRASS&&R()<0.45)props.push({x:(tx+.5)*T,y:(ty+(ly?.85:.15))*T,k:'hedge',a:0});}
    for(let i=0;i<4;i++){const ty=y0+ly*4+i,tx=lx?x0+7:x0;if(map[ty*W+tx]===GRASS&&R()<0.45)props.push({x:(tx+(lx?.85:.15))*T,y:(ty+.5)*T,k:'hedge',a:PI/2});}
  }
}
function plazaBlock(x0,y0){
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){setT(x0+x,y0+y,LOT);PARKT[(y0+y)*W+x0+x]=3;}
  for(let y=3;y<5;y++)for(let x=3;x<5;x++)setT(x0+x,y0+y,WATER);
  props.push({x:(x0+4)*T,y:(y0+4)*T,k:'fountain'});
  for(const[a,b]of[[1,1],[6,1],[1,6],[6,6]]){setT(x0+a,y0+b,TREE);addTree((x0+a+.5)*T,(y0+b+.5)*T,'round',0.85);}
  for(const[a,b]of[[3,1],[4,6],[1,4],[6,3]])props.push({x:(x0+a+.5)*T,y:(y0+b+.5)*T,k:'bench'});
}
function addRamp(x,y,a,style){RAMPS.push({x,y,a,hl:30,hw:15,h:style==='dirt'?18:15,style});}
function riverBlock(bx,by){for(let y=by*P+4;y<by*P+14;y++)for(let x=bx*P+4;x<bx*P+14;x++){setT(x,y,WATER);RIV[y*W+x]=1;}}
function beachBlock(x0,y0){
  for(let y=-1;y<9;y++)for(let x=-1;x<9;x++){const tx=x0+x,ty=y0+y;if(y<=0){if(y===0){setT(tx,ty,WALK);PARKT[ty*W+tx]=7;}continue;}
    if(y<5){if(x>=0&&x<8){setT(tx,ty,GRASS);PARKT[ty*W+tx]=6;}}else{setT(tx,ty,WATER);PARKT[ty*W+tx]=6;}}
  for(let i=0;i<5;i++){const x=(x0+rr(0.5,7.5))*T,y=(y0+rr(1.4,4.2))*T,r=R();
    if(r<0.45)trees.push({x,y,sp:'palm',r:rr(13,17),h:rr(1,1.35),c:pick(['#3f8a2c','#4a9a34','#357a26']),o1:0,o2:0});
    else if(r<0.75)props.push({x,y,k:'umbrella',c:pick(['#e0402a','#2a7ae0','#f0c020','#30b070','#e070a0'])});
    else props.push({x,y,k:'towel',a:rr(0,PI),c:pick(['#e0402a','#2a7ae0','#f0c020','#ffffff','#e070a0'])});}
  if(R()<0.5)props.push({x:(x0+rr(2,6))*T,y:(y0+3.8)*T,k:'lifeguard'});
  if(R()<0.35)addRamp((x0+4)*T,(y0+2.6)*T,R()<0.5?0:PI,'sand');
}
function constructBlock(x0,y0){
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){setT(x0+x,y0+y,LOT);PARKT[(y0+y)*W+x0+x]=4;}
  for(let i=0;i<8;i++){props.push({x:(x0+i+.5)*T,y:(y0+.15)*T,k:'fence',a:0},{x:(x0+i+.5)*T,y:(y0+7.85)*T,k:'fence',a:0});if(i%3!==1)props.push({x:(x0+.15)*T,y:(y0+i+.5)*T,k:'fence',a:PI/2},{x:(x0+7.85)*T,y:(y0+i+.5)*T,k:'fence',a:PI/2});}
  props.push({x:(x0+6.5)*T,y:(y0+1.5)*T,k:'crane',a:rr(0,TAU)});
  for(let i=0;i<3;i++)props.push({x:(x0+rr(1,7))*T,y:(y0+rr(5.5,7))*T,k:'dirt',a:rr(0,PI)});
  for(let i=0;i<4;i++)props.push({x:(x0+rr(1,7))*T,y:(y0+rr(1,7))*T,k:'cone'});
  const ax=R()<0.5;addRamp((x0+(ax?2.6:4))*T,(y0+(ax?4:2.6))*T,ax?0:PI/2,'dirt');addRamp((x0+(ax?5.4:4))*T,(y0+(ax?4:5.4))*T,ax?PI:-PI/2,'dirt');
}
// ---- the docks: the east bank of the river below Old Town turns into a container port (GTA III's Portland Harbor
// was the inspiration): warehouses, stacked shipping containers you can climb, gantry cranes reaching over the
// riverside drive, and a cargo ship tied up alongside. Laid out from a hash, not R(), so it's the same in every city.
const DOCKB=new Set(['8,5','8,6','8,7','8,10','8,11','8,12']),CRANES=[];
const CONTC=['#b8352b','#2f5f9e','#d08a1e','#2e7d4a','#8a8f96','#7a3b8a','#c4b23a','#1f6f7a','#a85a2a','#d8d4c8'];
function docksBlock(x0,y0,bx,by){const h0=hash(bx*31+7,by*17+3);
  for(let y=-1;y<9;y++)for(let x=-1;x<9;x++){const tx=x0+x,ty=y0+y;if(x<0||y<0||x>7||y>7){if(map[ty*W+tx]===WALK)PARKT[ty*W+tx]=0;continue;}setT(tx,ty,LOT);PARKT[ty*W+tx]=9;}
  const flip=(h0&1)===1; // warehouse at the north or south end
  const wy=flip?y0+5:y0;
  for(let y=0;y<3;y++)for(let x=4;x<8;x++)setT(x0+x,wy+y,BLD);
  addBuilding(x0+4,wy,4,3,1.3,['#6b6f72','#7a6a52','#5a6a6a','#866a4a'][(h0>>>3)&3],'ware',{st:'ware',ws:34,wf:.18,wh:.25,dock:true});
  // container stacks: 4x1 rows and a 1x4 column, 1 to 3 high, with a lane round them for forklifts (and you)
  const cy=flip?y0:y0+4,stacks=[[1,cy,4,1],[1,cy+2,4,1],[6,flip?y0:y0+4,1,4]];
  stacks.forEach(([cx,cy2,w,h],i)=>{const hh=hash(h0,i+1),n=1+hh%3;const cols=[];for(let k=0;k<n;k++)cols.push(CONTC[(hh>>>(4+k*4))%CONTC.length]);
    const X=cx<4?x0+cx:x0+cx;for(let y=0;y<h;y++)for(let x=0;x<w;x++)setT(X+x,cy2+y,BLD);
    addBuilding(X,cy2,w,h,0.66*n,cols[0],'cont',{st:'cont',cols,lv:n});});
  // a gantry crane on the riverside edge of the block: two legs, a beam on top and a boom out over the river
  const ly0=y0+1,ly1=y0+6;for(const ly of[ly0,ly1]){setT(x0,ly,BLD);addBuilding(x0,ly,1,1,4.2,'#e0b020','crane',{st:'cont',leg:true,cols:['#e0b020']});}
  const cx=(x0+.5)*T,ya=(ly0+.5)*T,yb=(ly1+.5)*T,top=4.2*40,ym=(ya+yb)/2,bxe=(RIVX1-5)*T;CRANES.push({x:cx,y:ym});
  props.push({x:cx,y:ym,k:'gbeam',ya,yb,top,rad:(yb-ya)/2+12,ht:top+14});
  for(let x=cx;x>bxe;x-=64){const x1=Math.max(bxe,x-64);props.push({x:(x+x1)/2,y:ym,k:'gboom',x0:x1,x1:x,top,rad:36,ht:top});}
  props.push({x:bxe+70+(h0>>>5)%90,y:ym,k:'ghook',top,rad:30,ht:top});}
// a cargo ship moored against the docks (its tiles are solid, so boats and bullets don't pass through it)
const SHIP={x:(RIVX1-2.5)*T,y:(9.5*P*T+5.5*P*T)/2,hl:15*T,hw:44};
function shipDock(){const tx0=RIVX1-4,tx1=RIVX1-1,ty0=Math.floor((SHIP.y-SHIP.hl)/T),ty1=Math.floor((SHIP.y+SHIP.hl)/T);
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<tx1;tx++)if(!bridgeRow(ty))map[ty*W+tx]=BLD;
  props.push({x:SHIP.x,y:SHIP.y,k:'ship',rad:SHIP.hl+40,ht:150});}
function genMap(){
  for(let y=0;y<W;y++)for(let x=0;x<W;x++){
    const mx=x%P,my=y%P;let t;
    if(mx<4||my<4)t=ROAD;else if(mx===4||mx===13||my===4||my===13)t=WALK;else t=BLD;
    map[y*W+x]=t;
  }
  cutStreets();
  for(let by=0;by<NB;by++)for(let bx=0;bx<NB;bx++){
    const x0=bx*P+5,y0=by*P+5,z=zoneOf((bx*P+8)*T,(by*P+8)*T),edgeB=bx===0||by===0||bx===NB-1||by===NB-1;
    if(bx===RIVER_BX||bx===RIVER_BX+1){BLOCKK[by*NB+bx]='river';continue;}
    if(DOCKB.has(bx+','+by)){BLOCKK[by*NB+bx]='docks';docksBlock(x0,y0,bx,by);continue;}
    let kind=SPECIAL[bx+','+by];
    if(!kind&&bx===11&&by===16)kind='stadium';
    if(!kind&&by===NB-1)kind='beach';
    if(!kind&&inCP(bx,by))kind='cpark';
    if(!kind&&isTS(bx,by))kind='ts';
    if(!kind){const r=R();if(r<0.06&&z!==-1)kind='construct';}
    if(!kind){const r=R();
      if(z===-1)kind=r<0.07?'park':r<0.17?'plaza':r<0.23?'lot':'bld';
      else kind=r<0.13?'park':r<0.2?'lot':r<(edgeB?0.55:0.3)?'res':'bld';}
    BLOCKK[by*NB+bx]=kind;
    if(kind==='stadium'){for(let y=0;y<8;y++)for(let x=0;x<8;x++){setT(x0+x,y0+y,GRASS);PARKT[(y0+y)*W+x0+x]=2;}
      const wall=(x,y,w,h)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)setT(x0+x+i,y0+y+j,BLD);addBuilding(x0+x,y0+y,w,h,1.6,'#b8b4aa','stadium',{st:'conc',ws:30,wf:.3,wh:.3});};
      wall(0,0,8,1);wall(0,7,3,1);wall(5,7,3,1);wall(0,1,1,2);wall(0,5,1,2);wall(7,1,1,6);
      for(const[cx,cy]of[[1,1],[7,1],[1,7],[7,7]])props.push({x:(x0+cx)*T,y:(y0+cy)*T,k:'flood',rad:20,ht:150});
      for(const gx of[1.6,6.4])props.push({x:(x0+gx)*T,y:(y0+4)*T,k:'goal',a:PI/2});
      STADIUM={x:(x0+4)*T,y:(y0+4)*T};}
    else if(kind==='beach')beachBlock(x0,y0);
    else if(kind==='construct')constructBlock(x0,y0);
    else if(kind==='cpark'){parkBlock(x0,y0,z,(bx===CPARK.x0+1&&(by===CPARK.y0+1||by===CPARK.y0+2))?2.6:0);if(bx===CPARK.x0&&by===CPARK.y1)addRamp((x0+4)*T,(y0+1.5)*T,0,'dirt');}
    else if(kind==='ts'){subdivide(x0,y0,8,8,0,-1,true);for(let y=-1;y<9;y++)for(let x=-1;x<9;x++){const tx=x0+x,ty=y0+y;if(map[ty*W+tx]===WALK)PARKT[ty*W+tx]=5;}}
    else if(kind==='park')parkBlock(x0,y0,z);
    else if(kind==='res')resBlock(x0,y0,z);
    else if(kind==='plaza')plazaBlock(x0,y0);
    else if(kind==='lot'||kind==='spray'||kind==='crusher'){
      for(let y=0;y<8;y++)for(let x=0;x<8;x++)setT(x0+x,y0+y,LOT);
      if(kind==='spray'||kind==='crusher'){
        for(let y=2;y<6;y++)for(let x=2;x<6;x++)setT(x0+x,y0+y,kind==='spray'?SPRAY:CRUSH);
        (kind==='spray'?sprayPads:crusherPads).push({x:(x0+4)*T,y:(y0+4)*T});
      }else{
        lotBlocks.push({x:(x0+4)*T,y:(y0+4)*T});if(R()<0.35)addRamp((x0+4)*T,(y0+4)*T,R()<0.5?0:PI,'wood');
        for(let i=0;i<4;i++){
          if(R()<0.55)parkedSpots.push({x:(x0+1+i*2)*T,y:(y0+1.3)*T,a:PI/2});
          if(R()<0.55)parkedSpots.push({x:(x0+1+i*2)*T,y:(y0+6.7)*T,a:-PI/2});
        }
      }
    }else if(kind==='hospital'||kind==='police'){
      addBuilding(x0,y0,8,8,kind==='police'?3:2.5,kind==='police'?'#3c4659':'#bdbab0',kind,{st:'conc',ws:24,wf:.55,wh:.5});
      const sp={x:(x0+4)*T,y:(by*P+13+.5)*T};
      if(kind==='hospital')hospitalSpawn=sp;else policeSpawn=sp;
    }else subdivide(x0,y0,8,8,0,z);
  }
  for(let y=0;y<W;y++)for(let x=RIVX0;x<RIVX1;x++)if(!bridgeRow(y)){map[y*W+x]=WATER;RIV[y*W+x]=1;}
  shipDock();
  fillCuts();
  for(const iy of BRIDGES){for(let y=iy*P;y<iy*P+4;y++)for(let x=RIVX0;x<RIVX1;x++)BRT[y*W+x]=1;for(let x=RIVX0*T+16;x<RIVX1*T;x+=32)DECKS.push({x,y:(iy*P+2)*T,big:iy===BIGB,dash:((x>>5)&1)===0});}
  diagAvenues();alleys();
  for(let y=0;y<W;y++)for(let x=0;x<W;x++)if(map[y*W+x]===WALK)walkTiles.push([x,y]);
  {const x0=RIVX0*T,x1=RIVX1*T;
   for(const iy of BRIDGES){const yn=iy*P*T,ys=(iy*P+4)*T,big=iy===BIGB;
     if(!big){for(let x=x0+150;x<x1-100;x+=230)PIERS.push({x,y:(yn+ys)/2});continue;}
     // the big one: two stone towers, main cables swooping between them and down to anchorages on each shore
     const tA=x0+170,tB=x1-170;
     for(const tx of[tA,tB]){const yc=(yn+ys)/2;props.push({x:tx,y:yc,yc,k:'bcrown',rad:96,ht:240});for(const sd of[-1,1])props.push({x:tx,y:yc+sd*82,yc,k:'bleg',rad:18,ht:230});}
     for(const cy of[yn-9,ys+9]){for(const ax of[x0+8,x1-8])props.push({x:ax,y:cy,k:'anchor'});}
     for(const cy of[yn-9,ys+9])for(let x=x0+8;x<x1-8;x+=24)props.push({x:x+12,y:cy,k:'cable',x0:x,x1:x+24,tA,tB,rad:22,ht:200});}
   for(let y=0;y<WPX;y+=40){const ty=Math.floor(y/T);if(bridgeRow(ty))continue;props.push({x:x0-3,y:y+20,k:'brail',a:PI/2},{x:x1+3,y:y+20,k:'brail',a:PI/2});}}
  // street furniture and street trees along the sidewalks
  for(let y=0;y<W;y++)for(let x=0;x<W;x++){
    if(map[y*W+x]!==WALK||PARKT[y*W+x])continue;const mx=x%P,my=y%P;
    const sideX=mx===4?1:mx===13?-1:0,sideY=my===4?1:my===13?-1:0;if((sideX!==0)===(sideY!==0))continue;
    const z=zoneOf(x*T,y*T),cx=(x+.5)*T,cy=(y+.5)*T,r=R();
    const curbX=cx-sideX*11,curbY=cy-sideY*11,inX=cx+sideX*11,inY=cy+sideY*11;
    if(r<0.15){const sp=z===2&&R()<0.6?'sakura':z===-1?'round':treeSp(z)==='pine'?'round':treeSp(z);addTree(curbX,curbY,sp,0.62);if(z===-1)props.push({x:curbX,y:curbY,k:'planter'});}
    else if(r<0.2)props.push({x:curbX,y:curbY,k:'hydrant'});
    else if(r<0.25)props.push({x:inX,y:inY,k:'bin'});
    else if(r<0.28)props.push({x:curbX,y:curbY,k:R()<0.5?'mail':'news'});
    else if(r<0.31)props.push({x:inX,y:inY,k:'bench'});
  }
}

// ---- traffic lights: each crossing cycles east-west green, yellow, then north-south green, yellow ----
function tlState(ix,iy,ew){if(BLACKOUT&&inBlackout(ix*PT,iy*PT))return 3;const t=(game.t+(hash(ix*13,iy*7)%18))%18;if(ew)return t<7?0:t<9?1:2;return t<9?2:t<16?0:1;} // 0 green 1 yellow 2 red
const PT=P*T;
function tlStopDist(c){
  const d=c.ai.dir,hl=c.t.L/2;let ix,iy,dist,ew=d===0||d===2;
  if(d===0){ix=Math.floor(c.x/PT)+1;iy=Math.round((c.y/T-2)/P);dist=(ix*P-1)*T-3-(c.x+hl);}
  else if(d===2){ix=Math.floor(c.x/PT);iy=Math.round((c.y/T-2)/P);dist=(c.x-hl)-((ix*P+5)*T+3);}
  else if(d===1){iy=Math.floor(c.y/PT)+1;ix=Math.round((c.x/T-2)/P);dist=(iy*P-1)*T-3-(c.y+hl);}
  else{iy=Math.floor(c.y/PT);ix=Math.round((c.x/T-2)/P);dist=(c.y-hl)-((iy*P+5)*T+3);}
  if(ix<0||iy<0||ix>NB||iy>NB||dist<-2||dist>220)return null;if(nodeDeg(ix,iy)<3)return null;
  const st=tlState(ix,iy,ew);if(st===0||st===3)return null;if(st===1&&dist<26)return null;return Math.max(0,dist);
}
genMap();
// ---- Lotus Quarter: strings of red paper lanterns across the streets (hash-placed, no effect on the city's random stream) ----
(function lanterns(){for(let by=9;by<NB;by++)for(let bx=0;bx<=5;bx++){const h=hash(bx*53+1,by*29+5);
  // across the street on the block's west side (a north-south street) and its north side (an east-west street)
  const sx=(bx*P+2)*T,sy=(by*P+9)*T,ex=(bx*P+9)*T,ey=(by*P+2)*T;
  if((h&3)!==0&&map[Math.floor(sy/T)*W+bx*P+2]===ROAD&&!DIAGT[Math.floor(sy/T)*W+bx*P+2])props.push({x:sx,y:sy,k:'lanterns',a:0,L:3.4*T,rad:120,ht:96});
  if((h&12)!==0&&by<NB&&map[(by*P+2)*W+bx*P+9]===ROAD&&!DIAGT[(by*P+2)*W+bx*P+9])props.push({x:ex,y:ey,k:'lanterns',a:PI/2,L:3.4*T,rad:120,ht:96});}})();
// ---- lived-in streets: driveways with the family car, mailboxes, utility poles and wires in the suburbs,
// food trucks and hot dog carts where people gather. This pass has its own random stream so the rest of the
// city (and the hidden packages in old saves) comes out exactly as before.
const DRIVEWAYS=[];
(function livedIn(){
  const cr=(a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296})(CITY_SEED^0x5bd1e995);
  const cp=a=>a[Math.floor(cr()*a.length)];
  const MBC=[[200,60,48],[60,90,150],[40,40,44],[230,230,226],[60,110,60]];
  for(let by=0;by<NB;by++)for(let bx=0;bx<NB;bx++){const k=BLOCKK[by*NB+bx],x0=bx*P+5,y0=by*P+5;
    if(k==='res'){
      // a driveway beside each house, running in from the street, often with a car on it
      for(const ly of[0,1]){const fy=ly?y0+7:y0,dy=ly?-1:1;
        for(const lx of[0,1]){const cols=lx?[x0+7,x0+4,x0+3]:[x0,x0+3,x0+4];
          for(const cx of cols){const tiles=[[cx,fy],[cx,fy+dy]];if(!tiles.every(([tx,ty])=>map[ty*W+tx]===GRASS))continue;
            if(DRIVEWAYS.some(d=>Math.abs(d.tx-cx)<2&&d.ly===ly&&d.by===by&&d.bx===bx))break;
            for(const[tx,ty]of tiles)PARKT[ty*W+tx]=8;
            const xx=(cx+.5)*T,yy=(fy+(ly?0:1))*T;
            for(let i=props.length-1;i>=0;i--){const o=props[i];if(o.k==='hedge'&&Math.abs(o.x-xx)<T*1.1&&Math.abs(o.y-yy)<T*1.6)props.splice(i,1);}
            const d={tx:cx,ly,bx,by,x:xx,y:yy,a:ly?-PI/2:PI/2,t:null};
            if(cr()<0.6)d.t=cp(['wagon','wagon','suv','suv','pickup','compact','sedan','roadster']);
            DRIVEWAYS.push(d);
            props.push({x:(cx+(lx?-0.15:1.15))*T,y:(fy+(ly?0.82:0.18))*T,k:'mbox',c:cp(MBC)});
            break;}}}
      // utility poles along the block's street sides, wired together
      for(const side of[0,1,2,3]){let prev=null;
        for(let i=1;i<=7;i+=3){const tx=side===0?x0-1+i:side===1?x0+8:side===2?x0+8-i:x0-1,ty=side===0?y0-1:side===1?y0-1+i:side===2?y0+8:y0+8-i;
          if(tx<0||ty<0||tx>=W||ty>=W||map[ty*W+tx]!==WALK){prev=null;continue;}
          const ox=side===1?-11:side===3?11:0,oy=side===0?11:side===2?-11:0,x=(tx+.5)*T-ox,y=(ty+.5)*T-oy;
          if(trees.some(t=>Math.abs(t.x-x)<16&&Math.abs(t.y-y)<16)||props.some(q=>q.k!=='upole'&&Math.abs(q.x-x)<8&&Math.abs(q.y-y)<8)){prev=null;continue;}
          const o={x,y,k:'upole',a:side===0||side===2?0:PI/2,rad:10,ht:66};if(prev){prev.nx=x;prev.ny=y;}props.push(o);prev=o;}}
    }
    if(k==='plaza'&&cr()<0.7){const fx=(x0+cp([1.6,6.4]))*T,fy=(y0+cp([1.6,6.4]))*T;DRIVEWAYS.push({x:fx,y:fy,a:cp([0,PI/2,PI,-PI/2]),t:'foodtruck'});}
    if((k==='park'||k==='cpark'||k==='ts'||k==='bld')&&cr()<(k==='ts'?0.9:k==='bld'?0.18:0.45)){
      // a hot dog cart on the sidewalk at a corner of the block
      const c=cp([[x0-1,y0-1],[x0+8,y0-1],[x0-1,y0+8],[x0+8,y0+8]]),nx=c[0]+(c[0]<x0?2:-2),ny=c[1];
      if(map[ny*W+nx]===WALK&&!trees.some(t=>Math.abs(t.x-(nx+.5)*T)<20&&Math.abs(t.y-(ny+.5)*T)<20))props.push({x:(nx+.5)*T,y:(ny+.5)*T,k:'hotdog',a:cr()*TAU,c:cp([[220,50,40],[40,110,200],[240,190,30],[40,150,80]]),rad:12,ht:28});}
  }
})();
const streetLights=[];
for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++){const cx=ix*P*T,cy=iy*P*T;
  for(const o of [[-0.5,-0.5],[4.5,4.5],[4.5,-0.5],[-0.5,4.5]]){const x=cx+o[0]*T,y=cy+o[1]*T;if(tileAt(Math.floor(x/T),Math.floor(y/T))===WALK&&R()<0.7)streetLights.push({x,y});}}
// ---- gangs ----
const GANGS=[{name:'Red Sabres',col:'#a3222b',car:'#4f1418'},{name:'Chrome Saints',col:'#c4c7cc',car:'#2a2c31'},{name:'Jade Lotus',col:'#1f9a62',car:'#173d2d'}];
function zoneOf(x,y){const bx=Math.floor(x/T/P),by=Math.floor(y/T/P);const H=NB/2;if(bx<H&&by<H)return 0;if(bx>=H&&by<H)return 1;if(bx<H&&by>=H)return 2;return -1}
const respect=[0,0,0];
const rivalOf=g=>(g+1)%3;
function addRespect(g,n){respect[g]=clamp(respect[g]+n,-5,5)}
function respectLabel(g){const r=respect[g];return r>=3?'They love you':r>=1?'They like you':r>-2?'They don\'t know you yet':r>-4?'They want you dead':'Shoot on sight'}
function makeGang(p,g){p.gang=g;p.col=GANGS[g].col;p.hp=40;}
const combo={n:0,t:0};
function chaos(){combo.n=Math.min(9,combo.n+1);combo.t=4.5;}
// ---------- ground data ----------
function hash(x,y){let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177;return(h^(h>>>16))>>>0}
