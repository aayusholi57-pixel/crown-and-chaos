import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

(() => {
  const host = document.getElementById("threeStage");
  const arena = document.getElementById("arena");
  if (!host || !window.WebGLRenderingContext) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 8.8, 17.5);
  camera.lookAt(0, 1.2, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xc9dcff, 0x4c3027, 2.1));
  const sun = new THREE.DirectionalLight(0xffd6a0, 3.2);
  sun.position.set(-5, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  const rim = new THREE.PointLight(0x6f9fff, 38, 30);
  rim.position.set(5, 5, -4);
  scene.add(rim);

  const mat = (color, metalness = 0, roughness = .72, emissive = 0x000000) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity: .55 });
  const groundMat = mat(0x514238);
  const goldMat = mat(0xd5ae68, .68, .32);
  const redMat = mat(0x9f3339, .28, .42);
  const blueMat = mat(0x315b9a, .3, .4);
  const darkMat = mat(0x24232b, .15, .6);
  const skinMat = mat(0xd6a77f);
  const stoneMat = mat(0x77716d, .12, .85);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(19, 11), groundMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -.13, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(18, 28, 0x9c7c59, 0x806b57);
  grid.position.y = -.115;
  grid.material.transparent = true;
  grid.material.opacity = .18;
  scene.add(grid);

  function box(parent, w, h, d, material, x, y, z, bevel = false) {
    const geometry = bevel
      ? new THREE.BoxGeometry(w, h, d, 1, 1, 1)
      : new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function sphere(parent, x, y, z, sx, sy, sz, material) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(parent, r1, r2, h, material, x, y, z, segments = 8) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, segments), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function buildCastle(x, team) {
    const g = new THREE.Group();
    const color = team === "red" ? redMat : blueMat;
    box(g, 2.35, 1.65, 1.45, stoneMat, 0, .82, 0);
    box(g, 2.65, .24, 1.7, color, 0, 1.7, 0);
    for (let i = -1; i <= 1; i++) {
      box(g, .58, .72, .62, stoneMat, i * .82, 2.08, 0);
      box(g, .66, .12, .7, color, i * .82, 2.49, 0);
    }
    box(g, .56, .92, .12, darkMat, 0, .48, .74);
    const pole = cylinder(g, .035, .035, 1.3, goldMat, 0, 2.95, 0);
    const flag = new THREE.Mesh(new THREE.ConeGeometry(.38, .75, 3), color);
    flag.position.set(team === "red" ? .24 : -.24, 3.05, 0);
    flag.rotation.z = team === "red" ? -Math.PI / 2 : Math.PI / 2;
    g.add(flag);
    g.position.set(x, 0, -1.4);
    scene.add(g);
  }
  buildCastle(-7.1, "red");
  buildCastle(7.1, "blue");

  // Distant battlefield stones add depth without obscuring the command paths.
  for (let i = 0; i < 18; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.18 + Math.random() * .24, 0), stoneMat);
    rock.position.set((Math.random() - .5) * 17, -.02, (Math.random() - .5) * 8 - 1);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.scale.y = .45;
    rock.castShadow = true;
    scene.add(rock);
  }

  const units = new Map();
  const active = new Set();
  const teamMaterial = side => side === "red" ? redMat : blueMat;

  function makeWeapon(group, tool, side) {
    const metal = mat(0xbcc4ce, .8, .24);
    const wood = mat(0x68442d);
    const color = teamMaterial(side);
    if (tool === "soldier") {
      cylinder(group, .045, .045, 1.05, metal, .55, 1.35, 0, 6).rotation.z = -.18;
      box(group, .34, .48, .09, color, -.48, 1.22, .05);
      box(group, .22, .05, .1, goldMat, -.48, 1.22, .11);
    } else if (tool === "archer") {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(.45, .82, .02),
        new THREE.Vector3(.9, 1.38, .02),
        new THREE.Vector3(.45, 1.94, .02)
      );
      const bow = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, .035, 5, false), wood);
      group.add(bow);
      const string = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(.45, .82, .02), new THREE.Vector3(.45, 1.94, .02)
      ]);
      group.add(new THREE.Line(string, new THREE.LineBasicMaterial({ color: 0xe8d9bd })));
      cylinder(group, .025, .025, .8, metal, .32, 1.38, .05, 5).rotation.z = Math.PI / 2;
      sphere(group, .32, 1.78, .05, .08, .08, .08, color);
    } else if (tool === "knight") {
      cylinder(group, .055, .055, 1.45, metal, .56, 1.55, 0, 6).rotation.z = -.12;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(.12, .38, 5), metal);
      blade.position.set(.56, 2.35, 0);
      blade.rotation.z = -.12;
      group.add(blade);
      box(group, .22, .12, .13, goldMat, .56, .9, 0);
    } else {
      cylinder(group, .045, .045, 1.65, wood, .55, 1.48, 0, 7);
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.23), mat(0x8b71e8, .25, .2, 0x5841ff));
      crystal.position.set(.55, 2.36, 0);
      group.add(crystal);
      const glow = new THREE.PointLight(0x947cff, 3, 3);
      glow.position.copy(crystal.position);
      group.add(glow);
      const cape = new THREE.Mesh(new THREE.ConeGeometry(.55, 1.15, 5), mat(0x3d2d61));
      cape.position.set(0, .98, -.28);
      cape.rotation.x = Math.PI;
      group.add(cape);
    }
  }

  function createCharacter(command) {
    const side = command.side, tool = command.tool;
    const group = new THREE.Group();
    const armor = teamMaterial(side);
    const trim = goldMat;
    const helmet = mat(side === "red" ? 0x54282d : 0x253b61, .55, .3);
    const scale = tool === "knight" ? 1.13 : tool === "mage" ? 1.04 : 1;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.48, .55, .13, 12), mat(0x29242a, .5, .4));
    base.position.y = .02; group.add(base);
    const torso = sphere(group, 0, 1.13, 0, .48, .62, .3, armor);
    box(group, .68, .14, .37, trim, 0, 1.48, 0);
    sphere(group, 0, 1.91, 0, .31, .34, .29, skinMat);
    const headgear = new THREE.Mesh(new THREE.SphereGeometry(.34, 10, 8, 0, Math.PI * 2, 0, Math.PI * .62), helmet);
    headgear.position.y = 2.04; group.add(headgear);
    box(group, .55, .1, .12, trim, 0, 1.9, .26);
    // Visor slit and eye glint.
    box(group, .29, .045, .025, darkMat, 0, 1.98, .3);
    sphere(group, -.08, 1.99, .32, .035, .025, .02, mat(0xffd7a0, 0, .3, 0xffa64a));
    sphere(group, .08, 1.99, .32, .035, .025, .02, mat(0xffd7a0, 0, .3, 0xffa64a));

    const leftLeg = box(group, .19, .58, .22, darkMat, -.2, .38, 0);
    const rightLeg = box(group, .19, .58, .22, darkMat, .2, .38, 0);
    box(group, .27, .12, .36, helmet, -.2, .08, .06);
    box(group, .27, .12, .36, helmet, .2, .08, .06);
    const leftArm = sphere(group, -.48, 1.25, 0, .17, .42, .18, armor);
    const rightArm = sphere(group, .48, 1.25, 0, .17, .42, .18, armor);

    if (tool === "knight") {
      // A barded warhorse gives the knight a distinct mounted silhouette.
      const horse = sphere(group, 0, .78, -.55, .52, .48, .9, mat(0x4b3932));
      sphere(group, 0, 1.15, .18, .3, .42, .34, mat(0x4b3932));
      sphere(group, 0, 1.42, .38, .27, .36, .28, helmet);
      for (const x of [-.34, .34]) for (const z of [-.95, -.28]) {
        const leg = cylinder(group, .085, .11, .7, mat(0x352a27), x, .36, z, 7);
        leg.rotation.z = x * .22;
      }
      box(group, .9, .2, 1.25, armor, 0, .85, -.55);
      horse.position.y = .78;
    }
    makeWeapon(group, tool, side);
    const auraColor = side === "red" ? 0xff584a : 0x64aaff;
    const aura = new THREE.Mesh(
      new THREE.RingGeometry(.48, .55, 32),
      new THREE.MeshBasicMaterial({ color: auraColor, transparent: true, opacity: .62, side: THREE.DoubleSide })
    );
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = .1;
    group.add(aura);
    group.scale.setScalar(scale * .72);
    group.userData = { command, leftLeg, rightLeg, leftArm, rightArm, aura, baseScale: scale * .72 };
    return group;
  }

  function toWorld(p, width, height) {
    return { x: (p.x / width - .5) * 15.2, z: (p.y / height - .5) * 6.2 };
  }
  function sync(commands, width, height) {
    for (const group of units.values()) scene.remove(group);
    units.clear();
    commands.forEach(command => {
      if (!command.points?.length) return;
      const group = createCharacter(command);
      const pos = toWorld(command.points[0], width, height);
      group.position.set(pos.x, 0, pos.z);
      group.rotation.y = command.side === "red" ? -Math.PI / 2 : Math.PI / 2;
      scene.add(group);
      units.set(command, group);
    });
  }
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function animateCommand(command, width, height) {
    let group = units.get(command);
    if (!group) {
      sync([command], width, height);
      group = units.get(command);
    }
    const points = command.points.map(p => toWorld(p, width, height));
    if (points.length < 2) return;
    group.rotation.y = command.side === "red" ? Math.PI / 2 : -Math.PI / 2;
    const length = points.reduce((sum, p, i) => i ? sum + Math.hypot(p.x - points[i - 1].x, p.z - points[i - 1].z) : 0, 0);
    const speedFactor = command.tool === "knight" ? 1.55 : command.tool === "archer" ? 1.2 : command.tool === "mage" ? .88 : 1;\n    const duration = Math.max(650, Math.min(2400, length * 170 / speedFactor));
    const started = performance.now();
    while (true) {
      const t = Math.min(1, (performance.now() - started) / duration);
      const target = t * (points.length - 1);
      const index = Math.min(points.length - 2, Math.floor(target));
      const local = target - index;
      const a = points[index], b = points[index + 1];
      group.position.x = THREE.MathUtils.lerp(a.x, b.x, local);
      group.position.z = THREE.MathUtils.lerp(a.z, b.z, local);
      group.position.y = Math.abs(Math.sin(t * Math.PI * 12)) * .08;
      group.userData.leftLeg.rotation.x = Math.sin(t * Math.PI * 12) * .5;
      group.userData.rightLeg.rotation.x = -Math.sin(t * Math.PI * 12) * .5;
      group.userData.leftArm.rotation.x = -Math.sin(t * Math.PI * 12) * .24;
      group.userData.rightArm.rotation.x = Math.sin(t * Math.PI * 12) * .24;
      if (t >= 1) break;
      await sleep(16);
    }
    group.position.y = 0;
    group.userData.leftLeg.rotation.x = 0;
    group.userData.rightLeg.rotation.x = 0;
    const pulse = new THREE.PointLight(command.tool === "mage" ? 0xa58cff : command.tool === "knight" ? 0xff9c55 : 0xffd28a, 0, 7);
    pulse.position.copy(group.position).add(new THREE.Vector3(0, 1.2, 0));
    scene.add(pulse);
    const start = performance.now();
    let special = null;
    if (command.tool === "knight") {
      special = new THREE.Mesh(new THREE.TorusGeometry(.55, .055, 8, 36), mat(0xffc16b, .2, .25, 0xff8b36));
      special.rotation.x = -Math.PI / 2; special.position.copy(group.position); special.position.y = .12; scene.add(special);
    } else if (command.tool === "soldier") {
      special = new THREE.Mesh(new THREE.SphereGeometry(.9, 16, 12), new THREE.MeshBasicMaterial({ color: 0x9ed7ff, wireframe: true, transparent: true, opacity: .5 }));
      special.position.copy(group.position).add(new THREE.Vector3(0, 1, 0)); scene.add(special);
    } else if (command.tool === "mage") {
      special = new THREE.Mesh(new THREE.IcosahedronGeometry(.5, 1), new THREE.MeshStandardMaterial({ color: 0xff9a48, emissive: 0xff4a12, emissiveIntensity: 2, roughness: .25 }));
      special.position.copy(group.position).add(new THREE.Vector3(0, 7, 0)); scene.add(special);
      const meteorLight = new THREE.PointLight(0xff6a25, 12, 9); special.add(meteorLight);
    } else if (command.tool === "archer") {
      special = new THREE.Group();
      const arrowMat = mat(0xffdf9a, .45, .25, 0x9d641f);
      for (let i = 0; i < 5; i++) {
        const arrow = new THREE.Group();
        cylinder(arrow, .025, .025, .75, arrowMat, 0, 0, 0, 5);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(.08, .22, 5), arrowMat);
        tip.position.y = .46; arrow.add(tip);
        arrow.position.set(group.position.x + (i - 2) * .22, 3.2 + Math.abs(i - 2) * .18, group.position.z - .8);
        special.add(arrow);
      }
      scene.add(special);
    }
    while (performance.now() - start < (command.tool === "mage" ? 850 : 520)) {
      const p = Math.min(1, (performance.now() - start) / (command.tool === "mage" ? 850 : 520));
      pulse.intensity = Math.sin(p * Math.PI) * 8;
      group.scale.setScalar(group.userData.baseScale * (1 + Math.sin(p * Math.PI) * .12));
      if (special && command.tool === "knight") { special.scale.setScalar(1 + p * 3); special.material.opacity = 1 - p; special.material.transparent = true; }
      if (special && command.tool === "soldier") { special.scale.setScalar(1 + p * .45); special.material.opacity = .5 * (1 - p); }
      if (special && command.tool === "mage") special.position.y = 7 - p * 6.6;
      if (special && command.tool === "archer") special.children.forEach(arrow => { arrow.position.y -= .045; arrow.position.z -= .09; });
      await sleep(16);
    }
    group.scale.setScalar(group.userData.baseScale);
    if (special) scene.remove(special);
    scene.remove(pulse);
  }

  function resize() {
    const w = arena.clientWidth, h = arena.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 600 ? 21 : 17.5;
    camera.position.y = w < 600 ? 10.5 : 8.8;
    camera.updateProjectionMatrix();
  }
  const clock = new THREE.Clock();
  function render() {
    const t = clock.getElapsedTime();
    for (const group of units.values()) {
      const d = group.userData;
      if (d && !active.has(group)) {
        d.aura.material.opacity = .42 + Math.sin(t * 2.2 + group.position.x) * .18;
        group.rotation.z = Math.sin(t * 1.4 + group.position.x) * .018;
      }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  new ResizeObserver(resize).observe(arena);
  window.addEventListener("resize", resize);
  resize();
  render();

  window.Crown3D = {
    sync,
    animateCommand,
    supported: true
  };
})();
