import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

window.vessel = {};

let renderer = null;
let scene    = null;
let camera   = null;
let controls = null;
let canvas   = null;
let scaleFactor = 1;


function loaded(){
  document.getElementById('progress-container').style.display = 'none';
}

function loading(){
  document.getElementById('progress-container').style.display = '';
}

loading()

function createGradientTexture() {
  const canvas = document.createElement('canvas');
  // const canvas = document.getElementById('static-3d-canvas')
  const ctx = canvas.getContext('2d');
  canvas.width = 512; // Размер текстуры
  canvas.height = 512;

  // Создаем градиент
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  // gradient.addColorStop(0, '#ff7eb3'); // Розовый
  // gradient.addColorStop(0.5, '#6c5ce7'); // Фиолетовый
  // gradient.addColorStop(1, '#00cec9'); // Голубой
  gradient.addColorStop(0, '#99E6B2'); // Верхний цвет
  gradient.addColorStop(1, '#00827E'); // Нижний цвет

  // Заливаем canvas градиентом
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Создаем текстуру из canvas
  const texture = new THREE.CanvasTexture(canvas);
  scene.background = texture;
  return texture;
}

function resizeScene(){
  const parent = canvas.parentElement;

  let width  = parent.offsetWidth  - 1;
  let height = parent.offsetHeight - 1;
  // width  = 500;
  // height = 500;

  // canvas.width  = width;
  // canvas.height = height;

  canvas.style.width  = width;
  canvas.style.height = height;

  renderer.setSize(width, height);

  // camera.aspect = width / height;
  // camera.updateProjectionMatrix();

  // console.log(
  //   "par", parent.offsetWidth, " -> ",
  //   "cnv", canvas.width, " -> ",
  //   "cvs", canvas.style.width, " -> ",
  //   "ren", renderer.getSize(new THREE.Vector2()).width
  // )
}
window.resizeScene = resizeScene

window.addEventListener('resize', () => {
  resizeScene();
});

function setupScene(){
  canvas = document.getElementById('static-3d-canvas')
  // log size of canvas

  scene = new THREE.Scene();
  // const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
  // const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });

  renderer.domElement.style.minWidth  = '0';
  renderer.domElement.style.minHeight = '0';

  // renderer = new THREE.WebGLRenderer({
  //   canvas: canvas,
  //   antialias: true,
  // });
  // const canvas = document.createElement('canvas');
  // canvas.width = 128;
  // canvas.height = 128;

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x9ACBD0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // console.log(canvas.width, canvas.height)
  // return

  // document.body.appendChild(renderer.domElement);

  // scene = new THREE.Scene();

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // const context = canvas.getContext('2d');

  // console.log(context)

  // const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  // gradient.addColorStop(0, '#99E6B2'); // Верхний цвет
  // gradient.addColorStop(1, '#00827E'); // Нижний цвет
  
  // context.fillStyle = gradient;
  // context.fillRect(0, 0, canvas.width, canvas.height);

  // Используем градиент как фон
  // const gradientTexture = new THREE.CanvasTexture(canvas);
  // scene.background = gradientTexture;
  createGradientTexture();


  // camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  // camera.position.set(4, 5, 11);

  // Ортографическая камера для изометрии
  const aspect = window.innerWidth / window.innerHeight;
  const d = 10; // Размеры области видимости камеры
  camera = new THREE.OrthographicCamera(
    -d * aspect, // Лево
    d * aspect,  // Право
    d,           // Верх
    -d,          // Низ
    0.1,         // Ближняя плоскость
    1000         // Дальняя плоскость
  );
  camera.position.set(10, 10, 10); // Сместим камеру
  camera.lookAt(0, 0, 0);         // Направим камеру в центр сцены


  const spotLight = new THREE.SpotLight(0xffffff, 3000, 100, 0.22, 1);
  spotLight.position.set(0, 25, 0);
  spotLight.castShadow = true;
  spotLight.shadow.bias = -0.0001;
  scene.add(spotLight);

  // const spotLight = new THREE.SpotLight(0xff11ff, 3000, 100, 0.22, 1);
  // spotLight.position.set(-20, 25, 0);
  // spotLight.castShadow = true;
  // spotLight.shadow.bias = -0.0001;
  // scene.add(spotLight);

  // const spotLight1 = new THREE.SpotLight(0xffff11, 3000, 100, 0.22, 1);
  // spotLight1.position.set(20, 25, 0);
  // spotLight1.castShadow = true;
  // spotLight1.shadow.bias = -0.0001;
  // scene.add(spotLight1);

  //const light = new THREE.DirectionalLight(0xffffff, 1);
  //light.position.set(5, 10, 7);
  //scene.add(light);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.minDistance = 5;
  controls.maxDistance = 20;
  // controls.minPolarAngle = 0.5;
  // controls.maxPolarAngle = 1.5;
  // controls.autoRotate = true;
  controls.target = new THREE.Vector3(0, 1, 0);
  controls.update();

  // const groundGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
  // groundGeometry.rotateX(-Math.PI / 2);
  // const groundMaterial = new THREE.MeshStandardMaterial({
  //   color: 0x556655,
  //   side: THREE.DoubleSide
  // });
  // const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  // groundMesh.castShadow = false;
  // groundMesh.receiveShadow = true;
  // scene.add(groundMesh);

  resizeScene();
}

