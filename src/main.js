import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

const frame = document.querySelector("#scene-frame");
const loading = document.querySelector("#scene-loading");
const errorBox = document.querySelector("#scene-error");
const distanceInput = document.querySelector("#camera-distance");
const rotationInput = document.querySelector("#character-rotation");
const distanceOutput = document.querySelector("#camera-value");
const rotationOutput = document.querySelector("#rotation-value");
const motionButton = document.querySelector("#motion-button");
const waveButton = document.querySelector("#wave-button");
const resetButton = document.querySelector("#reset-button");
const cameraButton = document.querySelector("#camera-button");

let renderer, controls, scene, camera, character, leftArm, rightArm, bodyGroup, modelMixer;
let motionEnabled = true;
let waveUntil = 0;
let frameId = 0;
const clock = new THREE.Clock();
const initialCameraPosition = new THREE.Vector3(5.4, 4.3, 6.5);
const initialTarget = new THREE.Vector3(0, 1.15, 0);

function material(color, roughness = 0.82, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
function mesh(geometry, mat, parent, position, scale) {
  const object = new THREE.Mesh(geometry, mat);
  if (position) object.position.set(...position);
  if (scale) object.scale.set(...scale);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
function box(parent, size, mat, position, rotation = [0, 0, 0]) {
  const object = mesh(new THREE.BoxGeometry(...size), mat, parent, position);
  object.rotation.set(...rotation);
  return object;
}
function cylinder(parent, radiusTop, radiusBottom, height, mat, position, segments = 10) {
  return mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), mat, parent, position);
}
function sphere(parent, radius, mat, position, scale = [1, 1, 1], segments = 14) {
  return mesh(new THREE.SphereGeometry(radius, segments, Math.max(8, segments - 2)), mat, parent, position, scale);
}

function makeTree(x, z, height, tint = 0x4c9c82) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  cylinder(group, 0.12, 0.2, height * 0.55, material(0x5c4b50), [0, height * 0.27, 0], 7);
  const leafMat = material(tint);
  sphere(group, height * 0.25, leafMat, [0, height * 0.55, 0], [1, 1.15, 0.92], 9);
  sphere(group, height * 0.19, material(tint === 0x4c9c82 ? 0x66b79a : 0x7f91c9), [height * 0.14, height * 0.72, 0.02], [1.1, 0.95, 1], 9);
  sphere(group, height * 0.16, leafMat, [-height * 0.16, height * 0.67, 0.08], [1, 1.1, 1], 9);
}
function makeLantern(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  const stone = material(0x707c92);
  box(group, [0.42, 0.12, 0.42], stone, [0, 0.08, 0]);
  box(group, [0.23, 0.55, 0.23], stone, [0, 0.39, 0]);
  box(group, [0.42, 0.36, 0.42], material(0x8995a8), [0, 0.82, 0]);
  box(group, [0.32, 0.22, 0.32], material(0xffd89b, 0.45), [0, 0.82, 0]);
  const roof = mesh(new THREE.ConeGeometry(0.36, 0.22, 4), material(0x59657b), group, [0, 1.11, 0]);
  roof.rotation.y = Math.PI / 4;
}
function createEnvironment() {
  const floor = mesh(new THREE.PlaneGeometry(100, 100), material(0x263c48), scene, [0, -0.08, 0]);
  floor.rotation.x = -Math.PI / 2;
  const island = mesh(new THREE.CircleGeometry(12, 48), material(0x365d58), scene, [0, -0.025, 0]);
  island.rotation.x = -Math.PI / 2;

  const pathMat = material(0x9ca7b5);
  for (let i = 0; i < 13; i++) {
    const stone = box(scene, [1.42, 0.08, 0.48], pathMat, [0, 0.015, 4.5 - i * 0.68]);
    stone.rotation.y = i % 2 ? 0.025 : -0.025;
  }

  const pond = mesh(new THREE.CircleGeometry(2.3, 40), new THREE.MeshStandardMaterial({
    color: 0x4aa5b2, roughness: 0.28, metalness: 0.12, transparent: true, opacity: 0.9
  }), scene, [-3.4, 0.015, 1.1]);
  pond.rotation.x = -Math.PI / 2;
  const pondRim = mesh(new THREE.RingGeometry(2.26, 2.48, 40), material(0x819c98), scene, [-3.4, 0.025, 1.1]);
  pondRim.rotation.x = -Math.PI / 2;

  const vermilion = material(0xb65c62);
  box(scene, [0.2, 2.2, 0.2], vermilion, [-0.95, 1.02, -5.2]);
  box(scene, [0.2, 2.2, 0.2], vermilion, [0.95, 1.02, -5.2]);
  box(scene, [2.55, 0.2, 0.35], vermilion, [0, 2.1, -5.2]);
  box(scene, [2.9, 0.16, 0.44], material(0x34354d), [0, 2.25, -5.2]);

  makeTree(-5.2, -3.1, 3.7, 0x4b8c7c);
  makeTree(4.5, -3.5, 4.1, 0x5a8e82);
  makeTree(5.4, 1.2, 3.2, 0x7189b8);
  makeTree(-5.2, 3.4, 3.4, 0x5c9d84);
  makeTree(-2.8, -5.8, 3.3, 0x7189b8);
  makeTree(3.1, -6.4, 3.5, 0x4c9c82);
  makeLantern(-2.1, 1.4);
  makeLantern(2.0, 1.3);

  for (let i = 0; i < 36; i++) {
    const angle = i * 2.399;
    const radius = 5.3 + (i % 5) * 0.52;
    const rock = sphere(scene, 0.12 + (i % 3) * 0.035, material(i % 2 ? 0x718a82 : 0x697b83),
      [Math.cos(angle) * radius, 0.02, Math.sin(angle) * radius], [1.5, 0.45, 0.9], 7);
    rock.castShadow = false;
  }
}

