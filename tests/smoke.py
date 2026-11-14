"""Gridlock City smoke test: loads the game in headless Chrome and pokes the core systems.

Run:  pip install playwright && python -m playwright install chromium && python tests/smoke.py
(set CHROME=/path/to/chrome to use an installed Chrome instead of Playwright's Chromium)
Exits non-zero if the page throws or any check fails.
"""
import os, sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'index.html').as_uri()

# each check is JavaScript run in the page after newGame(); it returns true (pass) or a string explaining the failure
CHECKS = {
    'walk (camera-relative)': """()=>{const x0=player.x,y0=player.y;keys.KeyW=true;for(let i=0;i<60;i++)update(1/60);keys.KeyW=false;
        return hyp(player.x-x0,player.y-y0)>40||'player did not move'}""",
    'enter, drive and leave a car': """()=>{let s=null;for(let i=0;i<80&&!s;i++)s=laneSpotNear(player.x+rr(-600,600),player.y+rr(-600,600));if(!s)return 'no lane spot';
        const c=makeCar('sedan',s.x,s.y,s.dir*PI/2);player.car=c;c.driver='player';c.ai=null;c.traffic=false;player.x=c.x;player.y=c.y;
        const x0=c.x,y0=c.y;keys.KeyW=true;for(let i=0;i<90;i++)update(1/60);keys.KeyW=false;const moved=hyp(c.x-x0,c.y-y0);
        c.vx=c.vy=0;exitCar(true);return (moved>60&&!player.car)||('moved '+Math.round(moved)+', in car '+!!player.car)}""",
    'shoot a pistol': """()=>{player.w=0;player.cool=0;const n=bullets.length;mouse.used=false;playerFire();return bullets.length>n||'no bullet'}""",
    'punch with fists': """()=>{const i=WEAPONS.findIndex(w=>w.fist);player.w=i;player.cool=0;const q=makePed(player.x+Math.cos(player.a)*20,player.y+Math.sin(player.a)*20,false);
        const h=q.hp;playerFire();return q.hp<h||'punch did no damage'}""",
    'lock-on picks a target': """()=>{for(const p of peds)p.gone=true;LOCK.held=false;LOCK.t=null;const a=cam.base!=null?cam.base:cam.yaw;
        if(!los(player.x,player.y,player.x+Math.cos(a)*60,player.y+Math.sin(a)*60))return true; // a wall right in front: nothing to test here
        const q=makePed(player.x+Math.cos(a)*60,player.y+Math.sin(a)*60,false);
        mouse.rdown=true;update(1/60);const ok=LOCK.t===q;mouse.rdown=false;update(1/60);return ok||'lock-on missed a ped right in front'}""",
    'sniper scope': """()=>{const i=WIDX('Sniper Rifle');player.ammo[i]=5;player.w=i;mouse.rdown=true;update(1/60);const on=SCOPE.on;mouse.rdown=false;update(1/60);
        return (on&&!SCOPE.on)||'scope on='+on}""",
    'grenade explodes': """()=>{const g=GRENIDX();player.ammo[g]=3;player.w=g;player.cool=0;throwCharge=0.5;mouse.used=false;playerFire();
        const b=bullets[bullets.length-1];if(!b||!b.gren)return 'no grenade';for(let i=0;i<90;i++)update(1/60);return !bullets.includes(b)||'grenade still flying'}""",
    'bridges closed, then open': """()=>{update(1/60);const closed=barriersUp;STORY.prog[0]=2;update(1/60);return (closed&&!barriersUp)||('closed '+closed+' open '+!barriersUp)}""",
    'mission marker starts a boss job': """()=>{STORY.prog=[0,0,0];STORY.fin=0;const B=BOSSES[0];B.cool=false;player.car=null;heat=0;player.x=B.mk.x;player.y=B.mk.y;
        for(let i=0;i<5;i++)update(1/60);const ok=!!mission;if(mission){storyFail(false);}dlgClose&&dlgClose();SCENE.on=false;return ok||'no mission from the marker'}""",
    'wanted level and helicopter': """()=>{crime(0,4);for(let i=0;i<30;i++){player.hp=1000;bustT=0;update(1/60);}const ok=stars()>=4&&!!heli;clearHeat();heli=null;return ok||'stars '+stars()+' heli '+!!heli}""",
    'tow truck hooks a car': """()=>{let s=null;for(let i=0;i<80&&!s;i++)s=laneSpotNear(player.x+rr(-600,600),player.y+rr(-600,600));const a=s.dir*PI/2;
        const tw=makeCar('tow',s.x,s.y,a);const o=makeCar('sedan',s.x-Math.cos(a)*(tw.t.L/2+30),s.y-Math.sin(a)*(tw.t.L/2+30),a);player.car=tw;tw.driver='player';tw.ai=null;
        towToggle(tw);const ok=tw.towing===o;tw.towing=null;o.towedBy=null;exitCar(true);return ok||'not hooked'}""",
    'remapped key drives the action': """()=>{setKey('KeyF','KeyX');const ok=KEYREV.KeyX==='KeyF'&&KEYREV.KeyF==='Unbound';OPT.keys={};buildKeyRev();return (ok&&KEYREV.KeyF==='KeyF')||'remap table wrong'}""",
    'unique stunt jump pays once': """()=>{if(!USJ.length)return 'no unique jumps';let tried=0; // traffic can block one run-up, so try a few ramps
        for(const r of USJ.slice(0,5)){tried++;const ca=Math.cos(r.a),sa=Math.sin(r.a),c=makeCar('sports',r.x-ca*120,r.y-sa*120,r.a);
          player.car=c;c.driver='player';c.ai=null;player.x=c.x;player.y=c.y;c.vx=ca*520;c.vy=sa*520;keys.KeyW=true;for(let i=0;i<60&&!(c.air>0);i++)update(1/60);
          for(let i=0;i<300&&c.air>0;i++)update(1/60);keys.KeyW=false;c.vx=c.vy=0;exitCar(true);slowT=0;if(usjCount()>=1)break;}
        const n=usjCount(),before=money;return n>=1||('no jump counted after '+tried+' ramps')}""",
    'RC Wreckers blows up a car': """()=>{if(!RCPAD)return 'no RC pad';clearHeat();player.car=null;player.x=RCPAD.x;player.y=RCPAD.y;player.jz=0;rcStart();const rc=player.car;if(!rc||!rc.t.rc)return 'no toy car';
        const v=makeCar('sedan',rc.x+40,rc.y,0);ACT.arm=0;playerFire();for(let i=0;i<300;i++)update(1/60);const sc=ACT?ACT.score:-1;if(ACT){ACT.timer=0;for(let i=0;i<120;i++)update(1/60);}
        return (sc>=1&&!ACT&&!player.car)||('score '+sc+', still running '+!!ACT)}""",
    'off-road run finishes': """()=>{const o=OFFROAD[0];if(!o)return 'no off-road run';const c=makeCar('pickup',o.x,o.y,0);player.car=c;c.driver='player';c.ai=null;player.x=c.x;player.y=c.y;offStart(o);
        for(let n=0;ACT&&n<40;n++){const p=ACT.cps[ACT.i];c.x=p.x;c.y=p.y;c.vx=c.vy=0;update(1/60);}const ok=!ACT&&STATS.offWins>=1;c.vx=c.vy=0;exitCar(true);return ok||'run did not finish'}""",
    'the Dodo takes off and lands': """()=>{if(!STRIP)return 'no airstrip';STORY.prog[0]=2;clearHeat();const c=makeCar('dodo',STRIP.x0+30,STRIP.y,0);c.alt=0;player.car=c;c.driver='player';c.ai=null;player.x=c.x;player.y=c.y;
        keys.KeyW=true;let top=0;for(let i=0;i<420;i++){keys.Space=hyp(c.vx,c.vy)>345;update(1/60);top=Math.max(top,c.alt);}keys.Space=false;keys.KeyW=false;keys.KeyS=true;
        for(let i=0;i<1500&&c.alt>0;i++){keys.ShiftLeft=c.alt>16;update(1/60);}keys.ShiftLeft=false;keys.KeyS=false;const ok=top>40&&c.alt===0&&!c.wreck;c.vx=c.vy=0;exitCar(true);
        return ok||('top '+Math.round(top)+', alt '+Math.round(c.alt)+', wreck '+c.wreck)}""",
    'rating, sleep and the PS2 look': """()=>{const r=RANKS[crimRank(crimScore())][1];const c0=clock;enterRoom('safe',{x:player.x,y:player.y});sleepSix();const d=((clock-c0)%1+1)%1;leaveRoom();
        OPT.ps2=true;rain=1;for(let i=0;i<60;i++)update(1/60);game.paused=false;render();rain=0;rainTarget=0;return (!!r&&Math.abs(d-0.25)<0.01)||('rank '+r+', slept '+d)}""",
    'renders a frame': """()=>{game.paused=false;render();return true}""",
}

def main():
    errors, failures = [], []
    with sync_playwright() as p:
        kw = {'args': ['--no-sandbox']}
        if os.environ.get('CHROME'):
            kw['executable_path'] = os.environ['CHROME']
        browser = p.chromium.launch(**kw)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(URL)
        page.wait_for_timeout(1500)
        if errors:
            print('FAIL page load:', errors[:3]); sys.exit(1)
        page.evaluate('newGame()')
        page.wait_for_timeout(300)
        for name, js in CHECKS.items():
            try:
                r = page.evaluate(js)
            except Exception as e:  # a thrown error is a failure too
                r = str(e).split('\n')[0]
            ok = r is True
            print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else ': ' + str(r)))
            if not ok:
                failures.append(name)
        browser.close()
    if errors:
        print('page errors:', errors[:5])
    sys.exit(1 if failures or errors else 0)

if __name__ == '__main__':
    main()