function resizeMesh(mesh){
  mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
}

function calcScaleFactor(mesh){
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  scaleFactor = 5 / Math.max(size.x, size.y, size.z);

  resizeMesh(mesh);
}

document.addEventListener('DOMContentLoaded', function() {
  setupScene();
  loaded();
  animate();
  })


// const accessToken = localStorage.getItem('accessToken');

// axios
//   .get('https://YOUR_API_ENDPOINT', {
//     headers: {
//       Authorization: `Bearer ${accessToken}`, // Используйте Bearer токен
//     },
//   })
//   .then((response) => {
//     console.log('API Response:', response.data);
//   })
//   .catch((error) => {
//     console.error('API Error:', error);
//   });

// models

function fromfile() {
  const loader = new GLTFLoader().setPath('scene/');
  loader.load('scene.gltf', (gltf) => {
    const mesh = gltf.scene;

    // const box = new THREE.Box3().setFromObject(mesh);
    // const size = box.getSize(new THREE.Vector3());
    // const scaleFactor = 5 / Math.max(size.x, size.y, size.z);
    // mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
    resizeMesh(mesh);

    mesh.position.set(0, 1.05, -1);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);
  }, (xhr) => {
    console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
  }, (error) => {
    console.error(error);
  });
}

function box() {
  const geometry = new THREE.BoxGeometry(2, 2, 2);

  // const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

  const textureLoader = new THREE.TextureLoader();

  const colorTexture     = textureLoader.load('Pic.jpg');
  // const normalTexture    = textureLoader.load('./texture/Fabric004/NormalDX.png');
  // const roughnessTexture = textureLoader.load('./texture/Fabric004/Roughness.png');
  
  colorTexture.wrapS = THREE.RepeatWrapping;
  colorTexture.wrapT = THREE.RepeatWrapping;
  colorTexture.repeat.set(2, 2);

  // normalTexture.wrapS = THREE.RepeatWrapping;
  // normalTexture.wrapT = THREE.RepeatWrapping;
  // normalTexture.repeat.set(4, 4);

  // roughnessTexture.wrapS = THREE.RepeatWrapping;
  // roughnessTexture.wrapT = THREE.RepeatWrapping;
  // roughnessTexture.repeat.set(4, 4);

  const material = new THREE.MeshStandardMaterial({
    map: colorTexture,
    // normalMap: normalTexture,
    // roughnessMap: roughnessTexture,
    roughness: 0.3, // Подстройка уровня шероховатости
    metalness: 0.5, // Придаёт металлический блеск
  });  

  // const material = new THREE.MeshPhongMaterial({
  //   color: new THREE.Color(0.5,0.5,0.5),
  //   emissive: new THREE.Color(0.05,0.05,0.05)
  // })  

  const cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  cube.receiveShadow = true;
  cube.position.set(3, 2.0, -1);

  resizeMesh(cube);

  scene.add(cube);
}

// box()

