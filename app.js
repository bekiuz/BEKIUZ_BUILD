import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/controls/OrbitControls.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const defaults = { plotWidth: 20, plotLength: 30, houseWidth: 10, houseLength: 14, floors: 1, rooms: 3, roofType: "gable" };
const state = Object.assign({}, defaults);
const rates = {
  concrete: { name: "Beton (demo hajm)", unit: "m³", price: 950000, icon: "▧" },
  brick: { name: "G‘isht", unit: "dona", price: 1300, icon: "▤" },
  rebar: { name: "Armatura", unit: "kg", price: 11500, icon: "⌁" },
  roof: { name: "Tom materiali", unit: "m²", price: 170000, icon: "⌂" },
  windows: { name: "Deraza va eshiklar", unit: "m²", price: 850000, icon: "▣" },
  wiring: { name: "Elektr kabeli", unit: "m", price: 3500, icon: "ϟ" },
  pipes: { name: "Suv quvurlari", unit: "m", price: 14000, icon: "⌇" },
  finish: { name: "Ichki pardoz (demo)", unit: "m²", price: 120000, icon: "▦" }
};
const initialRates = {};
Object.keys(rates).forEach((key) => initialRates[key] = rates[key].price);
const money = (n) => new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(n))) + " so‘m";
const fmt = (n, digits = 1) => new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: digits }).format(n);
const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || min));

function calculate() {
  const w = state.houseWidth, l = state.houseLength, floors = state.floors;
  const footprint = w * l;
  const floorArea = footprint * floors;
  const perimeter = 2 * (w + l);
  const wallArea = perimeter * 2.85 * floors * 0.84;
  // These simple assumptions are for a visual demo only, not structural design.
  const concrete = footprint * 0.12 * floors + perimeter * 0.20 * 0.45;
  const quantities = {
    concrete: concrete,
    brick: Math.ceil(wallArea * 52),
    rebar: Math.ceil(concrete * 75),
    roof: footprint * (state.roofType === "gable" ? 1.18 : 1.05),
    windows: Math.max(8, wallArea * 0.12),
    wiring: Math.ceil(floorArea * 4),
    pipes: Math.ceil(floorArea * 1.1),
    finish: floorArea * 2.8
  };
  const totals = {};
  let total = 0;
  Object.keys(quantities).forEach((key) => { totals[key] = quantities[key] * rates[key].price; total += totals[key]; });
  return { plotArea: state.plotWidth * state.plotLength, footprint, floorArea, perimeter, roofArea: quantities.roof, quantities, totals, total };
}

function syncInputs() {
  ["plotWidth", "plotLength", "houseWidth", "houseLength"].forEach((id) => {
    state[id] = clamp($("#" + id).value, id === "plotLength" ? 8 : 4, id === "plotWidth" ? 100 : id === "plotLength" ? 200 : id === "houseWidth" ? 30 : 40);
  });
  state.houseWidth = Math.min(state.houseWidth, Math.max(4, state.plotWidth - 2));
  state.houseLength = Math.min(state.houseLength, Math.max(4, state.plotLength - 2));
  const footprint = state.houseWidth * state.houseLength;
  if (footprint > state.plotWidth * state.plotLength * 0.8) {
    const scale = Math.sqrt(state.plotWidth * state.plotLength * 0.8 / footprint);
    state.houseWidth = Math.max(4, state.houseWidth * scale);
    state.houseLength = Math.max(4, state.houseLength * scale);
  }
  $("#houseWidth").value = Number(state.houseWidth.toFixed(1));
  $("#houseLength").value = Number(state.houseLength.toFixed(1));
  return calculate();
}

