"""Real Chromium integration: keyboard routes, continuous falls, touch, save/resume.
Start a server at repository root. Only ?qa=1 exposes the simulation to tests.
Routes use input events and the live simulation; only isolated fixtures reposition.
"""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('CIMA_URL','http://127.0.0.1:8080/mi-primer-juego/')
OUT=Path(os.environ.get('CIMA_TEST_OUTPUT','work/test-results'));OUT.mkdir(parents=True,exist_ok=True)
HARNESS='''() => {
 const {game,scene:s}=__CIMA__;game.loop.stop();let clock=performance.now();
 const key=(code,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true,cancelable:true}));
 const tick=(n=1)=>{for(let i=0;i<n;i++){s.tick();s.drawPlayer();s.followCamera(1/120);if(s.state==='playing'){const cy=s.pilot.y-s.cameras.main.scrollY;if(cy<0||cy>s.scale.gameSize.height)throw Error('Camera lost astronaut during flight');}}s.renderUI();};
 const reset=()=>{document.activeElement?.blur();s.startRun('training');tick(3);};
 const jumpTo=(i)=>{
  const p=s.level.platforms[i],dir=Math.sign(p.x-s.pilot.x),launch=p.x-dir*208;
  let n=0;const walkKey=launch>s.pilot.x?'ArrowRight':'ArrowLeft';key(walkKey,true);
  while(Math.abs(launch-s.pilot.x)>1.3&&n++<350)tick();key(walkKey,false);
  if(n>=350)throw Error('Cannot reach launch '+i);
  key(dir>0?'ArrowRight':'ArrowLeft',true);key('Space',true);tick(96);key('Space',false);tick();
  n=0;while(!s.pilot.grounded&&s.state==='playing'&&n++<300)tick();key(dir>0?'ArrowRight':'ArrowLeft',false);
  if(s.pilot.platformId!==i)throw Error('Miss '+i+' at '+s.pilot.x+','+s.pilot.y);
  return {id:i,x:s.pilot.x,y:s.pilot.y,zone:s.zone};
 };
 const campaignJump=(i)=>{
  const w=s.level.platforms[i].witness,k=w.dir>0?'ArrowRight':'ArrowLeft';key(k,true);key('Space',true);tick(w.ticks);key('Space',false);tick();
  let n=0;while(!s.pilot.grounded&&s.state==='playing'&&n++<300)tick();key(k,false);
  if(s.pilot.platformId!==i)throw Error('Campaign miss '+i+' at '+s.pilot.x+','+s.pilot.y);
  const cy=s.pilot.y-s.cameras.main.scrollY;if(cy<34||cy>s.scale.gameSize.height)throw Error('Camera lost player on '+i+': '+cy);
 };
 const render=()=>{s.drawPlayer();s.renderUI();clock+=17;game.step(clock,0);};
 window.qa={s,game,key,tick,reset,jumpTo,campaignJump,render};return s.state;
}'''
checks=[]
def check(name,value):
 assert value,name
 checks.append(name);print('PASS',name,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900},has_touch=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('https://cdn.jsdelivr.net/**',lambda r:r.abort())
 page.goto(BASE+'?qa=1');page.wait_for_function('window.__CIMA__')
 check('local Phaser fallback, themed sprites and training gate',page.evaluate("__CIMA__.scene.state==='ready'&&Phaser.VERSION==='3.90.0'&&document.querySelector('#seed').disabled&&__CIMA__.game.textures.get('astronaut-art').has('beloved')"))
 page.screenshot(path=str(OUT/'desktop-start.png'))
 page.click('#primary');page.evaluate(HARNESS)
 check('fullscreen game has no overflow',page.evaluate("document.documentElement.scrollHeight<=innerHeight&&Math.abs(document.querySelector('canvas').getBoundingClientRect().width-innerWidth)<2"))
 check('aliases work together and release independently',page.evaluate('''()=>{qa.key('ArrowRight',true);qa.key('KeyD',true);qa.tick(12);qa.key('ArrowRight',false);qa.tick(12);qa.key('KeyD',false);qa.tick();return qa.s.pilot.x>148&&qa.s.pilot.vx===0;}'''))
 check('charging locks walking and releasing commits the jump',page.evaluate('''()=>{qa.reset();qa.key('ArrowRight',true);qa.key('Space',true);qa.tick(48);const still=qa.s.pilot.x===120;qa.key('Space',false);qa.tick(4);qa.key('ArrowRight',false);qa.key('ArrowLeft',true);qa.tick(10);qa.key('ArrowLeft',false);return still&&qa.s.pilot.jumps===1&&qa.s.pilot.vx===250;}'''))
 check('physics matches at 30, 60 and 144 rendering FPS',page.evaluate('''()=>{const results=[];for(const fps of [30,60,144]){qa.reset();__CIMA__.input.jump=true;for(let n=0;n<fps;n++)qa.s.update(0,1000/fps);__CIMA__.input.jump=false;for(let n=0;n<fps;n++)qa.s.update(0,1000/fps);results.push([qa.s.pilot.x,qa.s.pilot.y,qa.s.pilot.elapsed]);}return results.every(r=>r.every((v,i)=>Math.abs(v-results[0][i])<1e-6));}'''))
 check('pause freezes simulation and cancels a pending jump',page.evaluate('''()=>{qa.reset();qa.key('Space',true);qa.tick(20);qa.key('Escape',true);qa.key('Escape',false);let t=qa.s.pilot.elapsed,y=qa.s.pilot.y;qa.tick(120);const ok=qa.s.state==='paused'&&qa.s.pilot.elapsed===t&&qa.s.pilot.y===y;qa.key('Space',false);qa.key('Escape',true);qa.key('Escape',false);qa.tick(3);return ok&&!qa.s.pilot.charging&&qa.s.pilot.jumps===0;}'''))
 check('restart confirmation can be canceled',page.evaluate('''()=>{qa.key('KeyR',true);qa.key('KeyR',false);const asked=qa.s.state==='paused';document.querySelector('#secondary').click();return asked&&qa.s.state==='playing';}'''))
 fall=page.evaluate('''()=>{qa.reset();for(let i=1;i<=11;i++)qa.jumpTo(i);const before=qa.s.zone;qa.key('ArrowLeft',true);qa.tick(74);qa.key('ArrowLeft',false);qa.tick(400);return {before,after:qa.s.zone,falls:qa.s.pilot.falls,y:qa.s.pilot.y};}''')
 check('a real missed jump loses earlier zones without checkpoint respawn',fall['falls']>=1 and fall['after']<fall['before'])
 route=page.evaluate('''()=>{qa.reset();const route=[];for(let i=1;i<=25;i++)route.push(qa.jumpTo(i));qa.render();return {route,state:qa.s.state,jumps:qa.s.pilot.jumps,falls:qa.s.pilot.falls,unlocked:localStorage.getItem('cima.training.complete.v2')};}''')
 check('all 25 real training jumps unlock the expedition',route['state']=='training-complete' and route['jumps']==25 and route['falls']==0 and route['unlocked']=='yes')
 page.screenshot(path=str(OUT/'training-complete.png'))
 page.click('#primary')
 check('training completion starts a distinct 40-platform campaign',page.evaluate("qa.s.level.kind==='campaign'&&qa.s.level.platforms.length===41&&qa.s.state==='playing'&&qa.s.pilot.jumps===0"))
 page.evaluate("qa.s.startRun('campaign','LUNA');qa.tick(2);for(let i=1;i<=17;i++)qa.campaignJump(i);qa.tick(20);qa.render();")
 page.screenshot(path=str(OUT/'campaign-orbit.png'))
 saved=page.evaluate('''()=>{qa.s.saveRun();return {x:qa.s.pilot.x,y:qa.s.pilot.y,jumps:qa.s.pilot.jumps,seed:qa.s.level.seed};}''')
 page.reload();page.wait_for_function('window.__CIMA__')
 check('saved run offers continue',page.locator('#primary').inner_text()=='Continuar viaje')
 page.click('#primary');page.evaluate(HARNESS)
 check('reload restores exact position, seed and jump count',page.evaluate(f"Math.abs(qa.s.pilot.x-{saved['x']})<1e-5&&Math.abs(qa.s.pilot.y-{saved['y']})<1e-5&&qa.s.pilot.jumps===17&&qa.s.level.seed==='LUNA'"))
 campaign=page.evaluate('''()=>{for(let i=18;i<=40;i++)qa.campaignJump(i);qa.render();return {state:qa.s.state,jumps:qa.s.pilot.jumps,falls:qa.s.pilot.falls,record:localStorage.getItem('cima.moon.best.v2.LUNA'),camera:qa.s.cameras.main.scrollY};}''')
 check('continuous 40-jump campaign ends at beloved on Moon',campaign['state']=='won' and campaign['jumps']==40 and campaign['falls']==0)
 check('record is scoped to the seed and completed save is removed',page.evaluate("Number(localStorage.getItem('cima.moon.best.v2.LUNA'))>0&&localStorage.getItem('cima.run.v2')===null"))
 page.screenshot(path=str(OUT/'desktop-victory.png'))
 old_seed=page.evaluate('qa.s.level.seed');page.click('#primary')
 check('replay creates a new seed and resets counters',page.evaluate(f"qa.s.level.seed!=={json.dumps(old_seed)}&&qa.s.pilot.jumps===0&&qa.s.state==='playing'"))
 check('continue restores a moving fall rather than a safe platform',page.evaluate("""()=>{qa.key('Space',true);qa.key('ArrowRight',true);qa.tick(96);qa.key('Space',false);qa.tick(90);qa.key('ArrowRight',false);const p=qa.s.pilot,y=p.y,vy=p.vy,x=p.x;const falling=!p.grounded&&vy>0;qa.s.pauseRun();qa.s.saved=qa.s.readSaved();qa.s.menu();qa.s.continueSaved();return falling&&qa.s.pilot.y===y&&qa.s.pilot.x===x&&qa.s.pilot.vy===vy&&!qa.s.pilot.grounded;}"""))
 check('blur pauses and releases all controls',page.evaluate("()=>{qa.key('Space',true);window.dispatchEvent(new Event('blur'));qa.tick(10);return qa.s.state==='paused'&&!__CIMA__.input.jump&&!qa.s.pilot.charging;}"))
 page.set_viewport_size({'width':390,'height':844});page.click('#primary');page.evaluate("qa.s.startRun('training');qa.render()")
 check('mobile has no horizontal or vertical page overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight'))
 cdp=page.context.new_cdp_session(page)
 def touch(selector,event):
  r=page.locator(selector).bounding_box();cdp.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':[{'x':r['x']+r['width']/2,'y':r['y']+r['height']/2,'id':1}] if event=='touchStart' else []})
 touch('[data-touch="jump"]','touchStart');page.evaluate('qa.tick(96)');touch('[data-touch="jump"]','touchEnd');page.evaluate('qa.tick(3)')
 check('real touch hold/release launches the astronaut',page.evaluate('qa.s.pilot.jumps===1&&qa.s.pilot.vy<0'))
 touch('[data-touch="left"]','touchStart');touch('[data-touch="left"]','touchCancel')
 check('canceled touch releases its direction',page.evaluate('!__CIMA__.input.left'))
 page.evaluate('qa.render()');page.screenshot(path=str(OUT/'mobile.png'))
 page.set_viewport_size({'width':844,'height':390});page.wait_for_function('Math.abs(__CIMA__.scene.scale.gameSize.height-800*innerHeight/innerWidth)<1');page.evaluate('qa.render()')
 check('landscape touch buttons remain inside viewport',page.evaluate("[...document.querySelectorAll('[data-touch]')].every(b=>{const r=b.getBoundingClientRect();return r.bottom<=innerHeight&&r.right<=innerWidth&&r.top>=0})"))
 page.screenshot(path=str(OUT/'mobile-landscape.png'))
 # Blocked or corrupt storage is nonfatal, as in private browsing.
 page.evaluate("localStorage.setItem('cima.run.v2','broken');qa.s.saved=qa.s.readSaved();qa.s.menu();")
 check('corrupt saved run returns to menu safely',page.evaluate('qa.s.saved===null&&qa.s.state===\'ready\''))
 check('no JavaScript errors',not errors)
 (OUT/'results.json').write_text(json.dumps({'checks':checks,'fall':fall,'training':route,'campaign':campaign,'errors':errors},indent=2))
 browser.close()
print(f'{len(checks)} browser checks passed. Evidence: {OUT}')