function model([vertices, indices], Color = 0x4444FF) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();



  var quad_uvs =
  [
  0.0, 0.0,
  1.0, 0.0,
  1.0, 1.0,
  0.0, 1.0
  ];
  var uvs = new Float32Array(quad_uvs);
  geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );



  // const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, flatShading: true });
  
  // const textureLoader = new THREE.TextureLoader();

  // Загрузка текстур
  // const colorTexture     = textureLoader.load('Color.jpg');
  // const normalTexture    = textureLoader.load('./texture/Fabric004/NormalDX.png');
  // const roughnessTexture = textureLoader.load('./texture/Fabric004/Roughness.png');
  
  // colorTexture.wrapS = THREE.RepeatWrapping;
  // colorTexture.wrapT = THREE.RepeatWrapping;
  // colorTexture.repeat.set(1.0, 1.0);

  // normalTexture.wrapS = THREE.RepeatWrapping;
  // normalTexture.wrapT = THREE.RepeatWrapping;
  // normalTexture.repeat.set(4, 4);

  // roughnessTexture.wrapS = THREE.RepeatWrapping;
  // roughnessTexture.wrapT = THREE.RepeatWrapping;
  // roughnessTexture.repeat.set(4, 4);

// Создание материала
  const material = new THREE.MeshStandardMaterial({
    // map: colorTexture,
    // normalMap: normalTexture,
    // roughnessMap: roughnessTexture,
    roughness: 0.3, // Подстройка уровня шероховатости
    metalness: 0.5, // Придаёт металлический блеск
    color: Color, // Желтый цвет в формате HEX
    side: THREE.DoubleSide,
});  

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 2.0, 0);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  resizeMesh(mesh);

  scene.add(mesh);

  return mesh
}

function line([vertices, indices]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);

  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

  const lines = new THREE.LineSegments(geometry, material);
  lines.position.set(0, 2.0, 0);
  scene.add(lines);

  resizeMesh(lines);

  return lines
}


function animate() {
  requestAnimationFrame(animate);

  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;

  controls.update();
  renderer.render(scene, camera);
}



// mandrel

const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', function(event) { loadCSVDrawMandrel(event) });

function loadCSVDrawMandrel(event) {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        loading();
        const csvText = e.target.result;
        parseCSVToMandrel(csvText);
        DrawMandrel();
      };
      reader.readAsText(file);
  }
}

function parseCSVToMandrel(csvText) {
  loading();
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",");
  
  if (headers.length < 2) {
      throw new Error("CSV must have at least two columns");
  }

  const r = []; const x = [];
  for (let i = 1; i < lines.length; i++) {
      const [rValue, xValue] = lines[i].split(",");
      r.push(Number(rValue.trim()));
      x.push(Number(xValue.trim()));
  }

  vessel["mandrel"] = { r, x }

  loaded();
  return { r, x };
}

function mandrelRender(rr, xx) {
  const resolution = 100;
  const indices = [];
  const points  = [];

  for (let i = 0; i < rr.length; i++) {
      const theta = Array.from({ length: resolution }, (_, j) => (2 * Math.PI * j) / resolution);
      const row = [];

      for (const fii of theta) {
          const x = xx[i];
          const y = rr[i] * Math.sin(fii);
          const z = rr[i] * Math.cos(fii);

          points.push(x, y, z);
          row.push(points.length / 3 - 1);
      }
      indices.push(row);
  }

  const faces = [];
  for (let i = 0; i < indices.length - 1; i++) {
      for (let j = 0; j < indices[i].length - 1; j++) {
          const p1 = indices[i][j];
          const p2 = indices[i][j + 1];
          const p3 = indices[i + 1][j];
          const p4 = indices[i + 1][j + 1];
          faces.push(p1, p4, p2);
          faces.push(p1, p3, p4);
      }
  }

  return [points, faces]
}

function DrawMandrel() {
  loading();

  const { r, x } = vessel["mandrel"];

  try {
    const mesh = model(mandrelRender(r, x));

    calcScaleFactor(mesh);

  } catch (error) {
      console.error("Error in DrawMandrel:", error);
  }

  loaded();
}



const uploadButton = document.getElementById('upload-forming');
uploadButton.addEventListener('click', () => {fileInput.click();});


// coil

const generateButton_ = document.getElementById('generate-coil');
generateButton_.addEventListener('click', () => {DrawCoil();});