function makePlan(est) {
  const svg = $("#floorPlanSvg"), x = 58, y = 41, w = 444, h = 322;
  const templates = {
    2: [["MEHMONXONA",0,0,.58,.53],["OSHXONA",.58,0,.42,.53],["YOTOQXONA",0,.53,.62,.47],["SANUZEL",.62,.53,.38,.47]],
    3: [["MEHMONXONA",0,0,.57,.55],["OSHXONA",.57,0,.43,.55],["YOTOQ 1",0,.55,.34,.45],["YOTOQ 2",.34,.55,.34,.45],["SANUZEL",.68,.55,.32,.45]],
    4: [["MEHMONXONA",0,0,.52,.52],["OSHXONA",.52,0,.48,.52],["YOTOQ 1",0,.52,.32,.48],["YOTOQ 2",.32,.52,.32,.48],["YOTOQ 3",.64,.52,.36,.48]],
    5: [["MEHMONXONA",0,0,.5,.5],["OSHXONA",.5,0,.5,.5],["YOTOQ 1",0,.5,.25,.5],["YOTOQ 2",.25,.5,.25,.5],["YOTOQ 3",.5,.5,.25,.5],["YOTOQ 4",.75,.5,.25,.5]]
  };
  const blocks = templates[state.rooms] || templates[3];
  let rooms = "";
  blocks.forEach((r, i) => {
    const bx = x + r[1] * w, by = y + r[2] * h, bw = r[3] * w, bh = r[4] * h;
    rooms += '<g><rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" fill="' + ["#fdfefb","#f2f6ec","#e9f0df"][i % 3] + '" stroke="#71835d" stroke-width="3"/><text x="' + (bx+bw/2) + '" y="' + (by+bh/2-3) + '" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="' + (bw < 95 ? 8 : 10) + '" font-weight="700" fill="#536746">' + r[0] + '</text><text x="' + (bx+bw/2) + '" y="' + (by+bh/2+13) + '" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="9" fill="#8a9880">' + fmt(est.footprint*r[3]*r[4],1) + ' m²</text></g>';
  });
  svg.innerHTML = '<defs><pattern id="planGrid" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M 12 0 L 0 0 0 12" fill="none" stroke="#dfe8d6" stroke-width=".6"/></pattern></defs><rect width="560" height="420" fill="url(#planGrid)" rx="10"/><text x="58" y="23" font-size="9" font-family="DM Sans,sans-serif" font-weight="700" letter-spacing="1.4" fill="#869579">NAMUNAVIY QAVAT REJASI</text><text x="502" y="23" text-anchor="end" font-size="9" font-family="DM Sans,sans-serif" fill="#7b8c6f">' + state.houseWidth + ' × ' + state.houseLength + ' m</text>' + rooms + '<path d="M 58 383 H 502 M 58 379 V 387 M 502 379 V 387" stroke="#8b9f75" stroke-width="1"/><text x="280" y="399" text-anchor="middle" font-size="10" font-family="DM Sans,sans-serif" fill="#708363">' + state.houseWidth + ' m</text><path d="M 521 41 V 363 M 517 41 H 525 M 517 363 H 525" stroke="#8b9f75" stroke-width="1"/><text x="536" y="203" text-anchor="middle" transform="rotate(90 536 203)" font-size="10" font-family="DM Sans,sans-serif" fill="#708363">' + state.houseLength + ' m</text>';
}

function drawMaterials(est) {
  const order = ["concrete","brick","rebar","roof","windows","wiring","pipes","finish"];
  $("#materialList").innerHTML = order.map((key) => {
    const item = rates[key], q = est.quantities[key];
    const qty = key === "brick" ? fmt(q,0) + " dona" : key === "rebar" ? fmt(q,0) + " kg" : fmt(q,1) + " " + item.unit;
    return '<div class="material-row"><div class="material-name"><span class="material-swatch">' + item.icon + '</span><div><span>' + item.name + '</span><small>' + qty + '</small></div></div><label class="price-cell"><span>1 ' + item.unit + ' narxi</span><input type="number" min="0" step="1000" data-price="' + key + '" value="' + item.price + '" aria-label="' + item.name + ' birligi narxi (so‘m)"></label><div class="amount"><span data-total="' + key + '">' + money(est.totals[key]) + '</span><small>jami</small></div></div>';
  }).join("");
}