/* Enhanced anime character: layered hair, expressive eyes and coordinated outfit. */
/* Load the supplied rigged FBX model; retain the procedural character as a fallback. */
function createCharacter() {
  character = new THREE.Group();
  character.position.set(0, 0, 0);
  scene.add(character);

  const loader = new FBXLoader();
  loader.load(
    "./VentusHigh.fbx",
    (model) => {
      model.name = "VentusHighAnimeCharacter";
      model.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = false;
          object.receiveShadow = false;
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const mat of materials) {
              if (mat) {
                mat.side = THREE.DoubleSide;
                mat.needsUpdate = true;
              }
            }
          }
        }
      });

      let bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      if (!Number.isFinite(size.y) || size.y <= 0) throw new Error("FBX model has invalid dimensions");
      model.scale.setScalar(2.45 / size.y);
      bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.y -= bounds.min.y;
      model.position.z -= center.z;
      character.add(model);

      if (model.animations && model.animations.length) {
        modelMixer = new THREE.AnimationMixer(model);
        model.animations.forEach((clip) => modelMixer.clipAction(clip).play());
      }
      if (loading) {
        loading.classList.add("done");
        window.setTimeout(() => { loading.hidden = true; }, 450);
      }
    },
    undefined,
    (error) => {
      console.error("Could not load VentusHigh.fbx; using the built-in character.", error);
      createProceduralCharacter();
      if (loading) loading.hidden = true;
    }
  );
}