function coilRender(fi, xx, rr) {
  const vertices = [];
  const indices  = [];

  for (let i = 0; i < xx.length; i++) {
      const fii = fi[i];
      const x = xx[i];
      const y = rr[i] * Math.sin(fii);
      const z = rr[i] * Math.cos(fii);

      vertices.push(x, y, z);

      if (i > 0) {
        indices.push(i - 1);
        indices.push(i);
      }
  }

  return [vertices, indices];
}

// -------

function lambdaCall(name, param) {
  console.log("lambdaCall start");

  const path = 'https://z2qmzcusx7.execute-api.eu-central-1.amazonaws.com/prod/';
  const accessToken = localStorage.getItem('accessToken'); // Получаем токен из локального хранилища

  const headers = {
    headers: {
      auth: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }

  return axios.post(
    path + name,
    JSON.stringify(param),
    headers
  ).then((response) => {
      // console.log("lambdaCall response");
      // console.log(response.data);
      return response.data;
    })
    .catch((error) => {
      console.error('Error calling Lambda:', error);
    });
}


// Line coil

function CalcCoil(r, x) {
  console.log("CalcCoil");

  const valueX = document.getElementById('value-x');
  const Pole = parseFloat(valueX.textContent)//.toFixed(2)
  console.log("Pole = ", Pole);

  return lambdaCall("vitok", [x, r, Pole, 10.])
      .then(res => {
        console.log("CalcCoil:", res);
        const [cx, cr, cfi, calfa] = res
        return [cx, cr, cfi, calfa];
      })
      .catch(error => {
        console.error("Error in CalcCoil:", error);
      });
}

function DrawCoil() {
  const { r, x } = vessel["mandrel"];
  loading();
  CalcCoil(r, x)
      .then(([cx, cr, cfi, calfa]) => {
        vessel["coil"] = { cx, cr, cfi, calfa };
        const mesh = line(coilRender(cfi, cx, cr));
          loaded();
        })
      .catch(error => {
          console.error("Error in DrawTapeN:", error);
      });
}


// Tape coil

const tapeNButton = document.getElementById('draw-tape');
tapeNButton.addEventListener('click', () => {DrawTapeN();});


function sceneTapeN() {
  console.log("sceneTapeN");
  console.log("0", vessel["coil"]);
  console.log("1", vessel["mandrel"]);
  const { cx, cr, cfi, calfa } = vessel["coil"];
  console.log("2", cx);

  return lambdaCall("gltfCoil", [ "TapeN", cx, cr, cfi, calfa, 10., 10. ])
      .then(gltf => {
        console.log("sceneTapeN:", gltf);
        return gltf;
      })
      .catch(error => {
        console.error("Error in sceneTapeN:", error);
      });
}

function DrawTapeN() {
  loading();
  sceneTapeN()
      .then(gltf => {
          const mesh = model([gltf.verticesArray, gltf.indicesArray], 0xffff00);
          loaded();
        })
      .catch(error => {
          console.error("Error in DrawCoil:", error);
      });
}


// -------

// var quad_vertices =
// [
// -30.0,  30.0, 0.0,
// 30.0,  30.0, 0.0,
// 30.0, -30.0, 0.0,
// -30.0, -30.0, 0.0
// ];

// var quad_uvs =
// [
// 0.0, 0.0,
// 1.0, 0.0,
// 1.0, 1.0,
// 0.0, 1.0
// ];

// var quad_indices =
// [
// 0, 2, 1, 0, 3, 2
// ];

// var geometry = new THREE.BufferGeometry();

// var vertices = new Float32Array( quad_vertices );
// // Each vertex has one uv coordinate for texture mapping
// var uvs = new Float32Array(quad_uvs);
// // Use the four vertices to draw the two triangles that make up the square.
// var indices = new Uint32Array( quad_indices )

// // itemSize = 3 because there are 3 values (components) per vertex
// geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
// geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
// geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );

// // Load the texture asynchronously
// let sprite = new THREE.TextureLoader().load('Pic.jpg');

// var material = new THREE.MeshBasicMaterial( {map: sprite });
// var mesh = new THREE.Mesh( geometry, material );
// mesh.position.z = -100;

// scene.add(mesh);

function saveVessel() {

}

const saveVesselButton = document.getElementById('saveVessel');
saveVesselButton.addEventListener('click', () => {saveVessel();});
