(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const canvas = $("battleCanvas"), ctx = canvas.getContext("2d");
  const state = {
    turn: "red", phase: "red", tool: "soldier",
    commands: { red: [], blue: [] }, paths: [], drawing: null,
    health: { red: 100, blue: 100 }, guard: { red: false, blue: false }, round: 1, sound: true, running: false
  };
  const colors = { red: "#e36b5d", blue: "#83aee7" };
  const unitStats = {
    soldier: { damage: 10, speed: 1, label: "Soldier", power: "SHIELD GUARD", description: "Protects your king from the next hit (30% less damage)." },
    archer: { damage: 15, speed: 1.15, label: "Archer", power: "ARROW VOLLEY", description: "A precise volley adds 8 bonus damage." },
    knight: { damage: 21, speed: .85, label: "Knight", power: "IRON CHARGE", description: "A mounted charge adds 10 bonus damage." },
    mage: { damage: 18, speed: .95, label: "Mage", power: "METEOR", description: "Arcane impact adds 12 bonus damage." }
  };
  let audioCtx = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  function drawPath(points, side, tool, live) {
    if (!points.length) return;
    ctx.save();
    ctx.strokeStyle = colors[side]; ctx.fillStyle = colors[side];
    ctx.lineWidth = tool === "knight" ? 5 : tool === "mage" ? 3.5 : 3;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.globalAlpha = live ? .95 : .68;
    if (tool === "mage") ctx.setLineDash([5, 7]);
    ctx.shadowColor = colors[side]; ctx.shadowBlur = live ? 13 : 6;
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    ctx.setLineDash([]);
    const end = points[points.length - 1];
    ctx.beginPath(); ctx.arc(end.x, end.y, tool === "knight" ? 7 : 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    state.paths.forEach(command => drawPath(command.points, command.side, command.tool, false));
    if (state.drawing) drawPath(state.drawing.points, state.turn, state.tool, true);
    state.commands.red.concat(state.commands.blue).forEach(command => {
      const end = command.points[command.points.length - 1];
      ctx.save(); ctx.fillStyle = colors[command.side]; ctx.shadowColor = colors[command.side]; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(end.x, end.y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
  }
  function canDrawAt(p) {
    const middle = canvas.clientWidth / 2;
    return state.turn === "red" ? p.x <= middle - 8 : p.x >= middle + 8;
  }
  canvas.addEventListener("pointerdown", event => {
    if (state.running || state.phase !== state.turn || state.commands[state.turn].length >= 3) return;
    const p = point(event);
    if (!canDrawAt(p)) return;
    canvas.setPointerCapture(event.pointerId);
    state.drawing = { points: [p] }; draw();
  });
  canvas.addEventListener("pointermove", event => {
    if (!state.drawing) return;
    const p = point(event), previous = state.drawing.points[state.drawing.points.length - 1];
    if (Math.hypot(p.x - previous.x, p.y - previous.y) > 4) {
      // Keep every point on the commander's own side of the field.
      const middle = canvas.clientWidth / 2;
      p.x = state.turn === "red" ? Math.min(p.x, middle - 8) : Math.max(p.x, middle + 8);
      state.drawing.points.push(p); draw();
    }
  });
  function finishDrawing() {
    if (!state.drawing) return;
    const draft = state.drawing; state.drawing = null;
    if (draft.points.length > 1) {
      const command = { side: state.turn, tool: state.tool, points: draft.points };
      state.commands[state.turn].push(command); state.paths.push(command); playTone(260, .07); sync3DUnits();
    }
    draw(); updateUI();
  }
  canvas.addEventListener("pointerup", finishDrawing);
  canvas.addEventListener("pointercancel", finishDrawing);

  function sync3DUnits() {
    if (window.Crown3D?.supported) {
      window.Crown3D.sync(state.paths, canvas.clientWidth, canvas.clientHeight);
    }
  }

  function updateUI() {
    const redCount = state.commands.red.length, blueCount = state.commands.blue.length;
    const redActive = state.phase === "red", blueActive = state.phase === "blue";
    $("turnLabel").textContent = state.phase === "battle" ? "BATTLE IN PROGRESS" : state.turn.toUpperCase() + " KING'S TURN";
    $("turnDot").className = "turn-dot " + state.turn;
    $("toolLabel").textContent = state.phase === "battle" ? "The armies are clashing" : state.commands[state.turn].length >= 3 ? "Command limit reached" : unitStats[state.tool].power + " · " + unitStats[state.tool].description;
    $("redStatus").textContent = redCount + "/3 commands issued" + (redActive ? " · commanding" : "") + (state.guard.red ? " · SHIELD READY" : "");
    $("blueStatus").textContent = blueCount + "/3 commands issued" + (blueActive ? " · commanding" : "") + (state.guard.blue ? " · SHIELD READY" : "");
    $("redHealth").style.width = state.health.red + "%";
    $("blueHealth").style.width = state.health.blue + "%";
    $("roundNumber").textContent = String(state.round).padStart(2, "0");
    $("dayNumber").textContent = String(state.round).padStart(2, "0");
    $("phaseLabel").textContent = state.phase === "red" ? "RED COMMAND PHASE" : state.phase === "blue" ? "BLUE COMMAND PHASE" : "THE CLASH BEGINS";
    $("arenaCaption").textContent = state.phase === "red" ? "RED KING — DRAW ON THE LEFT SIDE" : state.phase === "blue" ? "BLUE KING — DRAW ON THE RIGHT SIDE" : "THE ARMIES MARCH";
    $("advanceBtn").disabled = state.running || (state.phase === "red" && redCount === 0) || (state.phase === "blue" && blueCount === 0);
    $("advanceBtn").querySelector("span").textContent = state.phase === "red" ? "END RED TURN" : state.phase === "blue" ? "UNLEASH BATTLE" : "BATTLE IN PROGRESS";
    $("advanceBtn").querySelector("b").textContent = state.phase === "blue" ? "⚔" : "↗";
    $("undoBtn").disabled = state.running || state.commands[state.turn].length === 0 || state.phase === "battle";
    document.querySelectorAll(".tool").forEach(button => {
      const active = button.dataset.tool === state.tool;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      button.disabled = state.running || state.phase === "battle" || state.commands[state.turn].length >= 3;
    });
  }
  document.querySelectorAll(".tool").forEach(button => button.addEventListener("click", () => {
    if (state.phase === "battle" || state.running) return;
    state.tool = button.dataset.tool; updateUI();
  }));
  $("undoBtn").addEventListener("click", () => {
    const commands = state.commands[state.turn];
    if (!commands.length) return;
    const last = commands.pop();
    state.paths.splice(state.paths.lastIndexOf(last), 1);
    draw(); sync3DUnits(); updateUI();
  });
  $("advanceBtn").addEventListener("click", () => {
    if (state.phase === "red") {
      state.phase = "blue"; state.turn = "blue"; state.tool = "soldier";
      playTone(330, .12); updateUI(); draw();
    } else if (state.phase === "blue") runBattle();
  });
  $("beginBtn").addEventListener("click", () => {
    $("intro").classList.add("hidden"); $("gameShell").classList.remove("hidden");
    resize(); updateUI();
  });
  $("resetBtn").addEventListener("click", reset);
  $("howBtn").addEventListener("click", () => $("modal").classList.remove("hidden"));
  $("closeModal").addEventListener("click", () => $("modal").classList.add("hidden"));
  $("gotIt").addEventListener("click", () => $("modal").classList.add("hidden"));
  $("playAgain").addEventListener("click", () => {
    $("resultOverlay").classList.add("hidden"); reset();
  });
  $("soundToggle").addEventListener("click", () => {
    state.sound = !state.sound;
    $("soundToggle").innerHTML = state.sound ? "♫ <span>SOUND ON</span>" : "♫ <span>SOUND OFF</span>";
    $("soundToggle").setAttribute("aria-label", state.sound ? "Turn sound off" : "Turn sound on");
  });

  function playTone(frequency, duration = .12) {
    if (!state.sound) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator(), gain = audioCtx.createGain();
      oscillator.type = "triangle"; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.045, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
      oscillator.connect(gain); gain.connect(audioCtx.destination);
      oscillator.start(); oscillator.stop(audioCtx.currentTime + duration);
    } catch (_) { /* Audio is an optional enhancement. */ }
  }
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  function pointAlong(points, progress) {
    if (points.length === 1) return points[0];
    const lengths = []; let total = 0;
    for (let i = 1; i < points.length; i++) {
      const length = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      lengths.push(length); total += length;
    }
    let remaining = total * progress;
    for (let i = 0; i < lengths.length; i++) {
      if (remaining <= lengths[i]) {
        const ratio = lengths[i] ? remaining / lengths[i] : 0;
        return { x: points[i].x + (points[i + 1].x - points[i].x) * ratio, y: points[i].y + (points[i + 1].y - points[i].y) * ratio };
      }
      remaining -= lengths[i];
    }
    return points[points.length - 1];
  }
  async function animateUnit(command) {
    if (window.Crown3D?.supported) {
      await window.Crown3D.animateCommand(command, canvas.clientWidth, canvas.clientHeight);
      return;
    }
    const stats = unitStats[command.tool], steps = Math.max(18, Math.min(42, Math.round(command.points.length * 1.5)));
    for (let i = 0; i <= steps; i++) {
      draw();
      const position = pointAlong(command.points, i / steps);
      ctx.save(); ctx.fillStyle = "#fff2cf"; ctx.shadowColor = colors[command.side]; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.arc(position.x, position.y, command.tool === "knight" ? 8 : 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      await wait(18 / stats.speed);
    }
  }
  async function runBattle() {
    if (state.running) return;
    state.running = true; state.phase = "battle"; updateUI();
    const order = [];
    for (let i = 0; i < Math.max(state.commands.red.length, state.commands.blue.length); i++) {
      if (state.commands.red[i]) order.push(state.commands.red[i]);
      if (state.commands.blue[i]) order.push(state.commands.blue[i]);
    }
    for (const command of order) {
      if (state.health.red <= 0 || state.health.blue <= 0) break;
      await animateUnit(command);
      const enemy = command.side === "red" ? "blue" : "red";
      const stats = unitStats[command.tool];
      const terrainBonus = command.points.length > 5 ? 2 : 0;
      const powerBonus = command.tool === "archer" ? 8 : command.tool === "knight" ? 10 : command.tool === "mage" ? 12 : 0;
      let damage = stats.damage + terrainBonus + powerBonus + Math.floor(Math.random() * 4);
      if (state.guard[enemy]) {
        damage = Math.ceil(damage * .7);
        state.guard[enemy] = false;
        $(enemy + "Status").textContent = "Shield absorbed part of the strike!";
      }
      state.health[enemy] = Math.max(0, state.health[enemy] - damage);
      if (window.Crown3D?.supported) window.Crown3D.siegeImpact(enemy, state.health[enemy], damage);
      if (command.tool === "soldier") {
        state.guard[command.side] = true;
        $(command.side + "Status").textContent = "Shield Guard ready · next hit reduced";
      }
      $("combatFlash").classList.remove("flash"); void $("combatFlash").offsetWidth; $("combatFlash").classList.add("flash");
      playTone(command.tool === "mage" ? 520 : command.tool === "knight" ? 190 : 145, .2);
      updateUI(); await wait(330);
    }
    state.running = false;
    if (state.health.red <= 0 || state.health.blue <= 0) {
      const winner = state.health.red > state.health.blue ? "RED" : "BLUE";
      $("resultTitle").textContent = winner + " VICTORY";
      $("resultText").textContent = winner === "RED" ? "The Crimson Realm claims the last throne." : "The Azure Realm claims the last throne.";
      $("resultOverlay").classList.remove("hidden"); playTone(420, .5); updateUI(); return;
    }
    state.round++;
    state.commands = { red: [], blue: [] }; state.paths = [];
    state.guard = { red: false, blue: false };
    state.phase = "red"; state.turn = "red"; state.tool = "soldier";
    updateUI(); draw(); sync3DUnits();
  }
  function reset() {
    state.turn = "red"; state.phase = "red"; state.commands = { red: [], blue: [] };
    state.paths = []; state.drawing = null; state.health = { red: 100, blue: 100 };
    state.guard = { red: false, blue: false };
    state.round = 1; state.running = false; state.tool = "soldier";
    draw(); sync3DUnits(); updateUI();
  }
  window.addEventListener("resize", resize);
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe($("arena"));
  updateUI();
})();