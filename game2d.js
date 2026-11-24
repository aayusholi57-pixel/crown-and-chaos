(() => {
  "use strict";
  const arena = document.getElementById("arena");
  if (!arena) return;
  const canvas = document.createElement("canvas");
  canvas.id = "battle2d";
  canvas.setAttribute("aria-label", "2D battlefield. Select a soldier and click a destination.");
  arena.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const W = 1200, H = 520, ground = 410;
  const state = { active:"red", battle:false, units:[], projectiles:[], particles:[], selected:null, last:0, raf:0, castle:{red:100,blue:100}, dimensions:{w:0,h:0} };
  const colors = { red:{main:"#bd514d",light:"#f1a49a",dark:"#632b31",metal:"#d7b18a"}, blue:{main:"#638ec2",light:"#b5d5f4",dark:"#263e62",metal:"#d9d8ce"} };
  const stats = {
    soldier:{hp:100,speed:105,range:34,damage:15,cooldown:720,color:"#d8d0bb"},
    archer:{hp:72,speed:88,range:205,damage:13,cooldown:1250,color:"#b5a16e"},
    knight:{hp:180,speed:125,range:39,damage:27,cooldown:900,color:"#d5c6a2"},
    mage:{hp:84,speed:82,range:175,damage:20,cooldown:1550,color:"#aa8cda"}
  };
  let uid=1;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=(a,b)=>a+Math.random()*(b-a);
  function resize(){
    const r=arena.getBoundingClientRect(), d=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(r.width*d)); canvas.height=Math.max(1,Math.round(r.height*d));
    canvas.style.width="100%";canvas.style.height="100%";
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    state.dimensions={w:r.width,h:r.height};
  }
  new ResizeObserver(resize).observe(arena); resize();
  function makeUnit(side,kind,x,y){
    const s=stats[kind]; return {id:uid++,side,kind,x,y,homeX:x,homeY:y,hp:s.hp,maxHp:s.hp,speed:s.speed,range:s.range,damage:s.damage,cooldown:s.cooldown,lastAttack:rand(0,500),phase:rand(0,6.28),walk:0,attack:0,hit:0,dead:false,target:null,order:null,projectileClock:0};
  }
  function deployArmy(side,count,kind){
    state.units=state.units.filter(u=>u.side!==side);
    const start=side==="red"?135:1065, dir=side==="red"?1:-1;
    const cols=Math.min(10,Math.ceil(Math.sqrt(count)*1.55));
    for(let i=0;i<count;i++){
      const row=Math.floor(i/cols), col=i%cols;
      const x=start+dir*(col*23+rand(-4,4));
      const y=ground-22-row*28+rand(-4,4);
      state.units.push(makeUnit(side,kind,x,y));
    }
    state.active=side;state.selected=null;draw();
  }
  function setActiveSide(side){state.active=side;state.selected=null;}
  function removeArmy(side){state.units=state.units.filter(u=>u.side!==side);state.selected=null;draw();}
  function resetArmies(){state.battle=false;state.units=[];state.projectiles=[];state.particles=[];state.selected=null;state.castle={red:100,blue:100};draw();}
  function beginBattle(){
    state.battle=true;
    state.last=performance.now();
    // Clear deployment orders: once the invasion starts, both armies commit
    // to the frontline and then to the enemy stronghold.
    for(const u of state.units){u.order=null;u.target=null;u.lastAttack=0;}
    if(!state.raf)state.raf=requestAnimationFrame(loop);
  }
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function nearestEnemy(u){
    // Keep a soldier's target stable and distribute the frontline instead of
    // sending the whole army into one crowded pile.
    if(u.target && !u.target.dead && u.target.side!==u.side){
      return {unit:u.target,d:distance(u,u.target)};
    }
    let best=null,bestScore=Infinity,bestDistance=Infinity;
    for(const e of state.units){
      if(e.dead||e.side===u.side)continue;
      let load=0;
      for(const ally of state.units)if(!ally.dead&&ally.side===u.side&&ally.target===e)load++;
      const d=distance(u,e);
      const score=d+Math.max(0,load-1)*82+Math.abs(u.y-e.y)*.12;
      if(score<bestScore){best=e;bestScore=score;bestDistance=d;}
    }
    return {unit:best,d:bestDistance};
  }
  function moveToward(u,x,y,dt,speed=u.speed){
    const dx=x-u.x,dy=y-u.y,d=Math.hypot(dx,dy);
    if(d>2){
      const step=Math.min(d,speed*dt);
      u.x+=dx/d*step;u.y+=dy/d*step;u.walk+=dt*speed*.12;
      return true;
    }
    return false;
  }
  function attack(u,target,now){
    if(now-u.lastAttack<u.cooldown)return;
    u.lastAttack=now;u.attack=1;
    if(u.kind==="archer"||u.kind==="mage"){
      state.projectiles.push({x:u.x+(u.side==="red"?14:-14),y:u.y-27,target,side:u.side,kind:u.kind,damage:u.damage,life:3});
    }else{
      target.hp-=u.damage;target.hit=.18;
      burst(target.x,target.y-18,u.side==="red"?"#ef8b78":"#91c7f4",5);
      if(target.hp<=0)target.dead=true;
    }
  }
  function burst(x,y,color,n=8){for(let i=0;i<n;i++)state.particles.push({x,y,vx:rand(-65,65),vy:rand(-90,15),life:rand(.2,.55),max:.55,color});}
  function update(dt,now){
    const alive=state.units.filter(u=>!u.dead);
    for(const u of alive){
      u.attack=Math.max(0,u.attack-dt*3.5);u.hit=Math.max(0,u.hit-dt);
      const {unit:enemy,d}=nearestEnemy(u);
      if(enemy){
        u.target=enemy;
        u.facing=enemy.x>=u.x?1:-1;
        const ranged=u.kind==="archer"||u.kind==="mage";
        const standOff=ranged?u.range*.72:u.range*.72;
        const contactDistance=ranged?standOff:u.range*.72;
        if(d>contactDistance){
          // March directly toward the opposing line; ranged troops hold behind it.
          const tx=enemy.x-u.facing*contactDistance;
          const ty=clamp(enemy.y+(u.y-enemy.y)*.12,ground-145,ground-8);
          moveToward(u,tx,ty,dt,u.speed);
        }else{
          attack(u,enemy,now);
        }
      }else if(state.battle){
        u.target=null;
        const enemyCastle=u.side==="red"?1090:110;
        const stop=u.side==="red"?enemyCastle-58:enemyCastle+58;
        if(Math.abs(stop-u.x)>40)moveToward(u,stop,u.homeY,dt,u.speed);
        else if(now-u.lastAttack>u.cooldown){
          u.lastAttack=now;u.attack=1;
          state.castle[u.side==="red"?"blue":"red"]=Math.max(0,state.castle[u.side==="red"?"blue":"red"]-(u.kind==="knight"?3:1.6));
          const hp=state.castle[u.side==="red"?"blue":"red"];
          window.CrownGame?.onCastleDamage(u.side==="red"?"blue":"red",u.damage,hp);
          burst(enemyCastle,ground-52,u.side==="red"?"#ef9b73":"#8ebcf0",4);
        }
      }else if(u.order){moveToward(u,u.order.x,u.order.y,dt);if(Math.hypot(u.x-u.order.x,u.y-u.order.y)<4)u.order=null;}
      else if(Math.abs(u.x-u.homeX)>3)moveToward(u,u.homeX,u.homeY,dt);
    }
    for(const p of state.projectiles){
      if(!p.target||p.target.dead){p.life=0;continue;}
      const dx=p.target.x-p.x,dy=(p.target.y-24)-p.y,d=Math.hypot(dx,dy),step=(p.kind==="mage"?330:430)*dt;
      if(d<step+7){p.target.hp-=p.damage;p.target.hit=.2;if(p.target.hp<=0)p.target.dead=true;burst(p.target.x,p.target.y-20,p.kind==="mage"?"#bd91ff":"#f4d69a",7);p.life=0;}
      else{p.x+=dx/d*step;p.y+=dy/d*step;p.life-=dt;}
    }
    state.projectiles=state.projectiles.filter(p=>p.life>0);
    for(const p of state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=150*dt;p.life-=dt;}
    state.particles=state.particles.filter(p=>p.life>0);
    state.units=state.units.filter(u=>!u.dead);
  }
  function drawCastle(x,side){
    const c=colors[side], flip=side==="blue";
    ctx.save();ctx.translate(x,0);ctx.fillStyle="#161820";ctx.globalAlpha=.35;ctx.beginPath();ctx.ellipse(0,ground+5,75,12,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle=c.dark;ctx.fillRect(-48,ground-112,96,112);
    ctx.fillStyle=c.main;ctx.fillRect(-34,ground-145,26,36);ctx.fillRect(8,ground-145,26,36);
    ctx.fillStyle="#d4c2a2";ctx.fillRect(-54,ground-120,108,10);
    ctx.fillStyle="#241d22";ctx.fillRect(-14,ground-58,28,58);
    ctx.fillStyle=c.light;ctx.fillRect(-44,ground-105,9,19);ctx.fillRect(35,ground-105,9,19);
    ctx.fillStyle=c.main;ctx.beginPath();ctx.moveTo(0,ground-188);ctx.lineTo(-7,ground-160);ctx.lineTo(7,ground-160);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#d9bd86";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,ground-160);ctx.lineTo(0,ground-205);ctx.stroke();
    ctx.fillStyle=c.main;ctx.beginPath();ctx.moveTo(1,ground-204);ctx.lineTo(flip?-38:38,ground-196);ctx.lineTo(1,ground-181);ctx.closePath();ctx.fill();
    ctx.restore();
    const hp=state.castle[side];ctx.fillStyle="#17151a";ctx.fillRect(x-46,ground-222,92,7);ctx.fillStyle=side==="red"?"#d46a5e":"#76a9e2";ctx.fillRect(x-46,ground-222,92*hp/100,7);
  }
  function drawUnit(u,now){
    const c=colors[u.side],f=u.facing??(u.side==="red"?1:-1),walk=Math.sin(u.walk)*.65,atk=u.attack;
    ctx.save();ctx.translate(u.x,u.y);ctx.scale(f,1);
    if(u.hit>0){ctx.globalAlpha=.55+Math.sin(now*.08)*.35;}
    ctx.fillStyle="#09090d55";ctx.beginPath();ctx.ellipse(0,4,17,5,0,0,Math.PI*2);ctx.fill();
    if(state.selected===u){ctx.strokeStyle="#f3d79b";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,3,22,8,0,0,Math.PI*2);ctx.stroke();}
    const leg=walk*5;
    ctx.strokeStyle="#29232a";ctx.lineWidth=6;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(-5,-17);ctx.lineTo(-7+leg,-3);ctx.stroke();ctx.beginPath();ctx.moveTo(5,-17);ctx.lineTo(7-leg,-3);ctx.stroke();
    ctx.fillStyle=c.dark;ctx.fillRect(-12,-7+leg,10,5);ctx.fillRect(3,-7-leg,10,5);
    ctx.fillStyle=c.main;ctx.fillRect(-10,-38,20,25);
    ctx.fillStyle=c.light;ctx.fillRect(-7,-36,5,18);
    ctx.fillStyle="#d7bd93";ctx.beginPath();ctx.arc(0,-48,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=c.dark;ctx.fillRect(-9,-56,18,6);ctx.fillRect(-7,-61,14,5);
    if(u.kind==="knight"){ctx.fillStyle="#e2d7c0";ctx.fillRect(-12,-40,24,22);ctx.fillStyle=c.main;ctx.fillRect(-13,-55,26,5);}
    if(u.kind==="mage"){ctx.fillStyle="#51416e";ctx.beginPath();ctx.moveTo(-10,-37);ctx.lineTo(0,-20);ctx.lineTo(13,-38);ctx.closePath();ctx.fill();ctx.fillStyle="#a987e7";ctx.beginPath();ctx.arc(0,-62,4,0,Math.PI*2);ctx.fill();}
    if(u.kind==="archer"){ctx.strokeStyle="#b9945c";ctx.lineWidth=2;ctx.beginPath();ctx.arc(14,-39,11,-1.1,1.1);ctx.stroke();}
    // Visible articulated arms, hands, and weapon swing.
    const armAngle=-.25-atk*1.15+walk*.25;
    ctx.strokeStyle=c.main;ctx.lineWidth=6;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(8,-34);ctx.lineTo(13,-27);ctx.lineTo(18+Math.cos(armAngle)*8,-27+Math.sin(armAngle)*8);ctx.stroke();
    ctx.fillStyle="#d7bd93";ctx.beginPath();ctx.arc(18+Math.cos(armAngle)*8,-27+Math.sin(armAngle)*8,3.3,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=c.main;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-8,-34);ctx.lineTo(-15,-26);ctx.lineTo(-17,-21);ctx.stroke();
    ctx.fillStyle=c.dark;ctx.beginPath();ctx.arc(-18,-20,4,0,Math.PI*2);ctx.fill();
    if(u.kind==="soldier"||u.kind==="knight"){
      ctx.save();ctx.translate(19,-27);ctx.rotate(armAngle);
      ctx.fillStyle="#b9a17c";ctx.fillRect(-2,-2,5,8);ctx.fillStyle="#ded8c8";ctx.fillRect(0,-27,4,27);ctx.fillStyle="#f3e5c8";ctx.beginPath();ctx.moveTo(0,-27);ctx.lineTo(2,-35);ctx.lineTo(5,-27);ctx.fill();ctx.restore();
      ctx.fillStyle=c.dark;ctx.fillRect(-23,-33,10,16);ctx.strokeStyle=c.light;ctx.strokeRect(-23,-33,10,16);
    }else if(u.kind==="archer"){
      ctx.strokeStyle="#d7bd93";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(20,-38);ctx.lineTo(27,-55);ctx.lineTo(20,-68);ctx.stroke();
    }else{
      ctx.strokeStyle="#b99aef";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(20,-28);ctx.lineTo(23,-62);ctx.stroke();ctx.fillStyle="#d7b8ff";ctx.beginPath();ctx.arc(23,-66,6,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle="#f1e7d5";ctx.font="9px sans-serif";ctx.textAlign="center";ctx.fillText(u.kind==="knight"?"K":u.kind==="archer"?"A":u.kind==="mage"?"M":"S",0,-68);
    ctx.fillStyle="#17151a";ctx.fillRect(-12,-78,24,3);ctx.fillStyle=u.side==="red"?"#e47b6f":"#85b5ed";ctx.fillRect(-12,-78,24*clamp(u.hp/u.maxHp,0,1),3);
    ctx.restore();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,"#172432");sky.addColorStop(.58,"#65707a");sky.addColorStop(.59,"#74604b");sky.addColorStop(1,"#342a27");ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#d5ad77";ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(600,105,43,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle="#27313a";ctx.beginPath();ctx.moveTo(0,300);for(let x=0;x<=W;x+=100)ctx.lineTo(x,230+Math.sin(x*.012)*32+Math.cos(x*.025)*18);ctx.lineTo(W,ground);ctx.lineTo(0,ground);ctx.fill();
    ctx.fillStyle="#8e7052";ctx.fillRect(0,ground,W,H-ground);
    ctx.strokeStyle="#c4a17a22";ctx.lineWidth=1;for(let i=0;i<22;i++){ctx.beginPath();ctx.moveTo(i*63,ground+20);ctx.lineTo(i*63-35,H);ctx.stroke();}
    ctx.fillStyle="#e2c69a22";ctx.fillRect(0,ground-3,W,3);
    ctx.setLineDash([8,12]);ctx.strokeStyle="#f0d7ad55";ctx.beginPath();ctx.moveTo(600,ground-12);ctx.lineTo(600,H);ctx.stroke();ctx.setLineDash([]);
    drawCastle(85,"red");drawCastle(1115,"blue");
    const sorted=[...state.units].sort((a,b)=>a.y-b.y);for(const u of sorted)drawUnit(u,performance.now());
    for(const p of state.projectiles){ctx.fillStyle=p.kind==="mage"?"#c6a0ff":"#f3d6a0";ctx.beginPath();ctx.arc(p.x,p.y,p.kind==="mage"?6:3,0,Math.PI*2);ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.globalAlpha=.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-(p.side==="red"?17:-17),p.y+4);ctx.stroke();ctx.globalAlpha=1;}
    for(const p of state.particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  }
  function loop(now){
    const dt=Math.min(.04,(now-state.last)/1000||0);
    state.last=now;
    if(state.battle)update(dt,now);
    draw();
    state.raf=requestAnimationFrame(loop);
  }
  function pointer(e){
    const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;
    if(state.battle){
      const hit=[...state.units].reverse().find(u=>Math.hypot(u.x-x,(u.y-32)-y)<25);
      if(hit){state.selected=hit;window.CrownGame?.onUnitSelected({side:hit.side,kind:hit.kind});draw();return;}
      if(state.selected){state.selected.order={x:clamp(x,35,1165),y:clamp(y,ground-150,ground-5)};state.selected=null;}
      return;
    }
    const hit=[...state.units].reverse().find(u=>u.side===state.active&&Math.hypot(u.x-x,(u.y-32)-y)<25);
    if(hit){state.selected=hit;window.CrownGame?.onUnitSelected({side:hit.side,kind:hit.kind});}
    else if(state.selected){state.selected.order={x:clamp(x,state.active==="red"?35:605,state.active==="red"?595:1165),y:clamp(y,ground-150,ground-5)};state.selected=null;}
  }
  canvas.addEventListener("pointerdown",pointer);
  if(!state.raf){state.last=performance.now();state.raf=requestAnimationFrame(loop);}
  window.Crown2D={deployArmy,setActiveSide,beginBattle,removeArmy,resetArmies};
  // Keep the old controller interface intact while replacing its 3D renderer.
  window.Crown3D=window.Crown2D;
  draw();
})();