const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";
const $ = (selector) => document.querySelector(selector);

let THREE = null;
let renderer = null;
let scene = null;
let camera = null;
let houseGroup = null;
let roofGroup = null;
let currentModel = null;
let roofVisible = true;
let orbitTheta = 0.78;
let orbitPhi = 0.86;
let orbitRadius = 12;
let cameraTarget = null;
let isDragging = false;
let pointerX = 0;
let pointerY = 0;
let listenersReady = false;

const roomColors = [0x6f8d95, 0x8a7868, 0x667d73, 0x85758e, 0x8a8768, 0x667b8d, 0x9b7a68, 0x6c8c83];

function setStatus(message, state) {
  const status = $("#house3dStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state || "";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function makeMaterial(color, options) {
  return new THREE.MeshStandardMaterial(Object.assign({
    color,
    roughness: 0.78,
    metalness: 0.02
  }, options || {}));
}

function addBox(parent, width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(0.025, width), Math.max(0.025, height), Math.max(0.025, depth)),
    material
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addFace(parent, points, material) {
  const order = points.length === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3];
  const vertices = [];
  for (const index of order) vertices.push(points[index][0], points[index][1], points[index][2]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  const face = new THREE.Mesh(geometry, material);
  face.castShadow = true;
  face.receiveShadow = true;
  parent.add(face);
  return face;
}

function disposeObject(object) {
  const geometries = new Set();
  const materials = new Set();
  object.traverse((item) => {
    if (item.geometry) geometries.add(item.geometry);
    if (item.material) {
      for (const material of Array.isArray(item.material) ? item.material : [item.material]) {
        materials.add(material);
      }
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

function updateCamera() {
  if (!camera || !cameraTarget) return;
  const horizontal = orbitRadius * Math.sin(orbitPhi);
  camera.position.set(
    cameraTarget.x + horizontal * Math.sin(orbitTheta),
    cameraTarget.y + orbitRadius * Math.cos(orbitPhi),
    cameraTarget.z + horizontal * Math.cos(orbitTheta)
  );
  camera.lookAt(cameraTarget);
}

function resizeRenderer() {
  const viewport = $("#house3dViewport");
  if (!renderer || !camera || !viewport) return;
  const bounds = viewport.getBoundingClientRect();
  if (bounds.width < 2) return;
  const width = Math.max(280, Math.floor(bounds.width));
  const height = Math.max(300, Math.floor(bounds.height || 420));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}

function setupRenderer() {
  if (renderer) return;
  const canvas = $("#house3dCanvas");
  const viewport = $("#house3dViewport");
  if (!canvas || !viewport) throw new Error("3D ko‘rish oynasi topilmadi.");

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x0b1420, 1);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1420);
  scene.add(new THREE.HemisphereLight(0xd8e8ff, 0x202a37, 2.0));
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  const sun = new THREE.DirectionalLight(0xffe2b8, 2.2);
  sun.position.set(8, 14, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  scene.add(sun);

  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 250);
  renderer.setAnimationLoop(() => {
    if (scene && camera) renderer.render(scene, camera);
  });

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(resizeRenderer).observe(viewport);
  } else {
    window.addEventListener("resize", resizeRenderer);
  }

  if (!listenersReady) {
    listenersReady = true;

    viewport.addEventListener("pointerdown", (event) => {
      if (event.target && event.target.closest && event.target.closest("button")) return;
      isDragging = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      viewport.classList.add("is-dragging");
      try { viewport.setPointerCapture(event.pointerId); } catch {}
    });

    viewport.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      const dx = event.clientX - pointerX;
      const dy = event.clientY - pointerY;
      pointerX = event.clientX;
      pointerY = event.clientY;
      orbitTheta -= dx * 0.008;
      orbitPhi = clamp(orbitPhi + dy * 0.006, 0.2, 1.42);
      updateCamera();
    });

    const stopDragging = () => {
      isDragging = false;
      viewport.classList.remove("is-dragging");
    };
    viewport.addEventListener("pointerup", stopDragging);
    viewport.addEventListener("pointercancel", stopDragging);
    viewport.addEventListener("lostpointercapture", stopDragging);
    viewport.addEventListener("wheel", (event) => {
      event.preventDefault();
      orbitRadius = clamp(orbitRadius * Math.exp(event.deltaY * 0.001), 3.5, 90);
      updateCamera();
    }, { passive: false });
    viewport.addEventListener("contextmenu", (event) => event.preventDefault());

    $("#toggleRoofBtn")?.addEventListener("click", () => {
      roofVisible = !roofVisible;
      if (roofGroup) roofGroup.visible = roofVisible;
      $("#toggleRoofBtn").textContent = roofVisible ? "Tomni yashirish" : "Tomni ko‘rsatish";
      setStatus(roofVisible ? "3D uy tayyor · tom ko‘rsatilmoqda" : "3D uy tayyor · xonalar ochiq ko‘rinishda", "ready");
    });

    $("#reset3dViewBtn")?.addEventListener("click", () => {
      orbitTheta = 0.78;
      orbitPhi = 0.86;
      if (currentModel) orbitRadius = Math.max(currentModel.project.houseWidth, currentModel.project.houseLength) * 1.85;
      updateCamera();
    });
  }
  resizeRenderer();
}