function updateSummary(est) {
  $("#plotArea").textContent = fmt(est.plotArea,1) + " m²";
  $("#heroArea").textContent = fmt(est.floorArea,1) + " m²";
  $("#heroCost").textContent = money(est.total);
  $("#modelDimensions").textContent = state.houseWidth + " × " + state.houseLength + " m · " + state.floors + " qavat";
  $("#planDimensions").textContent = fmt(est.floorArea,1) + " m²";
  $("#summaryArea").textContent = fmt(est.floorArea,1) + " m²";
  $("#summaryFloors").textContent = state.floors + " qavat";
  $("#summaryRooms").textContent = (state.rooms === 5 ? "5+" : state.rooms) + " ta";
  $("#summaryRoof").textContent = fmt(est.roofArea,1) + " m²";
  $("#summaryCost").textContent = money(est.total);
}

function mat(color, roughness = .85) {
  return new THREE.MeshStandardMaterial({ color: color, roughness: roughness });
}
function box(group, x,y,z,sx,sy,sz, material, rot = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  m.position.set(x,y,z); m.rotation.y = rot; m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
}
function makeHouse(config) {
  const g = new THREE.Group(), w = config.width, l = config.length, floors = config.floors, story = 2.85, wallH = 2.69, top = floors * story;
  const plaster = mat("#f5f1e7"), side = mat("#deded0"), base = mat("#b5b9aa"), roof = mat("#465d43",.7), darkRoof = mat("#354a33",.65), frame = mat("#fbf7ec"), door = mat("#86684c"), floor = mat("#d2d4c6"), partition = mat("#cfd4c5"), bed = mat("#b5c8a0"), furniture = mat("#c6b49b");
  const glass = new THREE.MeshStandardMaterial({ color:"#a6ceda", roughness:.24, transparent:true, opacity:.86 });
  box(g,0,.07,0,w+.5,.14,l+.5,base);
  for (let f=0; f<floors; f++) {
    const y0=f*story, cy=y0+wallH/2+.17, t=.18, fz=-l/2-.055, ww=Math.min(1.5,w*.16), wh=1.0, wy=y0+1.65;
    box(g,0,y0+.17,0,w,.1,l,floor);
    box(g,0,cy,-l/2+t/2,w,wallH,t,plaster);
    box(g,0,cy,l/2-t/2,w,wallH,t,side);
    box(g,-w/2+t/2,cy,0,t,wallH,l,side);
    box(g,w/2-t/2,cy,0,t,wallH,l,plaster);
    box(g,0,y0+1.02,fz,Math.min(1.05,w*.12),1.95,.07,door);
    box(g,0,y0+2.06,fz-.045,Math.min(1.12,w*.125),.08,.09,frame);
    [-w*.29,w*.02,w*.31].forEach((wx)=>{
      if(Math.abs(wx)<.9)return;
      box(g,wx,wy,fz-.025,ww+.16,wh+.16,.075,frame);
      box(g,wx,wy,fz-.07,ww,wh,.08,glass);
      box(g,wx,wy,fz-.12,.045,wh,.025,frame);
      box(g,wx,wy,fz-.12,ww,.045,.025,frame);
    });
    [-w*.25,w*.25].forEach((wx)=>box(g,wx,wy,l/2+.03,ww,wh,.06,glass));
    [-l*.25,l*.25].forEach((z)=>{box(g,-w/2-.03,wy,z,.06,wh,Math.min(1.4,l*.15),glass);box(g,w/2+.03,wy,z,.06,wh,Math.min(1.4,l*.15),glass);});
    const ph=wallH*.77;
    if(config.rooms>=3){box(g,-w*.08,y0+.18+ph/2,0,.10,ph,l*.85,partition);box(g,w*.08,y0+.18+ph/2,l*.08,w*.75,ph,.10,partition);}
    if(config.rooms>=4)box(g,-w*.22,y0+.18+ph/2,l*.20,.10,ph,l*.42,partition);
    box(g,-w*.27,y0+.49,l*.25,Math.min(1.8,w*.22),.38,Math.min(2.15,l*.2),bed);
    box(g,w*.24,y0+.38,-l*.17,Math.min(1.3,w*.16),.24,Math.min(1,l*.1),furniture);
  }
  if(config.roofType==="gable"){
    const rise=Math.max(1.1,Math.min(2.1,w*.17)), half=w/2, sl=Math.sqrt(half*half+rise*rise)+.25, a=Math.atan2(rise,half);
    box(g,-w/4,top+rise/2+.12,0,sl,.16,l+.8,roof,a);
    box(g,w/4,top+rise/2+.12,0,sl,.16,l+.8,roof,-a);
    box(g,0,top+rise/2,-l/2-.015,w,rise,.10,plaster);
    box(g,0,top+rise/2,l/2+.015,w,rise,.10,side);
    box(g,0,top+rise+.15,0,.12,.12,l+.92,darkRoof);
  } else {
    box(g,0,top+.15,0,w+.45,.22,l+.45,roof);
    box(g,0,top+.28,0,w+.22,.08,l+.22,darkRoof);
  }
  return g;
}
function createWorld(canvas, hero) {
  const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene(); scene.background=new THREE.Color("#e5ecdb"); scene.fog=new THREE.Fog("#e5ecdb",35,90);
  const camera=new THREE.PerspectiveCamera(36,1,.1,160);
  scene.add(new THREE.HemisphereLight("#ffffff","#b1bea3",2));
  const sun=new THREE.DirectionalLight("#fff6df",2.5); sun.position.set(12,20,-8); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),mat("#dce5d2")); ground.rotation.x=-Math.PI/2; ground.position.y=-.06; ground.receiveShadow=true; scene.add(ground);
  const grid=new THREE.GridHelper(50,50,"#bdceb0","#cbd8c0"); grid.position.y=-.045; grid.material.transparent=true; grid.material.opacity=.34; scene.add(grid);
  const model=new THREE.Group(); scene.add(model);
  let controls=null;
  if(!hero){controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.07;controls.minPolarAngle=.18;controls.maxPolarAngle=Math.PI*.48;controls.target.set(0,1.6,0);}
  function resize(){const r=canvas.parentElement.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(1,r.width)/Math.max(1,r.height);camera.updateProjectionMatrix();}
  function rebuild(c){
    model.clear();
    model.add(makeHouse(c));
    const max=Math.max(c.width,c.length), distance=Math.max(19,max*(hero?1.55:1.7));
    camera.position.set(distance*.92,Math.max(10,max*.85),distance*.9); camera.near=.1;camera.far=200;camera.updateProjectionMatrix();
    if(controls){controls.target.set(0,c.floors*1.25,0);controls.minDistance=Math.max(8,max*.65);controls.maxDistance=Math.max(42,max*3.2);controls.update();}
    else camera.lookAt(0,c.floors*1.25,0);
  }
  const ro=new ResizeObserver(resize);ro.observe(canvas.parentElement);window.addEventListener("resize",resize);resize();
  let spin=0;renderer.setAnimationLoop(()=>{if(controls)controls.update();else model.rotation.y=Math.sin((spin+=.002)*.22)*.07;renderer.render(scene,camera);});
  return {rebuild:rebuild,dispose:()=>{renderer.setAnimationLoop(null);ro.disconnect();window.removeEventListener("resize",resize);if(controls)controls.dispose();renderer.dispose();}};
}