function createProceduralCharacter() {
  character = new THREE.Group();
  character.position.set(0, 0, 0);
  scene.add(character);

  const skin = material(0xffd5c4, 0.92);
  const skinShadow = material(0xe9a99e, 0.95);
  const hair = material(0x25243b, 0.72);
  const hairLight = material(0x514b79, 0.7);
  const hairHighlight = material(0x8279b9, 0.65);
  const jacket = material(0x7568c8, 0.82);
  const jacketShade = material(0x504b91, 0.9);
  const jacketLight = material(0xb5aaff, 0.7);
  const shirt = material(0xf5f0ff, 0.85);
  const pants = material(0x30344e, 0.88);
  const shoes = material(0x24263d, 0.8);
  const sole = material(0xaaa8c4, 0.8);
  const white = material(0xfffbff, 0.55);
  const iris = material(0x38c8c4, 0.35);
  const irisLight = material(0x9af5e7, 0.35);
  const pupil = material(0x17243a, 0.35);
  const blush = new THREE.MeshStandardMaterial({ color: 0xf28f9f, roughness: 1, transparent: true, opacity: 0.78 });
  const accent = material(0x72e1d7, 0.5);
  const gold = material(0xffd99b, 0.45, 0.12);

  bodyGroup = new THREE.Group();
  character.add(bodyGroup);
  cylinder(character, 0.095, 0.105, 0.22, skin, [0, 1.48, 0], 14);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.145, 0.79, 0);
  character.add(leftLeg);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.145, 0.79, 0);
  character.add(rightLeg);
  for (const leg of [leftLeg, rightLeg]) {
    sphere(leg, 0.13, pants, [0, -0.16, 0], [0.9, 1.5, 0.95], 14);
    cylinder(leg, 0.105, 0.115, 0.36, pants, [0, -0.39, 0], 12);
    cylinder(leg, 0.112, 0.112, 0.055, jacketLight, [0, -0.55, 0], 12);
    sphere(leg, 0.125, shoes, [0, -0.61, 0.055], [1, 0.58, 1.55], 14);
    sphere(leg, 0.12, sole, [0, -0.665, 0.06], [1, 0.18, 1.5], 12);
  }

  sphere(bodyGroup, 0.31, shirt, [0, 1.12, 0], [0.88, 1.15, 0.64], 20);
  sphere(bodyGroup, 0.34, jacket, [-0.155, 1.12, 0], [0.52, 1.12, 0.67], 18);
  sphere(bodyGroup, 0.34, jacket, [0.155, 1.12, 0], [0.52, 1.12, 0.67], 18);
  box(bodyGroup, [0.105, 0.48, 0.075], jacketLight, [-0.105, 1.30, 0.286], [0, 0, -0.23]);
  box(bodyGroup, [0.105, 0.48, 0.075], jacketLight, [0.105, 1.30, 0.286], [0, 0, 0.23]);
  sphere(bodyGroup, 0.17, jacketShade, [0, 1.43, 0.02], [1.15, 0.52, 0.95], 14);
  cylinder(bodyGroup, 0.024, 0.024, 0.28, accent, [-0.065, 1.24, 0.32], 8);
  cylinder(bodyGroup, 0.024, 0.024, 0.28, accent, [0.065, 1.24, 0.32], 8);
  sphere(bodyGroup, 0.035, gold, [0, 1.02, 0.32], [1, 1, 0.45], 8);
  box(bodyGroup, [0.38, 0.055, 0.045], jacketShade, [0, 0.86, 0.29]);
  sphere(bodyGroup, 0.07, accent, [-0.18, 1.17, 0.305], [1, 1.2, 0.3], 10);
  sphere(bodyGroup, 0.035, white, [-0.18, 1.17, 0.326], [1, 1, 0.35], 8);

  leftArm = new THREE.Group();
  leftArm.position.set(-0.31, 1.32, 0);
  character.add(leftArm);
  rightArm = new THREE.Group();
  rightArm.position.set(0.31, 1.32, 0);
  character.add(rightArm);
  for (const [arm, side] of [[leftArm, -1], [rightArm, 1]]) {
    sphere(arm, 0.145, jacket, [0, -0.12, 0], [0.92, 1.12, 0.95], 14);
    cylinder(arm, 0.105, 0.09, 0.33, jacket, [0, -0.34, 0], 12);
    sphere(arm, 0.095, jacketLight, [0, -0.50, 0], [1, 0.62, 1], 12);
    cylinder(arm, 0.075, 0.082, 0.24, skin, [0, -0.64, 0], 12);
    sphere(arm, 0.085, skin, [0, -0.77, 0.015], [0.92, 0.92, 0.9], 12);
    box(arm, [0.145, 0.055, 0.15], accent, [0, -0.51, 0.005], [0, 0, side * 0.04]);
  }

  const head = new THREE.Group();
  head.position.set(0, 1.91, 0);
  character.add(head);
  sphere(head, 0.405, skin, [0, 0, 0], [0.91, 1.05, 0.81], 24);
  for (const side of [-1, 1]) {
    sphere(head, 0.105, skin, [side * 0.355, -0.035, 0], [0.7, 1.05, 0.62], 12);
    sphere(head, 0.045, skinShadow, [side * 0.374, -0.04, 0.037], [0.65, 1, 0.45], 10);
  }
  sphere(head, 0.425, hair, [0, 0.19, -0.065], [1.04, 0.88, 0.94], 20);
  for (const side of [-1, 1]) {
    sphere(head, 0.17, hair, [side * 0.335, -0.13, -0.005], [0.75, 1.25, 0.82], 12);
    sphere(head, 0.135, hairLight, [side * 0.325, -0.32, 0.045], [0.68, 1.05, 0.65], 12);
  }
  sphere(head, 0.24, hairLight, [-0.23, 0.22, 0.245], [0.93, 0.88, 0.66], 14);
  sphere(head, 0.23, hair, [0.02, 0.20, 0.285], [0.88, 0.95, 0.62], 14);
  sphere(head, 0.22, hairLight, [0.245, 0.19, 0.24], [0.82, 0.9, 0.64], 14);
  for (const [x, y, z, rx, ry, rz] of [
    [-0.30, 0.31, 0.17, -0.22, 0.05, 0.18],
    [-0.13, 0.39, 0.18, -0.10, 0.02, 0.08],
    [0.08, 0.38, 0.19, 0.12, 0.02, -0.05],
    [0.27, 0.30, 0.16, 0.25, -0.04, -0.16],
    [0.0, 0.47, 0.02, 0.03, 0.0, 0.0]
  ]) {
    const tuft = mesh(new THREE.ConeGeometry(0.14, 0.34, 7), hair, head, [x, y, z]);
    tuft.rotation.set(rx, ry, rz);
  }
  sphere(head, 0.09, hairHighlight, [-0.20, 0.33, 0.24], [1.2, 0.22, 0.24], 10);
  sphere(head, 0.07, hairLight, [0.08, 0.39, 0.17], [1.1, 0.2, 0.22], 10);

  for (const x of [-0.155, 0.155]) {
    const eye = new THREE.Group();
    eye.position.set(x, -0.055, 0.315);
    head.add(eye);
    sphere(eye, 0.105, hair, [0, 0, -0.012], [1.12, 1.28, 0.52], 14);
    sphere(eye, 0.088, white, [0, -0.006, 0.012], [1.02, 1.17, 0.54], 14);
    sphere(eye, 0.061, iris, [0.005, -0.012, 0.044], [0.88, 1.06, 0.56], 14);
    sphere(eye, 0.032, pupil, [0.005, -0.013, 0.071], [0.9, 1.05, 0.5], 12);
    sphere(eye, 0.022, irisLight, [-0.018, 0.016, 0.082], [1, 1, 0.45], 10);
    sphere(eye, 0.012, white, [0.022, -0.039, 0.083], [1, 1, 0.45], 8);
    box(eye, [0.19, 0.027, 0.025], hair, [0, 0.088, 0.023], [0, 0, x < 0 ? -0.08 : 0.08]);
  }
  box(head, [0.14, 0.025, 0.03], hair, [-0.16, 0.095, 0.32], [0, 0, -0.09]);
  box(head, [0.14, 0.025, 0.03], hair, [0.16, 0.095, 0.32], [0, 0, 0.09]);
  sphere(head, 0.022, skinShadow, [0, -0.105, 0.329], [0.7, 0.75, 0.4], 8);
  sphere(head, 0.052, blush, [-0.245, -0.17, 0.28], [1.25, 0.5, 0.3], 10);
  sphere(head, 0.052, blush, [0.245, -0.17, 0.28], [1.25, 0.5, 0.3], 10);
  sphere(head, 0.036, material(0xb95775), [0, -0.225, 0.302], [1.25, 0.45, 0.35], 10);
  box(head, [0.12, 0.045, 0.035], accent, [-0.29, 0.19, 0.285], [0, 0, -0.42]);
  sphere(head, 0.025, gold, [-0.34, 0.16, 0.29], [1, 1, 0.4], 8);
}