function addWindow(parent, orientation, fixed, along, width, height, centerY, glass, frame) {
  const rail = 0.055;
  if (orientation === "z") {
    addBox(parent, width, height, 0.045, along, centerY, fixed, glass);
    addBox(parent, width + rail, rail, 0.075, along, centerY - height / 2, fixed, frame);
    addBox(parent, width + rail, rail, 0.075, along, centerY + height / 2, fixed, frame);
    addBox(parent, rail, height + rail, 0.075, along - width / 2, centerY, fixed, frame);
    addBox(parent, rail, height + rail, 0.075, along + width / 2, centerY, fixed, frame);
  } else {
    addBox(parent, 0.045, height, width, fixed, centerY, along, glass);
    addBox(parent, 0.075, rail, width + rail, fixed, centerY - height / 2, along, frame);
    addBox(parent, 0.075, rail, width + rail, fixed, centerY + height / 2, along, frame);
    addBox(parent, 0.075, height + rail, rail, fixed, centerY, along - width / 2, frame);
    addBox(parent, 0.075, height + rail, rail, fixed, centerY, along + width / 2, frame);
  }
}

function addExteriorWindows(root, project, wallThickness, baseY, wallHeight, width, length, glass, frame) {
  const count = Math.round(clamp(project.windowCount || 0, 0, 20));
  if (!count) return;
  const sideGroups = [
    { orientation: "z", fixed: -length / 2 - wallThickness * 0.52, span: width },
    { orientation: "x", fixed: width / 2 + wallThickness * 0.52, span: length },
    { orientation: "x", fixed: -width / 2 - wallThickness * 0.52, span: length }
  ];
  for (let i = 0; i < count; i += 1) {
    const side = sideGroups[i % sideGroups.length];
    const groupIndex = Math.floor(i / sideGroups.length);
    const groupCount = Math.ceil((count - (i % sideGroups.length)) / sideGroups.length);
    const fraction = (groupIndex + 1) / (groupCount + 1);
    const at = -side.span / 2 + side.span * fraction;
    const paneWidth = Math.min(1.1, side.span / (groupCount + 1) * 0.52);
    addWindow(
      root,
      side.orientation,
      side.fixed,
      at,
      paneWidth,
      0.92,
      baseY + wallHeight * 0.61,
      glass,
      frame
    );
  }
}

function buildRoomPartitions(root, project, rooms, wallMaterial, baseY, wallHeight, wallThickness) {
  const width = project.houseWidth;
  const length = project.houseLength;
  const seen = new Set();
  const partitionHeight = wallHeight * 0.94;

  function vertical(xNorm, yStart, yEnd) {
    const start = -length / 2 + yStart * length;
    const end = -length / 2 + yEnd * length;
    const fixedX = -width / 2 + xNorm * width;
    const key = ["v", fixedX.toFixed(2), start.toFixed(2), end.toFixed(2)].join("|");
    if (seen.has(key) || end - start < 0.28) return;
    seen.add(key);
    addBox(root, wallThickness * 0.76, partitionHeight, end - start, fixedX, baseY + partitionHeight / 2, (start + end) / 2, wallMaterial);
  }

  function horizontal(yNorm, xStart, xEnd) {
    const fixedZ = -length / 2 + yNorm * length;
    const start = -width / 2 + xStart * width;
    const end = -width / 2 + xEnd * width;
    const key = ["h", fixedZ.toFixed(2), start.toFixed(2), end.toFixed(2)].join("|");
    if (seen.has(key) || end - start < 0.28) return;
    seen.add(key);
    addBox(root, end - start, partitionHeight, wallThickness * 0.76, (start + end) / 2, baseY + partitionHeight / 2, fixedZ, wallMaterial);
  }

  for (const room of rooms) {
    if (room.x > 0.002) vertical(room.x, room.y, room.y + room.length);
    if (room.x + room.width < 0.998) vertical(room.x + room.width, room.y, room.y + room.length);
    if (room.y > 0.002) horizontal(room.y, room.x, room.x + room.width);
    if (room.y + room.length < 0.998) horizontal(room.y + room.length, room.x, room.x + room.width);
  }
}

