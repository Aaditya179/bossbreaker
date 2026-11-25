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
 const handX=[64,182,301,419,538,656];
 async function drag(from,to) { await page.mouse.move(box.x+box.width*handX[from]/720,box.y+box.height*1071/1280); await page.mouse.down(); await page.mouse.move(box.x+box.width*handX[to]/720,box.y+box.height*1071/1280,{steps:8}); await page.mouse.up(); await page.waitForTimeout(150); }
 async function mark(indices) { for(const i of indices) await tap(handX[i]+39,1110); }
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
   for(let i=0;i<6 && indices.length<count;i++){
     const cost=['fire','frost','storm','riposte'].includes(b.hand[i])?2:b.hand[i]==='cleave'?3:1;
     if(size+cost<=5){indices.push(i);size+=cost;}
   }
   assert.equal(indices.length,count);
   const expected=indices.map(i=>b.handIds[i]);
   await select(indices);
   assert.deepEqual((await state()).queue,[]);
   assert.deepEqual((await state()).selected,expected);
   if(count===3){
     await drag(0,2);
     const reordered=await state();
     assert.deepEqual(reordered.selected,[expected[1],expected[2],expected[0]]);
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
   const expected=[...order].sort((a,b)=>a-b).map(i=>b.handIds[i]);
   await select(order);
   assert.deepEqual((await state()).selected,expected);
   console.log('PASS actual queue preserves selection order');
 }
 await resetBattle();
 b=await state();
 const old=[...b.handIds];
 await mark([0,1,2,3,4,5]);await tap(540,1165);
 b=await state();assert.equal(b.pips,2);assert.equal(b.hand.length,6);assert.ok(b.handIds.every(id=>!old.includes(id)));
 await assertInventory();
 console.log('PASS actual six-card discard for one action');
 await resetBattle();
 b=await state();const initial=[...b.handIds];
 await select([0,1,1]);await tap(540,1165);
 b=await state();assert.notEqual(b.handIds[0],initial[0]);assert.deepEqual(b.handIds.slice(1),initial.slice(1));
 console.log('PASS actual deselect and replace only selected card');
 await resetBattle();
 b=await state();
 await select([0,1]);await tap(540,1165);
 b=await state();assert.equal(b.pips,2);
 await select([0]);await tap(540,1165);
 b=await state();assert.equal(b.pips,1);
 await select([0]);await turn();
 assert.equal((await state()).pips,1);
 await resetBattle();assert.equal((await state()).pips,3);
 console.log('PASS actual discard budget persists and resets per battle');
 await resetBattle();
 for(let action=0;action<3;action++){
   await mark([0,1,2,3,4,5]);await tap(540,1165);await assertInventory();
 }
 b=await state();assert.equal(b.pips,0);assert.equal(b.hand.length,6);
 console.log('PASS actual redraw after pile exhaustion, unique IDs and zero budget');

 await page.evaluate(()=>window.game.cheats.run('level','1'));
 await page.waitForTimeout(400);
 await tap(507,53);
 await page.waitForFunction(()=>window.game.scenes.current==='deck');
 await page.waitForTimeout(400);
 let owned=await page.evaluate(()=>window.game.inspect().state.run);
 const slashIds=owned.deckIds.filter((_,i)=>owned.deck[i]==='slash');
 await tap(140,320);await tap(159,1108);await tap(356,1108);
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
 await select([0]);
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
 const bossLabels=await page.evaluate(()=>JSON.stringify(game.inspect().objects.map(o=>o.text).filter(Boolean)));
 assert.ok(bossLabels.includes('Legendary') && bossLabels.includes('Mythical') && bossLabels.includes('Cursed'));
 assert.ok(!bossLabels.includes('Reroll'));
 await tap(360,590);await tap(360,590);
 await page.waitForFunction(()=>window.game.scenes.current==='map');
 owned=await page.evaluate(()=>window.game.inspect().state.run);
 assert.equal(owned.capacity,6);
 assert.ok(owned.deck.includes('bulwark'));
 console.log('PASS actual mythic boss card and capacity upgrade');

 await page.evaluate(()=>window.game.cheats.run('boss','2'));
 await page.waitForTimeout(400);
 await page.evaluate(()=>window.game.cheats.run('win-room'));
 await page.waitForTimeout(250);
 await tap(360,1238);
 await page.waitForFunction(()=>window.game.scenes.current==='reward');
 await page.waitForTimeout(300);
 await tap(360,820);await tap(360,820);
 await page.waitForFunction(()=>window.game.scenes.current==='map');
 owned=await page.evaluate(()=>window.game.inspect().state.run);
 assert.equal(owned.capacity,7);
 assert.ok(owned.deck.includes('immolate'));
 assert.equal(owned.maxHp,100);
 console.log('PASS actual cursed boss card and disclosed health cost');


 async function injectedQueue(card,index) {
   const result=await page.evaluate(name=>window.game.cheats.run('give-card',name),card);
   assert.ok(!result.includes('No card family'));
   await page.waitForTimeout(100);
   await select([index]);
 }
 await resetBattle();
 for(let i=0;i<5;i++) await injectedQueue('Slash',i);
 b=await state();assert.equal(b.selected.length,5);
 await turn();
 assert.equal((await state()).turn,2);
 console.log('PASS actual five size-one cards at capacity five');

 await resetBattle();
 await injectedQueue('Cleave',0);
 await injectedQueue('Fireball',1);
 assert.equal((await state()).selected.length,2);
 console.log('PASS actual size-three plus size-two at capacity five');

 await resetBattle();
 await injectedQueue('Fireball',0);
 await injectedQueue('Frost Bolt',1);
 await page.evaluate(()=>window.game.cheats.run('give-card','Fireball'));
 await page.waitForTimeout(100);
 await select([2]);
 b=await state();assert.equal(b.queue.length,0);assert.equal(b.selected.length,2);
 const overflowText=await page.evaluate(()=>JSON.stringify(window.game.inspect().objects.map(o=>o.text).filter(Boolean)));
 assert.ok(overflowText.includes('Not enough Combo Capacity'));
 console.log('PASS actual over-capacity selection remains unqueued');

 await page.evaluate(()=>window.game.cheats.run('boss','2'));
 await page.waitForTimeout(400);
 await injectedQueue('Fireball',0);
 await injectedQueue('Frost Bolt',1);
 await injectedQueue('Fireball',2);
 assert.equal((await state()).selected.length,3);
 console.log('PASS actual three size-two cards at capacity six');

 await page.evaluate(()=>window.game.cheats.run('level','1'));
 await page.evaluate(()=>window.game.cheats.run('room','monster'));
 await page.waitForTimeout(400);
 const beforeCardReward=await page.evaluate(()=>window.game.inspect().state.run.deck.length);
 await page.evaluate(()=>window.game.cheats.run('win-room'));
 await page.waitForTimeout(250);await tap(360,1238);
 await page.waitForFunction(()=>window.game.scenes.current==='reward');
 await page.waitForTimeout(300);await tap(360,360);await tap(360,360);
 await page.waitForFunction(()=>window.game.scenes.current==='map');
 owned=await page.evaluate(()=>window.game.inspect().state.run);
 assert.equal(owned.deck.length,beforeCardReward+1);
 assert.equal(owned.stats.cards,1);
 console.log('PASS actual room card reward updates the run deck');

 await page.evaluate(()=>window.game.cheats.run('level','1'));
 await page.evaluate(()=>window.game.cheats.run('room','campfire'));
 await page.waitForTimeout(400);
 let runState=await page.evaluate(()=>window.game.inspect().state.run);
 const evolvedId=runState.deckIds[runState.deck.indexOf('slash')];
 await tap(152,510);await tap(217,995);
 runState=await page.evaluate(()=>window.game.inspect().state.run);
 assert.equal(runState.levels[evolvedId],2);
 await page.evaluate(()=>window.game.cheats.run('room','campfire'));
 await page.waitForTimeout(400);await tap(152,510);
 const evolutionText=await page.evaluate(()=>JSON.stringify(window.game.inspect().objects.map(o=>o.text).filter(Boolean)));
 assert.ok(evolutionText.includes('Lv 3 size 1'));
 await tap(217,995);
 runState=await page.evaluate(()=>window.game.inspect().state.run);
 assert.equal(runState.levels[evolvedId],3);
 console.log('PASS actual per-copy upgrade and evolution-size preview');

 await resetBattle();
 await tap(507,53);
 await page.waitForFunction(()=>window.game.scenes.current==='deck');
 await page.waitForTimeout(350);
 runState=await page.evaluate(()=>window.game.inspect().state.run);
 const deckBefore=runState.deck.length, goldBefore=runState.gold;
 await tap(140,320);await tap(356,1108);
 runState=await page.evaluate(()=>window.game.inspect().state.run);
 assert.equal(runState.deck.length,deckBefore);
 assert.equal(runState.gold,goldBefore);
 await tap(585,1108);
 console.log('PASS actual selling is blocked in combat');
 assert.deepEqual(errors,[]);
} finally {await browser.close();}
