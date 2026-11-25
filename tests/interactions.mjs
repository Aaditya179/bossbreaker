import {strict as assert} from 'node:assert';
import {chromium} from '../phaser/node_modules/playwright/index.mjs';
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:720,height:1280}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message)); await page.goto('http://localhost:4173/');
 await page.waitForFunction(()=>window.game?.isReady && game.scenes.current==='title');
 const box=await page.locator('canvas').first().boundingBox();
 const tap=async(x,y)=>{await page.mouse.click(box.x+box.width*x/720,box.y+box.height*y/1280);await page.waitForTimeout(120)};
 const state=()=>page.evaluate(()=>game.inspect().state);
 await tap(360,1055);await page.waitForFunction(()=>game.scenes.current==='map');await page.waitForTimeout(350);
 await tap(360,934);await page.waitForFunction(()=>game.scenes.current==='play');await page.waitForTimeout(350);
 let s=await state();assert.equal(s.battle.hand.length,6);assert.equal(s.battle.pips,3);
 assert.ok(s.battle.hand.every(c=>['fire','frost','storm','wind','earth'].includes(c)));
 const before=s.battle.handIds;
 await tap(64,1071);await tap(182,1071);s=await state();assert.deepEqual(s.battle.selected,[before[0],before[1]]);
 await tap(360,1238);await page.waitForFunction(()=>{const b=game.inspect().state.battle;return b.turn>1||b.phase==='clear'},null,{timeout:15000});
 s=await state();assert.equal(s.battle.pips,3);console.log('PASS actual elemental selection and one-click automatic turn');
 if(s.battle.phase==='plan') {await tap(103,1110);await tap(221,1110);await tap(340,1110);await tap(540,1165);s=await state();assert.equal(s.battle.pips,2);assert.equal(s.battle.hand.length,6);console.log('PASS actual multi-card redraw costs one action');}
 await page.evaluate(()=>{game.cheats.run('reset-combos');game.cheats.run('boss','1')});await page.waitForTimeout(450);
 for(const [name,index] of [['Fireball',0],['Wind',1],['Storm Bolt',2]]) {
   await page.evaluate(name=>game.cheats.run('give-card',name),name);
   await page.evaluate(index=>game.cheats.run('card-level',String(index+1),index===1?'2':'3'),index);
   await tap([64,182,301][index],1071);
 }
 await page.waitForFunction(()=>game.inspect().objects.some(o=>typeof o.text?.text==='string' && o.text.text.includes('TRIPLE LOCKED')));
 await page.evaluate(()=>game.cheats.run('card-level','2','3'));
 await tap(360,1238);await page.waitForFunction(()=>game.save.read('bossbreaker.combos.v1',[]).includes('cataclysm'),null,{timeout:15000});
 await page.waitForFunction(()=>['plan','clear'].includes(game.inspect().state.battle.phase),null,{timeout:15000});
 assert.ok(await page.evaluate(()=>game.save.read('bossbreaker.combos.v1',[]).includes('cataclysm')));
 console.log('PASS actual level-three Cataclysm discovery and automatic resolution');
 await page.evaluate(()=>game.cheats.run('boss','1'));await page.waitForTimeout(450);
 await page.evaluate(()=>game.cheats.run('win-room'));await page.waitForTimeout(1050);await tap(360,1238);
 await page.waitForFunction(()=>game.scenes.current==='reward');await page.waitForTimeout(350);
 const text=await page.evaluate(()=>JSON.stringify(game.inspect().objects.map(o=>o.text).filter(Boolean)));
 assert.ok(text.includes('Knight’s Bastion') && text.includes('Prismatic Core') && text.includes('Plaguebound Idol'));assert.ok(!text.includes('Reroll'));
 await tap(360,360);await tap(360,360);await page.waitForFunction(()=>game.scenes.current==='map');s=await state();assert.equal(s.run.capacity,6);assert.ok(s.run.relics.includes(4));console.log('PASS boss capacity, three relic choices, no reroll and signature relic');
 await page.evaluate(()=>game.cheats.run('boss','2'));await page.waitForTimeout(400);await page.evaluate(()=>game.cheats.run('win-room'));await page.waitForTimeout(1050);await tap(360,1238);
 await page.waitForFunction(()=>game.scenes.current==='reward');await page.waitForTimeout(350);await tap(360,820);await tap(360,820);await page.waitForFunction(()=>game.scenes.current==='map');
 s=await state();assert.ok(s.run.relics.includes(8));assert.ok(!s.run.relics.includes(5));
 await page.evaluate(()=>game.cheats.run('room','monster'));await page.waitForTimeout(350);s=await state();assert.ok(s.battle.statuses.poison, JSON.stringify(s.battle.statuses));console.log('PASS cursed relic choice applies battle-start poison without granting signature');
 await page.evaluate(()=>game.cheats.run('level','1'));await page.waitForTimeout(350);
 const mapObjects=await page.evaluate(()=>game.inspect().objects.map(o=>o.id).filter(Boolean));assert.ok(mapObjects.some(id=>id.startsWith('map-shop-')),'shop node exists');
 await page.evaluate(()=>{game.cheats.run('gold','100');game.cheats.run('room','shop')});await page.waitForFunction(()=>game.scenes.current==='shop');await page.waitForTimeout(350);
 const deckBefore=(await state()).run.deck.length;await tap(360,505);await tap(220,1038);s=await state();assert.equal(s.run.deck.length,deckBefore+1);assert.equal(s.run.gold,82);
 await tap(360,205);await tap(220,1038);s=await state();assert.equal(s.run.gearOwned.length,1);
 await tap(500,1038);await page.waitForFunction(()=>game.scenes.current==='equipment');await page.waitForTimeout(350);await tap(360,310);await tap(140,1030);s=await state();assert.ok(Object.values(s.run.equipped).includes(s.run.gearOwned[0]));
 console.log('PASS shop card and equipment purchases and equip');
 await page.evaluate(()=>game.cheats.run('room','campfire'));await page.waitForFunction(()=>game.scenes.current==='campfire');await page.waitForTimeout(350);
 let current=await state();const fireId=current.run.deckIds[current.run.deck.indexOf('fire')];await tap(152,510);await tap(217,995);current=await state();assert.equal(current.run.levels[fireId],2);
 await page.evaluate(()=>game.cheats.run('room','campfire'));await page.waitForTimeout(350);await tap(152,510);
 const upgradeText=await page.evaluate(()=>JSON.stringify(game.inspect().objects.map(o=>o.text).filter(Boolean)));assert.ok(upgradeText.includes('unlocks triples') && upgradeText.includes('Size stays 1'));
 await tap(217,995);current=await state();assert.equal(current.run.levels[fireId],3);console.log('PASS actual level-three upgrade retains size and explains triple eligibility');
 assert.deepEqual(errors,[]);
} finally {await browser.close();}