function init() {
  try {
    if (!frame) throw new Error("Missing #scene-frame element");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9bbbd0);
    scene.fog = new THREE.Fog(0x9bbbd0, 15, 34);
    camera = new THREE.PerspectiveCamera(43, frame.clientWidth / Math.max(1, frame.clientHeight), 0.1, 100);
    camera.position.copy(initialCameraPosition);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    renderer.setSize(frame.clientWidth, frame.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute("aria-label", "مشهد أنمي ثلاثي الأبعاد. اسحب لتدوير الكاميرا واستخدم إصبعين للتقريب.");
    frame.prepend(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xd8edff, 0x3b4a4e, 2.1));
    const sun = new THREE.DirectionalLight(0xffe1c1, 2.3);
    sun.position.set(-4, 8, 5);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x9b9aff, 1.2);
    rim.position.set(5, 4, -5);
    scene.add(rim);

    createEnvironment();
    createCharacter();
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(initialTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = 4.5;
    controls.maxDistance = 12;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.enablePan = false;
    controls.update();

    if (distanceInput) distanceInput.addEventListener("input", () => {
      const value = Number(distanceInput.value);
      if (distanceOutput) {
        distanceOutput.value = value.toFixed(1);
        distanceOutput.textContent = value.toFixed(1);
      }
      const direction = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).addScaledVector(direction, value);
      controls.update();
    });
    if (rotationInput) rotationInput.addEventListener("input", () => {
      const value = Number(rotationInput.value);
      character.rotation.y = THREE.MathUtils.degToRad(value);
      if (rotationOutput) {
        rotationOutput.value = value + "°";
        rotationOutput.textContent = value + "°";
      }
    });
    motionButton?.addEventListener("click", toggleMotion);
    waveButton?.addEventListener("click", wave);
    resetButton?.addEventListener("click", resetAll);
    cameraButton?.addEventListener("click", resetCamera);
    window.addEventListener("resize", onResize, { passive: true });

    if (loading) {
      loading.classList.add("done");
      window.setTimeout(() => { loading.hidden = true; }, 450);
    }
    animate();
  } catch (error) {
    console.error("ANIMEVERSE initialization failed:", error);
    if (loading) loading.hidden = true;
    if (errorBox) errorBox.hidden = false;
  }
}
function onResize() {
  if (!renderer || !camera || !frame) return;
  const width = Math.max(1, frame.clientWidth);
  const height = Math.max(1, frame.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
}
function toggleMotion() {
  motionEnabled = !motionEnabled;
  if (motionButton) {
    motionButton.setAttribute("aria-pressed", String(motionEnabled));
    const label = motionButton.querySelector("span:last-child");
    if (label) label.textContent = motionEnabled ? "إيقاف الحركة" : "تشغيل الحركة";
  }
}
function wave() {
  waveUntil = clock.elapsedTime + 2.4;
}
function resetCamera() {
  if (!camera || !controls) return;
  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialTarget);
  controls.update();
  if (distanceInput) distanceInput.value = "7.5";
  if (distanceOutput) {
    distanceOutput.value = "7.5";
    distanceOutput.textContent = "7.5";
  }
}
function resetAll() {
  if (character) character.rotation.y = 0;
  if (rotationInput) rotationInput.value = "0";
  if (rotationOutput) {
    rotationOutput.value = "0°";
    rotationOutput.textContent = "0°";
  }
  resetCamera();
  motionEnabled = true;
  if (motionButton) {
    motionButton.setAttribute("aria-pressed", "true");
    const label = motionButton.querySelector("span:last-child");
    if (label) label.textContent = "إيقاف الحركة";
  }
}
function animate() {
  frameId = requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;
  if (modelMixer) modelMixer.update(delta);
  if (character) {
    if (motionEnabled) {
      character.position.y = Math.sin(elapsed * 1.7) * 0.035;
      character.rotation.z = Math.sin(elapsed * 0.9) * 0.012;
      if (bodyGroup) bodyGroup.rotation.z = Math.sin(elapsed * 1.4) * 0.018;
      if (leftArm) leftArm.rotation.x = Math.sin(elapsed * 1.5) * 0.045;
      if (rightArm) rightArm.rotation.x = Math.sin(elapsed * 1.5 + 1) * 0.045;
    } else {
      character.position.y = THREE.MathUtils.lerp(character.position.y, 0, 0.08);
      character.rotation.z = THREE.MathUtils.lerp(character.rotation.z, 0, 0.08);
      if (bodyGroup) bodyGroup.rotation.z = THREE.MathUtils.lerp(bodyGroup.rotation.z, 0, 0.08);
    }
    if (rightArm && elapsed < waveUntil) {
      rightArm.rotation.x = -2.25 + Math.sin(elapsed * 13) * 0.18;
      rightArm.rotation.z = -0.55;
    } else if (rightArm) {
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0, 0.12);
    }
  }
  controls?.update();
  renderer?.render(scene, camera);
}
window.addEventListener("pagehide", () => cancelAnimationFrame(frameId), { once: true });
init();