function buildRoof(parent, project, roofMaterial, exteriorMaterial, baseY, wallHeight, wallThickness) {
  const width = project.houseWidth;
  const length = project.houseLength;
  const topY = baseY + wallHeight;
  const roofWidth = width + 0.48;
  const roofLength = length + 0.48;
  const halfWidth = roofWidth / 2;
  const halfLength = roofLength / 2;
  const rise = Math.max(0.45, Math.min(width * 0.27, 1.55));
  const ridgeY = topY + rise;

  if (project.roofType === "flat") {
    addBox(parent, roofWidth, 0.16, roofLength, 0, topY + 0.09, 0, roofMaterial);
    addBox(parent, roofWidth, 0.22, 0.11, 0, topY + 0.05, halfLength, roofMaterial);
    addBox(parent, roofWidth, 0.22, 0.11, 0, topY + 0.05, -halfLength, roofMaterial);
    addBox(parent, 0.11, 0.22, roofLength, halfWidth, topY + 0.05, 0, roofMaterial);
    addBox(parent, 0.11, 0.22, roofLength, -halfWidth, topY + 0.05, 0, roofMaterial);
    return;
  }

  if (project.roofType === "hip") {
    const ridgeFront = [0, ridgeY, halfLength * 0.28];
    const ridgeBack = [0, ridgeY, -halfLength * 0.28];
    addFace(parent, [
      [-halfWidth, topY, -halfLength],
      [-halfWidth, topY, halfLength],
      ridgeFront,
      ridgeBack
    ], roofMaterial);
    addFace(parent, [
      [halfWidth, topY, halfLength],
      [halfWidth, topY, -halfLength],
      ridgeBack,
      ridgeFront
    ], roofMaterial);
    addFace(parent, [
      [-halfWidth, topY, halfLength],
      [halfWidth, topY, halfLength],
      ridgeFront
    ], roofMaterial);
    addFace(parent, [
      [halfWidth, topY, -halfLength],
      [-halfWidth, topY, -halfLength],
      ridgeBack
    ], roofMaterial);
    return;
  }

  addFace(parent, [
    [-halfWidth, topY, -halfLength],
    [0, ridgeY, -halfLength],
    [0, ridgeY, halfLength],
    [-halfWidth, topY, halfLength]
  ], roofMaterial);
  addFace(parent, [
    [0, ridgeY, -halfLength],
    [halfWidth, topY, -halfLength],
    [halfWidth, topY, halfLength],
    [0, ridgeY, halfLength]
  ], roofMaterial);
  addFace(parent, [
    [-width / 2, topY, -length / 2 + wallThickness / 2],
    [width / 2, topY, -length / 2 + wallThickness / 2],
    [0, ridgeY, -length / 2 + wallThickness / 2]
  ], exteriorMaterial);
  addFace(parent, [
    [width / 2, topY, length / 2 - wallThickness / 2],
    [-width / 2, topY, length / 2 - wallThickness / 2],
    [0, ridgeY, length / 2 - wallThickness / 2]
  ], exteriorMaterial);
}

