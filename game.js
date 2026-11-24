(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const state = {
    turn:"red", phase:"red", counts:{red:10,blue:10}, deployed:{red:false,blue:false},
    classes:{red:"soldier",blue:"soldier"}, selectedCount:10, selectedClass:"soldier",
    sound:true, round:1, running:false, difficulty:"warlord", health:{red:100,blue:100}
  };
  const classNames={soldier:"Shield Guard",archer:"Archer",knight:"Knight",mage:"Mage"};
  let audioCtx=null;
  function tone(freq=220,duration=.1){
    if(!state.sound)return;
    try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="triangle";o.frequency.value=freq;g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);}catch(_){}
  }
  function update(){
    $("turnLabel").textContent=state.phase==="battle"?"INVASION IN PROGRESS":state.phase==="finished"?"BATTLE COMPLETE":state.turn.toUpperCase()+" KING'S DEPLOYMENT";
    $("turnDot").className="turn-dot "+state.turn;
    $("toolLabel").textContent=state.phase==="battle"?"Armies fight automatically":classNames[state.selectedClass]+" · "+state.counts[state.turn]+" troops";
    $("redStatus").textContent=(state.deployed.red?state.counts.red+" troops deployed":"Awaiting deployment")+" · "+(state.classes.red||"soldier").toUpperCase();
    $("blueStatus").textContent=(state.deployed.blue?state.counts.blue+" troops deployed":"Awaiting deployment")+" · "+(state.classes.blue||"soldier").toUpperCase();
    $("redHealth").style.width=state.health.red+"%";$("blueHealth").style.width=state.health.blue+"%";
    $("roundNumber").textContent=String(state.round).padStart(2,"0");$("dayNumber").textContent=String(state.round).padStart(2,"0");
    $("phaseLabel").textContent=state.phase==="battle"?"THE KINGDOMS ARE AT WAR":state.turn.toUpperCase()+" DEPLOYMENT";
    $("aiStatus").textContent=state.difficulty.toUpperCase();
    $("arenaCaption").textContent=state.phase==="battle"?"AUTOMATIC BATTLE · SELECT A SOLDIER ONLY TO GIVE OPTIONAL ORDERS":"DEPLOY YOUR TROOPS INSIDE YOUR KINGDOM";
    $("deployBtn").disabled=state.phase==="battle"||state.deployed[state.turn];
    $("advanceBtn").disabled=state.phase==="battle"||!state.deployed[state.turn];
    $("advanceBtn").querySelector("span").textContent=state.turn==="red"?"END RED DEPLOYMENT":"BEGIN THE INVASION";
    $("advanceBtn").querySelector("b").textContent=state.turn==="red"?"↗":"⚔";
    $("undoBtn").disabled=state.phase==="battle"||!state.deployed[state.turn];
    document.querySelectorAll(".tool").forEach(b=>{const active=b.dataset.tool===state.selectedClass;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));b.disabled=state.phase==="battle"||state.deployed[state.turn];});
    $("troopCount").disabled=state.phase==="battle"||state.deployed[state.turn];
  }
  function announce(message){$("battleNotice").textContent=message;}
  document.querySelectorAll(".tool").forEach(b=>b.addEventListener("click",()=>{if(state.phase==="battle"||state.deployed[state.turn])return;state.selectedClass=b.dataset.tool;update();}));
  $("troopCount").addEventListener("change",e=>{state.selectedCount=Number(e.target.value);});
  $("aiDifficulty").addEventListener("change",e=>{state.difficulty=e.target.value;window.Crown2D?.setDifficulty(state.difficulty);update();});
  $("deployBtn").addEventListener("click",()=>{
    if(state.phase==="battle"||state.deployed[state.turn])return;
    state.counts[state.turn]=state.selectedCount;state.classes[state.turn]=state.selectedClass;state.deployed[state.turn]=true;
    window.Crown3D?.deployArmy(state.turn,state.selectedCount,state.selectedClass);
    tone(320,.14);announce(state.turn.toUpperCase()+" KINGDOM: "+state.selectedCount+" "+state.selectedClass.toUpperCase()+" TROOPS DEPLOYED.");
    update();
  });
  $("advanceBtn").addEventListener("click",()=>{
    if(state.phase==="red"&&state.deployed.red){state.phase="blue";state.turn="blue";state.selectedClass="soldier";$("troopCount").value="10";state.selectedCount=10;window.Crown3D?.setActiveSide("blue");announce("BLUE KING: DEPLOY YOUR ARMY IN THE AZURE TERRITORY.");update();}
    else if(state.phase==="blue"&&state.deployed.blue){startBattle();}
  });
  function startBattle(){
    state.phase="battle";state.running=true;window.Crown2D?.setDifficulty(state.difficulty);window.Crown3D?.beginBattle();
    announce("THE INVASION BEGINS. BOTH ARMIES ADVANCE, ENGAGE ENEMY SOLDIERS, AND BESIEGE THE OPPOSING STRONGHOLD.");
    tone(120,.35);update();
  }
  function finishBattle(winner){
    state.running=false;state.phase="finished";
    $("resultTitle").textContent=winner.toUpperCase()+" VICTORY";
    $("resultText").textContent=winner==="red"?"The Crimson army breached the Azure stronghold. The crown is yours.":"The Azure army breached the Crimson stronghold. The crown is yours.";
    $("resultOverlay").classList.remove("hidden");
    update();
  }
  window.CrownGame={
    onCastleDamage(side,damage,health){
      if(state.phase==="finished")return;
      state.health[side]=Math.max(0,health);$(side+"Health").style.width=state.health[side]+"%";
      announce(side.toUpperCase()+" STRONGHOLD UNDER SIEGE · "+Math.round(state.health[side])+"% INTEGRITY");
      if(state.health[side]<=0)finishBattle(side==="red"?"blue":"red");
    },
    onUnitSelected(unit){announce(unit.side.toUpperCase()+" "+unit.kind.toUpperCase()+" SELECTED · OPTIONAL MANUAL ORDER.");},
    onBattleStats(stats){
      $("redStatus").textContent=stats.red+" survivors · "+stats.redPlan;
      $("blueStatus").textContent=stats.blue+" survivors · "+stats.bluePlan;
      $("armyTelemetry").textContent="CRIMSON "+stats.red+"  /  AZURE "+stats.blue;
      $("planTelemetry").textContent="RED: "+stats.redPlan+" · BLUE: "+stats.bluePlan+" · "+stats.fps+" FPS";
    }
  };
  $("undoBtn").addEventListener("click",()=>{if(state.phase!=="battle"){window.Crown3D?.removeArmy(state.turn);state.deployed[state.turn]=false;announce(state.turn.toUpperCase()+" DEPLOYMENT WITHDRAWN.");update();}});
  $("beginBtn").addEventListener("click",()=>{$("intro").classList.add("hidden");$("gameShell").classList.remove("hidden");window.Crown3D?.setActiveSide("red");update();});
  $("quickBattleBtn").addEventListener("click",()=>{
    $("intro").classList.add("hidden");$("gameShell").classList.remove("hidden");
    Object.assign(state,{turn:"red",phase:"battle",counts:{red:10,blue:10},deployed:{red:true,blue:true},classes:{red:"soldier",blue:"soldier"},selectedCount:10,selectedClass:"soldier",health:{red:100,blue:100}});
    $("troopCount").value="10";$("aiDifficulty").value=state.difficulty;window.Crown2D?.setDifficulty(state.difficulty);
    window.Crown3D?.resetArmies();
    window.Crown3D?.deployArmy("red",10,"soldier");
    window.Crown3D?.deployArmy("blue",10,"soldier");
    window.Crown3D?.beginBattle();
    announce("QUICK BATTLE: BOTH ARMIES ARE MARCHING AUTOMATICALLY.");
    tone(120,.35);update();
  });
  $("resetBtn").addEventListener("click",reset);
  $("playAgain").addEventListener("click",()=>{$("resultOverlay").classList.add("hidden");reset();});
  $("howBtn").addEventListener("click",()=>$("modal").classList.remove("hidden"));
  $("closeModal").addEventListener("click",()=>$("modal").classList.add("hidden"));
  $("gotIt").addEventListener("click",()=>$("modal").classList.add("hidden"));
  $("soundToggle").addEventListener("click",()=>{state.sound=!state.sound;$("soundToggle").innerHTML=state.sound?"♫ <span>SOUND ON</span>":"♫ <span>SOUND OFF</span>";});
  function reset(){
    Object.assign(state,{turn:"red",phase:"red",counts:{red:10,blue:10},deployed:{red:false,blue:false},classes:{red:"soldier",blue:"soldier"},selectedCount:10,selectedClass:"soldier",round:1,running:false,health:{red:100,blue:100}});
    $("troopCount").value="10";$("aiDifficulty").value=state.difficulty;window.Crown2D?.setDifficulty(state.difficulty);window.Crown3D?.resetArmies();window.Crown3D?.setActiveSide("red");announce("Choose 10, 50, or 100 troops and deploy your first formation.");update();
  }
  window.addEventListener("keydown",e=>{if(e.key==="Escape")$("modal").classList.add("hidden");});
  announce("Choose 10, 50, or 100 troops and deploy your first formation.");update();
})();