let heroWorld=null, mainWorld=null;
function updateAll(rebuildMaterials=true){
  const est=syncInputs();updateSummary(est);makePlan(est);
  if(rebuildMaterials)drawMaterials(est);
  const config={width:state.houseWidth,length:state.houseLength,floors:state.floors,roofType:state.roofType,rooms:state.rooms};
  if(mainWorld)mainWorld.rebuild(config);
  if(heroWorld)heroWorld.rebuild({width:Math.min(12,state.houseWidth),length:Math.min(16,state.houseLength),floors:state.floors,roofType:state.roofType,rooms:state.rooms});
}
function activateView(view){
  $$(".preview-tab").forEach(b=>{const active=b.dataset.view===view;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
  $$(".view-panel").forEach(p=>p.classList.remove("active"));
  const map={"3d":"#view3d","plan":"#viewPlan","materials":"#viewMaterials"};$(map[view]).classList.add("active");
  if(view==="3d")window.dispatchEvent(new Event("resize"));
}
function setupEvents(){
  ["plotWidth","plotLength","houseWidth","houseLength"].forEach((id)=>{
    $("#"+id).addEventListener("input",()=>updateAll(false));
    $("#"+id).addEventListener("change",()=>updateAll(true));
  });
  $$(".segment").forEach(b=>b.addEventListener("click",()=>{state.floors=Number(b.dataset.floors);$$(".segment").forEach(x=>x.classList.toggle("active",x===b));updateAll(true);}));
  $$("#roomOptions button").forEach(b=>b.addEventListener("click",()=>{state.rooms=Number(b.dataset.rooms);$$("#roomOptions button").forEach(x=>x.classList.toggle("active",x===b));updateAll(true);}));
  $("#roofType").addEventListener("change",e=>{state.roofType=e.target.value;updateAll(true);});
  $("#projectForm").addEventListener("submit",e=>{e.preventDefault();updateAll(true);$("#planner").scrollIntoView({behavior:"smooth",block:"start"});});
  $$(".preview-tab").forEach(b=>b.addEventListener("click",()=>activateView(b.dataset.view)));
  $("#materialList").addEventListener("input",e=>{
    if(!e.target.matches("[data-price]"))return;
    const key=e.target.dataset.price;rates[key].price=clamp(e.target.value,0,1000000000);
    const est=calculate();updateSummary(est);
    const total=$('[data-total="'+key+'"]');if(total)total.textContent=money(est.totals[key]);
  });
  $("#resetBtn").addEventListener("click",()=>{
    Object.assign(state,defaults);["plotWidth","plotLength","houseWidth","houseLength"].forEach(id=>$("#"+id).value=state[id]);$("#roofType").value=state.roofType;
    Object.keys(rates).forEach(k=>rates[k].price=initialRates[k]);
    $$(".segment").forEach(b=>b.classList.toggle("active",Number(b.dataset.floors)===state.floors));
    $$("#roomOptions button").forEach(b=>b.classList.toggle("active",Number(b.dataset.rooms)===state.rooms));
    updateAll(true);activateView("3d");
  });
  $("#downloadBtn").addEventListener("click",()=>window.print());
  $("#mobileMenu").addEventListener("click",()=>{$(".main-nav").classList.toggle("open");});
  $$(".main-nav a").forEach(a=>a.addEventListener("click",()=>$(".main-nav").classList.remove("open")));
}
function init(){
  setupEvents();const est=syncInputs();updateSummary(est);makePlan(est);drawMaterials(est);
  try{
    heroWorld=createWorld($("#heroCanvas"),true);mainWorld=createWorld($("#modelCanvas"),false);
    $("#modelLoading").classList.add("hidden");setTimeout(()=>$("#modelLoading")&&$("#modelLoading").remove(),650);
    updateAll(false);
  }catch(error){
    console.error("3D preview initialization failed",error);
    const loading=$("#modelLoading");if(loading)loading.textContent="3D ko‘rinish uchun internet, WebGL va mos brauzer kerak.";
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