function buildHouse(model) {
  const project = model.project;
  const width = project.houseWidth;
  const length = project.houseLength;
  const wallHeight = project.wallHeight;
  const slabThickness = project.slabThicknessCm / 100;
  const wallThickness = clamp(project.wallThicknessCm / 100, 0.12, 0.32);
  const rooms = Array.isArray(model.rooms) ? model.rooms : [];
  const topY = slabThickness + wallHeight;
  const exterior = makeMaterial(0xd9d3c6, { roughness: 0.92 });
  const partition = makeMaterial(0xbcb9b1, { roughness: 0.95 });
  const slab = makeMaterial(0x858d91, { roughness: 0.94 });
  const doorMaterial = makeMaterial(0x805735, { roughness: 0.72 });
  const windowFrame = makeMaterial(0xd8e3e9, { roughness: 0.46, metalness: 0.12 });
  const windowGlass = makeMaterial(0x7bc4da, { roughness: 0.2, metalness: 0.08, transparent: true, opacity: 0.88 });
  const roofMaterial = makeMaterial(project.roofCover === "profnastil" ? 0x607c8e : 0x474d59, {
    roughness: 0.6,
    metalness: project.roofCover === "profnastil" ? 0.36 : 0.12,
    side: THREE.DoubleSide
  });

  if (houseGroup) {
    scene.remove(houseGroup);
    disposeObject(houseGroup);
  }
  houseGroup = new THREE.Group();
  scene.add(houseGroup);

  addBox(houseGroup, width + 6, 0.12, length + 6, 0, -0.13, 0, makeMaterial(0x182534, { roughness: 1 }));
  addBox(houseGroup, width, slabThickness, length, 0, slabThickness / 2, 0, slab);

  rooms.forEach((room, index) => {
    const roomWidth = room.width * width;
    const roomLength = room.length * length;
    const centerX = -width / 2 + (room.x + room.width / 2) * width;
    const centerZ = -length / 2 + (room.y + room.length / 2) * length;
    const finish = makeMaterial(roomColors[index % roomColors.length], { roughness: 0.82, metalness: 0.02 });
    addBox(houseGroup, Math.max(0.1, roomWidth - 0.035), 0.028, Math.max(0.1, roomLength - 0.035), centerX, slabThickness + 0.018, centerZ, finish);
  });

  const frontZ = length / 2 - wallThickness / 2;
  const backZ = -length / 2 + wallThickness / 2;
  const sideX = width / 2 - wallThickness / 2;
  addBox(houseGroup, width, wallHeight, wallThickness, 0, slabThickness + wallHeight / 2, backZ, exterior);
  addBox(houseGroup, wallThickness, wallHeight, length, -sideX, slabThickness + wallHeight / 2, 0, exterior);
  addBox(houseGroup, wallThickness, wallHeight, length, sideX, slabThickness + wallHeight / 2, 0, exterior);

  const doorWidth = Math.min(0.95, width * 0.24);
  const doorHeight = Math.min(2.12, wallHeight * 0.82);
  const sideSegment = Math.max(0.08, (width - doorWidth) / 2);
  addBox(houseGroup, sideSegment, wallHeight, wallThickness, -width / 2 + sideSegment / 2, slabThickness + wallHeight / 2, frontZ, exterior);
  addBox(houseGroup, sideSegment, wallHeight, wallThickness, width / 2 - sideSegment / 2, slabThickness + wallHeight / 2, frontZ, exterior);
  if (wallHeight > doorHeight) {
    addBox(houseGroup, doorWidth, wallHeight - doorHeight, wallThickness, 0, slabThickness + doorHeight + (wallHeight - doorHeight) / 2, frontZ, exterior);
  }

  const frameZ = length / 2 + 0.015;
  addBox(houseGroup, 0.07, doorHeight, 0.075, -doorWidth / 2, slabThickness + doorHeight / 2, frameZ, doorMaterial);
  addBox(houseGroup, 0.07, doorHeight, 0.075, doorWidth / 2, slabThickness + doorHeight / 2, frameZ, doorMaterial);
  addBox(houseGroup, doorWidth + 0.07, 0.07, 0.075, 0, slabThickness + doorHeight, frameZ, doorMaterial);
  const door = addBox(houseGroup, doorWidth * 0.86, doorHeight * 0.96, 0.055, -doorWidth * 0.08, slabThickness + doorHeight / 2, length / 2 - wallThickness * 0.45, doorMaterial);
  door.rotation.y = -0.28;

  buildRoomPartitions(houseGroup, project, rooms, partition, slabThickness, wallHeight, wallThickness);
  addExteriorWindows(houseGroup, project, wallThickness, slabThickness, wallHeight, width, length, windowGlass, windowFrame);

  roofGroup = new THREE.Group();
  buildRoof(roofGroup, project, roofMaterial, exterior, slabThickness, wallHeight, wallThickness);
  houseGroup.add(roofGroup);
  roofGroup.visible = roofVisible;
  $("#toggleRoofBtn").textContent = roofVisible ? "Tomni yashirish" : "Tomni ko‘rsatish";

  currentModel = model;
  cameraTarget = new THREE.Vector3(0, Math.max(0.65, topY * 0.42), 0);
  orbitTheta = 0.78;
  orbitPhi = 0.86;
  orbitRadius = Math.max(width, length) * 1.85;
  updateCamera();
  resizeRenderer();

  setStatus("3D model tayyor · sichqoncha yoki barmoq bilan aylantiring", "ready");
}

async function showHouse(model) {
  if (!model || !model.project || !Array.isArray(model.rooms)) return;
  setStatus("AI xona rejasidan 3D uy modeli qurilmoqda…", "loading");
  try {
    if (!THREE) THREE = await import(THREE_URL);
    setupRenderer();
    roofVisible = true;
    buildHouse(model);
  } catch (error) {
    console.error("BEKIUZ BUILD 3D preview error:", error);
    setStatus("3D ko‘rinish yuklanmadi. Internetni tekshiring; SVG chizma va hisob saqlanib qoladi.", "error");
  }
}

window.addEventListener("bekiuz:3d-plan", (event) => {
  showHouse(event.detail);
});

if (window.__BEKIUZ_BUILD_3D_PLAN__) {
  showHouse(window.__BEKIUZ_BUILD_3D_PLAN__);
}
