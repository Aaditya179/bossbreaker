import { strict as assert } from 'node:assert';
import { chromium } from '../phaser/node_modules/playwright/index.mjs';

const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:720,height:1280}});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://localhost:4173/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.game?.isReady && window.game?.scenes?.current==='title');
 const box=await page.locator('canvas').first().boundingBox();
 async function tap(x,y) {
   await page.mouse.click(box.x+box.width*x/720,box.y+box.height*y/1280);
   await page.waitForTimeout(90);
 }
 const handX=[92,226,360,494,628];
 async function state(){return page.evaluate(()=>window.game.inspect().state.battle);}
 async function resetBattle(){
   await page.evaluate(()=>window.game.cheats.run('boss','1'));
   await page.waitForFunction(()=>window.game.scenes.current==='play');
   await page.waitForTimeout(400);
 }
 async function select(indices){for(const i of indices) await tap(handX[i],1071);}
 async function turn(){await tap(360,1238);await page.waitForFunction(()=>{const b=window.game.inspect().state.battle;return b.phase==='plan' && b.turn>1 || b.phase==='clear';},null,{timeout:12000});}
 async function assertInventory(){
   const data=await page.evaluate(()=>window.game.inspect().state);
   const ids=[...data.battle.handIds.filter(x=>x!==null),...data.battle.drawIds,...data.battle.spentIds];
   assert.equal(ids.length,data.run.deckIds.length);
   assert.equal(new Set(ids).size,ids.length);
   assert.deepEqual([...ids].sort((a,b)=>a-b),[...data.run.deckIds].sort((a,b)=>a-b));
 }
 for(const count of [1,2,3]) {
   await resetBattle();
   let b=await state();
   const indices=[];
   let size=0;
   for(let i=0;i<5 && indices.length<count;i++){
     const cost=['fire','frost','storm','riposte'].includes(b.hand[i])?2:b.hand[i]==='cleave'?3:1;
     if(size+cost<=5){indices.push(i);size+=cost;}
   }
   assert.equal(indices.length,count);
   const expected=indices.map(i=>b.handIds[i]);
   await select(indices);
   assert.deepEqual((await state()).queue,[]);
   await tap(180,1165);
   assert.deepEqual((await state()).queue,expected);
   if(count===3){
     await tap(92,906);await tap(360,906);
     const reordered=await state();
     assert.deepEqual(reordered.queue,[expected[1],expected[2],expected[0]]);
   }
   await turn();
   b=await state();
   assert.equal(b.phase,'plan');
   assert.equal(b.turn,2);
   await assertInventory();
   console.log('PASS actual '+count+'-card selection, queue and automatic turn');
 }
 await resetBattle();
 let b=await state();
 const cost=card=>['fire','frost','storm','riposte'].includes(card)?2:card==='cleave'?3:1;
 const order=[2,0,1].filter(i=>b.hand[i]);
 if(order.reduce((sum,i)=>sum+cost(b.hand[i]),0)<=5){
   const expected=order.map(i=>b.handIds[i]);
   await select(order);await tap(180,1165);
   assert.deepEqual((await state()).queue,expected);
   console.log('PASS actual queue preserves selection order');
 }
 await resetBattle();
 b=await state();
 const old=[...b.handIds];
 await select([0,1,2,3,4]);await tap(540,1165);
 b=await state();assert.equal(b.pips,2);assert.equal(b.hand.length,5);assert.ok(b.handIds.every(id=>!old.includes(id)));
 await assertInventory();
 console.log('PASS actual five-card discard for one action');
 await resetBattle();
 b=await state();const initial=[...b.handIds];
 await select([0,1,1]);await tap(540,1165);
 b=await state();assert.notEqual(b.handIds[0],initial[0]);assert.deepEqual(b.handIds.slice(1),initial.slice(1));
 console.log('PASS actual deselect and replace only selected card');
 await resetBattle();
 b=await state();const queued=b.handIds[0];
 await select([0]);await tap(180,1165);await select([1,2]);await tap(540,1165);
 b=await state();assert.deepEqual(b.queue,[queued]);assert.equal(b.handIds[0],queued);assert.equal(b.pips,2);
 await tap(92,906);await tap(92,906);b=await state();assert.deepEqual(b.queue,[]);
 await select([0]);await tap(540,1165);b=await state();assert.notEqual(b.handIds[0],queued);assert.equal(b.pips,1);
 await turn();
 assert.equal((await state()).pips,1);
 await resetBattle();assert.equal((await state()).pips,3);
 console.log('PASS actual queued card protection, return, turn persistence and battle reset');
 await resetBattle();
 for(let action=0;action<3;action++){
   await select([0,1,2,3,4]);await tap(540,1165);await assertInventory();
 }
 b=await state();assert.equal(b.pips,0);assert.equal(b.hand.length,5);
 console.log('PASS actual redraw after pile exhaustion, unique IDs and zero budget');

 await page.evaluate(()=>window.game.cheats.run('level','1'));
 await page.waitForTimeout(400);
 await tap(507,53);
 await page.waitForFunction(()=>window.game.scenes.current==='deck');
 await page.waitForTimeout(400);
 let owned=await page.evaluate(()=>window.game.inspect().state.run);
 const slashIds=owned.deckIds.filter((_,i)=>owned.deck[i]==='slash');
 await tap(360,235);await tap(159,1108);await tap(356,1108);
 owned=await page.evaluate(()=>window.game.inspect().state.run);
 assert.ok(owned.deckIds.includes(slashIds[0]));
 assert.ok(!owned.deckIds.includes(slashIds[1]));
 assert.equal(owned.gold,10);
 await tap(585,1108);
 console.log('PASS actual deck viewer selects and sells one specific copy');

 await page.evaluate(()=>window.game.cheats.run('level','1'));
 await page.evaluate(()=>window.game.cheats.run('room','monster'));
 await page.waitForTimeout(400);
 await page.evaluate(()=>window.game.cheats.run('give-card','Slash'));
 await page.waitForTimeout(200);
 await tap(540,230);
 await select([0]);await tap(180,1165);
 const targetText=await page.evaluate(()=>JSON.stringify(window.game.inspect().objects.map(o=>o.text).filter(Boolean)));
 assert.ok(targetText.includes('Slash · 2'));
 const prior=await page.evaluate(()=>window.game.bars.all.find(bar=>bar.max===48)?.value);
 await turn();
 const after=await page.evaluate(()=>window.game.bars.all.find(bar=>bar.max===48)?.value);
 assert.ok(after<prior);
 console.log('PASS actual target selection locks the chosen enemy');

 await resetBattle();
 await page.evaluate(()=>window.game.cheats.run('win-room'));
 await page.waitForTimeout(250);
 await tap(360,1238);
 await page.waitForFunction(()=>window.game.scenes.current==='reward');
 await page.waitForTimeout(300);
 await tap(360,590);
 await page.waitForFunction(()=>window.game.scenes.current==='map');
 owned=await page.evaluate(()=>window.game.inspect().state.run);
 assert.equal(owned.capacity,6);
 assert.ok(owned.powers.includes('knight'));
 console.log('PASS actual boss power choice and capacity upgrade');

 await page.evaluate(()=>window.game.cheats.run('boss','2'));
 await page.waitForTimeout(400);
 await page.evaluate(()=>window.game.cheats.run('win-room'));
 await page.waitForTimeout(250);
 await tap(360,1238);
 await page.waitForFunction(()=>window.game.scenes.current==='reward');
 await page.waitForTimeout(300);
 await tap(360,820);
 await page.waitForFunction(()=>window.game.scenes.current==='map');
 owned=await page.evaluate(()=>window.game.inspect().state.run);
 assert.equal(owned.capacity,7);
 assert.ok(owned.curses.includes('glassheart'));
 assert.equal(owned.maxHp,80);
 console.log('PASS actual cursed reward and disclosed max-health penalty');

 assert.deepEqual(errors,[]);
} finally {await browser.close();}
