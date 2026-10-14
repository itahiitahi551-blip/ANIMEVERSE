import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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

let renderer;
let controls;
let scene;
let camera;
let character;
let leftArm;
let rightArm;
let bodyGroup;
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
  const top = new THREE.ConeGeometry(0.36, 0.22, 4);
  const roof = mesh(top, material(0x59657b), group, [0, 1.11, 0]);
  roof.rotation.y = Math.PI / 4;
}
function createEnvironment() {
  const floor = mesh(new THREE.PlaneGeometry(100, 100), material(0x263c48), scene, [0, -0.08, 0]);
  floor.rotation.x = -Math.PI / 2;
  const island = mesh(new THREE.CircleGeometry(12, 48), material(0x365d58), scene, [0, -0.025, 0]);
  island.rotation.x = -Math.PI / 2;

  // Pale stone walkway, laid in short sections for a stylized garden path.
  const pathMat = material(0x9ca7b5);
  for (let i = 0; i < 13; i++) {
    const z = 4.5 - i * 0.68;
    const stone = box(scene, [1.42, 0.08, 0.48], pathMat, [0, 0.015, z]);
    stone.rotation.y = (i % 2 ? 0.025 : -0.025);
  }

  // Pond with a layered, softly reflective surface.
  const pond = mesh(new THREE.CircleGeometry(2.3, 40), new THREE.MeshStandardMaterial({
    color: 0x4aa5b2, roughness: 0.28, metalness: 0.12, transparent: true, opacity: 0.9
  }), scene, [-3.4, 0.015, 1.1]);
  pond.rotation.x = -Math.PI / 2;
  const pondRim = mesh(new THREE.RingGeometry(2.26, 2.48, 40), material(0x819c98), scene, [-3.4, 0.025, 1.1]);
  pondRim.rotation.x = -Math.PI / 2;

  // A simple torii gate in the distance.
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

  // Small stones around the garden.
  for (let i = 0; i < 36; i++) {
    const angle = i * 2.399;
    const radius = 5.3 + (i % 5) * 0.52;
    const rock = sphere(scene, 0.12 + (i % 3) * 0.035, material(i % 2 ? 0x718a82 : 0x697b83), [Math.cos(angle) * radius, 0.02, Math.sin(angle) * radius], [1.5, 0.45, 0.9], 7);
    rock.castShadow = false;
  }
}
function createCharacter() {
  character = new THREE.Group();
  character.position.set(0, 0, 0);
  scene.add(character);

  const skin = material(0xffd5bf);
  const hair = material(0x29263e);
  const hairLight = material(0x494267);
  const jacket = material(0x7469c9);
  const jacketLight = material(0x9d91ed);
  const dark = material(0x292f49);
  const shoes = material(0x20263b);
  const white = material(0xf7f5ff);
  const iris = material(0x4dcac4, 0.4);
  const blush = new THREE.MeshStandardMaterial({ color: 0xf59aa5, roughness: 1 });

  // Body and legs. Each limb is a group so later animation can target joints.
  bodyGroup = new THREE.Group();
  character.add(bodyGroup);
  sphere(bodyGroup, 0.34, jacket, [0, 1.05, 0], [0.8, 1.12, 0.52], 18);
  box(bodyGroup, [0.38, 0.1, 0.06], jacketLight, [0, 1.15, 0.27]);
  sphere(bodyGroup, 0.15, skin, [0, 1.47, 0], [0.85, 0.8, 0.82], 14);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.13, 0.78, 0);
  character.add(leftLeg);
  cylinder(leftLeg, 0.105, 0.12, 0.56, dark, [0, -0.25, 0], 10);
  sphere(leftLeg, 0.12, shoes, [0, -0.52, 0.07], [1.1, 0.55, 1.5], 10);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.13, 0.78, 0);
  character.add(rightLeg);
  cylinder(rightLeg, 0.105, 0.12, 0.56, dark, [0, -0.25, 0], 10);
  sphere(rightLeg, 0.12, shoes, [0, -0.52, 0.07], [1.1, 0.55, 1.5], 10);

  leftArm = new THREE.Group();
  leftArm.position.set(-0.29, 1.28, 0);
  character.add(leftArm);
  sphere(leftArm, 0.13, jacket, [0, -0.12, 0], [0.9, 1.1, 0.9], 12);
  cylinder(leftArm, 0.085, 0.09, 0.48, jacket, [0, -0.37, 0], 10);
  sphere(leftArm, 0.085, skin, [0, -0.64, 0.015], [0.9, 0.9, 0.9], 10);

  rightArm = new THREE.Group();
  rightArm.position.set(0.29, 1.28, 0);
  character.add(rightArm);
  sphere(rightArm, 0.13, jacket, [0, -0.12, 0], [0.9, 1.1, 0.9], 12);
  cylinder(rightArm, 0.085, 0.09, 0.48, jacket, [0, -0.37, 0], 10);
  sphere(rightArm, 0.085, skin, [0, -0.64, 0.015], [0.9, 0.9, 0.9], 10);

  // Oversized anime head, neck and face.
  cylinder(character, 0.09, 0.1, 0.18, skin, [0, 1.55, 0], 10);
  sphere(character, 0.42, skin, [0, 1.91, 0], [0.9, 1.04, 0.8], 20);
  sphere(character, 0.43, hair, [0, 2.13, -0.04], [1.03, 0.82, 0.9], 18);
  // Bangs framing the forehead.
  sphere(character, 0.23, hairLight, [-0.22, 2.1, 0.28], [0.9, 1.1, 0.7], 12);
  sphere(character, 0.22, hair, [0.04, 2.08, 0.33], [0.85, 1.12, 0.62], 12);
  sphere(character, 0.2, hairLight, [0.25, 2.12, 0.25], [0.8, 1.0, 0.65], 12);
  sphere(character, 0.17, hair, [-0.36, 1.89, 0.03], [0.65, 1.2, 0.75], 10);
  sphere(character, 0.17, hair, [0.36, 1.89, 0.03], [0.65, 1.2, 0.75], 10);

  // Eye whites, irises, pupils and tiny highlights.
  for (const x of [-0.16, 0.16]) {
    sphere(character, 0.09, white, [x, 1.91, 0.34], [0.92, 1.22, 0.55], 12);
    sphere(character, 0.052, iris, [x + 0.008, 1.9, 0.386], [0.95, 1.12, 0.55], 12);
    sphere(character, 0.025, dark, [x + 0.008, 1.9, 0.412], [0.9, 1.1, 0.55], 10);
    sphere(character, 0.012, white, [x - 0.01, 1.925, 0.43], [1, 1, 0.5], 8);
  }
  // Eyebrows, blush and mouth.
  box(character, [0.14, 0.025, 0.025], hair, [-0.16, 2.035, 0.36], [0, 0, -0.08]);
  box(character, [0.14, 0.025, 0.025], hair, [0.16, 2.035, 0.36], [0, 0, 0.08]);
  sphere(character, 0.045, blush, [-0.27, 1.78, 0.3], [1.3, 0.55, 0.3], 8);
  sphere(character, 0.045, blush, [0.27, 1.78, 0.3], [1.3, 0.55, 0.3], 8);
  sphere(character, 0.025, material(0x9c526c), [0, 1.75, 0.34], [1.5, 0.45, 0.45], 8);

  // Small collar details.
  box(bodyGroup, [0.12, 0.16, 0.055], white, [-0.09, 1.36, 0.25], [0, 0, -0.4]);
  box(bodyGroup, [0.12, 0.16, 0.055], white, [0.09, 1.36, 0.25], [0, 0, 0.4]);
  sphere(bodyGroup, 0.045, material(0x65d8d0), [0, 1.24, 0.29], [1, 1.5, 0.6], 8);
}
function init() {
  try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9bbbd0);
    scene.fog = new THREE.Fog(0x9bbbd0, 15, 34);

    camera = new THREE.PerspectiveCamera(43, frame.clientWidth / frame.clientHeight, 0.1, 100);
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

    const hemi = new THREE.HemisphereLight(0xd8edff, 0x3b4a4e, 2.1);
    scene.add(hemi);
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

    window.addEventListener("resize", onResize, { passive: true });
    distanceInput.addEventListener("input", () => {
      const value = Number(distanceInput.value);
      distanceOutput.value = value.toFixed(1);
      distanceOutput.textContent = value.toFixed(1);
      const direction = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).addScaledVector(direction, value);
      controls.update();
    });
    rotationInput.addEventListener("input", () => {
      const value = Number(rotationInput.value);
      character.rotation.y = THREE.MathUtils.degToRad(value);
      rotationOutput.value = value + "°";
      rotationOutput.textContent = value + "°";
    });
    motionButton.addEventListener("click", toggleMotion);
    waveButton.addEventListener("click", wave);
    resetButton.addEventListener("click", resetAll);
    cameraButton.addEventListener("click", resetCamera);

    loading.classList.add("done");
    window.setTimeout(() => { loading.hidden = true; }, 450);
    animate();
  } catch (error) {
    console.error("ANIMEVERSE initialization failed:", error);
    loading.hidden = true;
    errorBox.hidden = false;
  }
}
function onResize() {
  if (!renderer || !camera) return;
  const width = Math.max(1, frame.clientWidth);
  const height = Math.max(1, frame.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
}
function toggleMotion() {
  motionEnabled = !motionEnabled;
  motionButton.setAttribute("aria-pressed", String(motionEnabled));
  motionButton.querySelector("span:last-child").textContent = motionEnabled ? "إيقاف الحركة" : "تشغيل الحركة";
}
function wave() {
  waveUntil = clock.elapsedTime + 2.4;
}
function resetCamera() {
  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialTarget);
  controls.update();
  distanceInput.value = "7.5";
  distanceOutput.value = "7.5";
  distanceOutput.textContent = "7.5";
}
function resetAll() {
  character.rotation.y = 0;
  rotationInput.value = "0";
  rotationOutput.value = "0°";
  resetCamera();
  motionEnabled = true;
  motionButton.setAttribute("aria-pressed", "true");
  motionButton.querySelector("span:last-child").textContent = "إيقاف الحركة";
}
function animate() {
  frameId = requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  if (character) {
    if (motionEnabled) {
      character.position.y = Math.sin(elapsed * 1.7) * 0.035;
      character.rotation.z = Math.sin(elapsed * 0.9) * 0.012;
      bodyGroup.rotation.z = Math.sin(elapsed * 1.4) * 0.018;
      leftArm.rotation.x = Math.sin(elapsed * 1.5) * 0.045;
      rightArm.rotation.x = Math.sin(elapsed * 1.5 + 1) * 0.045;
    } else {
      character.position.y = THREE.MathUtils.lerp(character.position.y, 0, 0.08);
      character.rotation.z = THREE.MathUtils.lerp(character.rotation.z, 0, 0.08);
      bodyGroup.rotation.z = THREE.MathUtils.lerp(bodyGroup.rotation.z, 0, 0.08);
    }
    if (elapsed < waveUntil) {
      rightArm.rotation.x = -2.25 + Math.sin(elapsed * 13) * 0.18;
      rightArm.rotation.z = -0.55;
    } else {
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0, 0.12);
    }
  }
  controls?.update();
  renderer?.render(scene, camera);
}
window.addEventListener("pagehide", () => cancelAnimationFrame(frameId), { once: true });
init();