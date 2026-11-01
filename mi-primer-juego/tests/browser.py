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
 const jumpTo=(i)=>{campaignJump(i);return {id:i,x:s.pilot.x,y:s.pilot.y,zone:s.zone};};
 const campaignJump=(index,route='left')=>{
  const w=s.level.routePlans[route][index-1];let n=0;const walk=w.x>s.pilot.x?'ArrowRight':'ArrowLeft';key(walk,true);
  while(Math.abs(w.x-s.pilot.x)>.65&&n++<180)tick();key(walk,false);
  if(n>=180)throw Error('Cannot walk to takeoff '+w.to);
  const k=w.dir>0?'ArrowRight':'ArrowLeft';key(k,true);key('Space',true);tick(w.ticks);key('Space',false);tick();
  n=0;while(!s.pilot.grounded&&s.state==='playing'&&n++<300)tick();key(k,false);
  if(s.pilot.platformId!==w.to)throw Error('Campaign miss '+route+'/'+w.to+' at '+s.pilot.x+','+s.pilot.y);
  const cy=s.pilot.y-s.cameras.main.scrollY;if(cy<34||cy>s.scale.gameSize.height)throw Error('Camera lost player on '+w.to+': '+cy);
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
 check('local Phaser fallback, themed sprites and training gate',page.evaluate("__CIMA__.scene.state==='ready'&&Phaser.VERSION==='3.90.0'&&document.querySelector('#seed').disabled&&__CIMA__.game.textures.exists('pixel-astronaut-idle')&&__CIMA__.scene.player.texture.key==='pixel-cadet-idle'"))
 page.screenshot(path=str(OUT/'desktop-start.png'))
 page.click('#primary');page.evaluate(HARNESS)
 check('inhabited rests show dialogue when approaching an NPC',page.evaluate("""()=>{qa.s.livingWorld.update(0);return qa.s.livingWorld.bubble.visible&&qa.s.livingWorld.bubble.text.includes('Cuidadora')&&qa.s.livingWorld.habitats.some(a=>!a.npc);}"""))
 check('walking away dismisses the dialogue without blocking movement',page.evaluate("""()=>{qa.key('ArrowRight',true);qa.tick(180);qa.key('ArrowRight',false);qa.s.livingWorld.update(0);const hidden=!qa.s.livingWorld.bubble.visible;qa.reset();return hidden&&qa.s.state==='playing';}"""))
 check('ambient wildlife animates and freezes when paused',page.evaluate("""()=>{const w=qa.s.livingWorld;w.update(0);const before=w.ambient.commandBuffer.join();const t=w.time;w.update(100);const moving=w.time>t&&w.ambient.commandBuffer.join()!==before;qa.s.pauseRun();const paused=w.time;w.update(100);qa.s.resume();return moving&&w.time===paused;}"""))
 check('forest planes scroll at different depths during a real ascent',page.evaluate("""()=>{qa.reset();qa.jumpTo(1);qa.s.livingWorld.update(0);const layers=qa.s.livingWorld.layers,ok=layers.length===2&&layers[0].tilePositionY!==layers[1].tilePositionY;qa.reset();return ok;}"""))
 check('fullscreen game has no overflow',page.evaluate("document.documentElement.scrollHeight<=innerHeight&&Math.abs(document.querySelector('canvas').getBoundingClientRect().width-innerWidth)<2"))
 check('aliases work together and release independently',page.evaluate('''()=>{qa.key('ArrowRight',true);qa.key('KeyD',true);qa.tick(12);qa.key('ArrowRight',false);qa.tick(12);qa.key('KeyD',false);qa.tick();return qa.s.pilot.x>148&&qa.s.pilot.vx===0;}'''))
 check('charging locks walking and releasing commits the jump',page.evaluate('''()=>{qa.reset();qa.key('ArrowRight',true);qa.key('Space',true);qa.tick(48);const still=qa.s.pilot.x===120;qa.key('Space',false);qa.tick(4);qa.key('ArrowRight',false);qa.key('ArrowLeft',true);qa.tick(10);qa.key('ArrowLeft',false);return still&&qa.s.pilot.jumps===1&&qa.s.pilot.vx===250;}'''))
 check('walking after landing does not swallow the next jump',page.evaluate("""()=>{qa.reset();qa.jumpTo(1);qa.key('ArrowRight',true);qa.tick(6);qa.key('Space',true);qa.tick(70);const charging=qa.s.pilot.charging;qa.key('ArrowRight',false);qa.key('ArrowLeft',true);qa.key('Space',false);qa.tick(2);qa.key('ArrowLeft',false);return charging&&qa.s.pilot.jumps===2&&qa.s.pilot.vy<0&&qa.s.pilot.vx===-250;}"""))
 check('quick press and release between simulation ticks is retained',page.evaluate("""()=>{qa.reset();qa.key('Space',true);qa.key('Space',false);qa.tick();return qa.s.pilot.jumps===1&&qa.s.pilot.vy<0;}"""))
 check('unsupported feet do not hover beyond the visible platform edge',page.evaluate("""()=>{qa.reset();const p=qa.s.level.platforms[1];qa.s.pilot=new __CIMA__.Astronaut(qa.s.level,p.x+p.width/2+9,p.y);qa.tick(12);return !qa.s.pilot.grounded&&qa.s.pilot.y>p.y;}"""))
 check('training and campaign art share a stable native pixel feet anchor',page.evaluate("""()=>{const t=qa.s.textures.get('pixel-cadet-idle');return t.getSourceImage().width===16&&t.getSourceImage().height===24&&qa.s.player.displayHeight===48&&Math.abs(qa.s.player.getBounds().bottom-qa.s.pilot.y)<1e-6;}"""))
 check('physics matches at 30, 60 and 144 rendering FPS',page.evaluate('''()=>{const results=[];for(const fps of [30,60,144]){qa.reset();__CIMA__.input.jump=true;for(let n=0;n<fps;n++)qa.s.update(0,1000/fps);__CIMA__.input.jump=false;for(let n=0;n<fps;n++)qa.s.update(0,1000/fps);results.push([qa.s.pilot.x,qa.s.pilot.y,qa.s.pilot.elapsed]);}return results.every(r=>r.every((v,i)=>Math.abs(v-results[0][i])<1e-6));}'''))
 check('pause freezes simulation and cancels a pending jump',page.evaluate('''()=>{qa.reset();qa.key('Space',true);qa.tick(20);qa.key('Escape',true);qa.key('Escape',false);let t=qa.s.pilot.elapsed,y=qa.s.pilot.y;qa.tick(120);const ok=qa.s.state==='paused'&&qa.s.pilot.elapsed===t&&qa.s.pilot.y===y;qa.key('Space',false);qa.key('Escape',true);qa.key('Escape',false);qa.tick(3);return ok&&!qa.s.pilot.charging&&qa.s.pilot.jumps===0;}'''))
 check('restart confirmation can be canceled',page.evaluate('''()=>{qa.key('KeyR',true);qa.key('KeyR',false);const asked=qa.s.state==='paused';document.querySelector('#secondary').click();return asked&&qa.s.state==='playing';}'''))
 fall=page.evaluate('''()=>{qa.reset();for(let i=1;i<=11;i++)qa.jumpTo(i);const before=qa.s.zone;qa.key('ArrowLeft',true);qa.tick(74);qa.key('ArrowLeft',false);qa.tick(400);return {before,after:qa.s.zone,falls:qa.s.pilot.falls,y:qa.s.pilot.y};}''')
 check('a real missed jump loses earlier zones without checkpoint respawn',fall['falls']>=1 and fall['after']<fall['before'])
 route=page.evaluate('''()=>{qa.reset();const route=[];for(let i=1;i<=25;i++)route.push(qa.jumpTo(i));qa.render();return {route,state:qa.s.state,jumps:qa.s.pilot.jumps,falls:qa.s.pilot.falls,unlocked:localStorage.getItem('cima.training.complete.v2')};}''')
 check('all 25 real training jumps unlock the expedition',route['state']=='training-complete' and route['jumps']==25 and route['falls']==0 and route['unlocked']=='yes')
 page.screenshot(path=str(OUT/'training-complete.png'))
 page.click('#primary')
 check('training completion starts a distinct 120-jump branching campaign',page.evaluate("qa.s.level.kind==='campaign'&&qa.s.level.platforms.length===211&&qa.s.level.walls.every(b=>b.kind==='mass')&&new Set(qa.s.level.platforms.map(p=>p.shape)).size>=6&&qa.s.player.texture.key.startsWith('pixel-astronaut-')&&qa.s.state==='playing'&&qa.s.pilot.jumps===0"))
 page.evaluate("qa.s.startRun('campaign','LUNA');qa.tick(2);for(let i=1;i<=54;i++)qa.campaignJump(i);qa.tick(20);qa.render();")
 page.screenshot(path=str(OUT/'campaign-walls.png'))
 page.evaluate("for(let i=55;i<=58;i++)qa.campaignJump(i);qa.tick(20);qa.render();")
 page.screenshot(path=str(OUT/'campaign-orbit.png'))
 saved=page.evaluate('''()=>{qa.s.saveRun();return {x:qa.s.pilot.x,y:qa.s.pilot.y,jumps:qa.s.pilot.jumps,seed:qa.s.level.seed};}''')
 page.reload();page.wait_for_function('window.__CIMA__')
 check('saved run offers continue',page.locator('#primary').inner_text()=='Continuar viaje')
 page.click('#primary');page.evaluate(HARNESS)
 check('reload restores exact position, seed and jump count',page.evaluate(f"Math.abs(qa.s.pilot.x-{saved['x']})<1e-5&&Math.abs(qa.s.pilot.y-{saved['y']})<1e-5&&qa.s.pilot.jumps===58&&qa.s.level.seed==='LUNA'"))
 campaign=page.evaluate('''()=>{for(let i=59;i<=120;i++)qa.campaignJump(i);qa.render();return {state:qa.s.state,jumps:qa.s.pilot.jumps,falls:qa.s.pilot.falls,record:localStorage.getItem('cima.moon.best.v4.LUNA'),camera:qa.s.cameras.main.scrollY};}''')
 check('continuous 120-jump left route ends at beloved on Moon',campaign['state']=='won' and campaign['jumps']==120 and campaign['falls']==0)
 check('record is scoped to the seed and completed save is removed',page.evaluate("Number(localStorage.getItem('cima.moon.best.v4.LUNA'))>0&&localStorage.getItem('cima.run.v4')===null"))
 page.screenshot(path=str(OUT/'desktop-victory.png'))
 right_route=page.evaluate("""()=>{qa.s.startRun('campaign','LUNA');for(let i=1;i<=120;i++)qa.campaignJump(i,'right');qa.render();return {state:qa.s.state,jumps:qa.s.pilot.jumps,falls:qa.s.pilot.falls};}""")
 check('independent right route also reaches the Moon using real inputs',right_route['state']=='won' and right_route['jumps']==120 and right_route['falls']==0)

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
 page.evaluate("qa.key('ArrowLeft',true)");touch('[data-touch="left"]','touchStart');touch('[data-touch="left"]','touchEnd')
 check('touch release preserves the same direction held on keyboard',page.evaluate('__CIMA__.input.left'))
 page.evaluate("qa.key('ArrowLeft',false)")

 page.evaluate('qa.reset();qa.s.livingWorld.update(0);qa.render()');page.screenshot(path=str(OUT/'mobile.png'))
 page.set_viewport_size({'width':844,'height':390});page.wait_for_function('Math.abs(__CIMA__.scene.scale.gameSize.height-800*innerHeight/innerWidth)<1');page.evaluate('qa.render()')
 check('landscape touch buttons remain inside viewport',page.evaluate("[...document.querySelectorAll('[data-touch]')].every(b=>{const r=b.getBoundingClientRect();return r.bottom<=innerHeight&&r.right<=innerWidth&&r.top>=0})"))
 page.screenshot(path=str(OUT/'mobile-landscape.png'))
 # Blocked or corrupt storage is nonfatal, as in private browsing.
 page.evaluate("localStorage.setItem('cima.run.v4','broken');qa.s.saved=qa.s.readSaved();qa.s.menu();")
 check('corrupt saved run returns to menu safely',page.evaluate('qa.s.saved===null&&qa.s.state===\'ready\''))
 reduced=browser.new_page(viewport={'width':960,'height':720},reduced_motion='reduce')
 reduced.route('https://cdn.jsdelivr.net/**',lambda r:r.abort())
 reduced.goto(BASE+'?qa=1');reduced.wait_for_function('window.__CIMA__');reduced.click('#primary')
 check('reduced motion keeps scenery still while allowing gameplay',reduced.evaluate("""()=>{const s=__CIMA__.scene,w=s.livingWorld;w.update(100);return w.reduced&&w.time===0&&s.state==='playing';}"""))
 reduced.close()
 check('no JavaScript errors',not errors)
 (OUT/'results.json').write_text(json.dumps({'checks':checks,'fall':fall,'training':route,'campaign':campaign,'right_route':right_route,'errors':errors},indent=2))
 browser.close()
print(f'{len(checks)} browser checks passed. Evidence: {OUT}')
