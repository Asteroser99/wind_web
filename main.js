import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(4, 5, 11);

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

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = true;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();



const groundGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x555555,
  side: THREE.DoubleSide
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.castShadow = false;
groundMesh.receiveShadow = true;
scene.add(groundMesh);


function resize(mesh){
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const scaleFactor = 5 / Math.max(size.x, size.y, size.z);
  mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
}

function fromfile() {
  const loader = new GLTFLoader().setPath('scene/');
  loader.load('scene.gltf', (gltf) => {
    const mesh = gltf.scene;

    // const box = new THREE.Box3().setFromObject(mesh);
    // const size = box.getSize(new THREE.Vector3());
    // const scaleFactor = 5 / Math.max(size.x, size.y, size.z);
    // mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
    resize(mesh);

    mesh.position.set(0, 1.05, -1);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    document.getElementById('progress-container').style.display = 'none';
  }, (xhr) => {
    console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
  }, (error) => {
    console.error(error);
  });
}

function box() {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  cube.receiveShadow = true;
  cube.position.set(3, 2.0, -1);
  scene.add(cube);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}


const vertices = [
  0.0, 0.0, 0.0,
  1.0, 0.0, 0.0,
  0.0, 1.0, 0.0,
  0.0, 0.0, 1.0
];
const indices = [
  0, 1, 2,
  0, 2, 3,
  0, 1, 3,
  1, 2, 3
];

function model(vertices, indices) {
  const geometry1 = new THREE.BufferGeometry();
  geometry1.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry1.setIndex(indices);
  geometry1.computeVertexNormals();

  const material1 = new THREE.MeshStandardMaterial({ color: 0x00ff00, flatShading: true });

  const mesh = new THREE.Mesh(geometry1, material1);
  mesh.position.set(-3, 1.05, -1);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  resize(mesh);

  scene.add(mesh);

  return mesh
}

// const mesh = model(vertices, indices);

const vertices2 = [
    0.0, 0.0, 2.0,
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
  ];
  const indices2 = [
    1, 2,
    2, 3,
    1, 3,
    2, 3
  ];
  
function line(vertices, indices) {
  // Создаем геометрию линий
  const geometry2 = new THREE.BufferGeometry();
  geometry2.setAttribute('position', new THREE.Float32BufferAttribute(vertices2, 3));
  geometry2.setIndex(indices2);

  // Создаем материал для линий
  const material2 = new THREE.LineBasicMaterial({ color: 0xff0000 });

  // Создаем объект линий
  const lines = new THREE.LineSegments(geometry2, material2);
  lines.position.set(-1, 2.0, -3);
  scene.add(lines);

  return lines
}

// const lines = line(vertices2, indices2)

document.getElementById('progress-container').style.display = 'none';

function animate() {
  requestAnimationFrame(animate);

  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;

  // mesh.rotation.x += 0.01;
  // mesh.rotation.y += 0.01;

  // lines.rotation.x -= 0.01;
  // lines.rotation.y -= 0.01;

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});




// csv

let vessel = {};

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const csvText = e.target.result;
            parseCSVToMandrel(csvText);
            DrawMandrel();
        };
        reader.readAsText(file);
    }
});


// Функция для получения массивов x и r
function parseCSVToMandrel(csvText) {
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

  return { r, x };
}

function lambda_Call(name, param) { 
  const path = 'https://z2qmzcusx7.execute-api.eu-central-1.amazonaws.com/prod/';
  return axios.post(path + name, JSON.stringify(param));
}

function Mandrel(r, x) {
  return lambda_Call("Mandrel", [r, x])
      .then(response => {
          const data = response.data;
          console.log("resp:", data);
          return data; // Возвращаем данные из then
      })
      .catch(error => {
        console.error("Error in Mandrel:", error);
      });
}

function DrawMandrel() {
  const { r, x } = vessel["mandrel"];
  
  Mandrel(r, x)
      .then(res => {
          const mesh = model(res["Points"], res["Faces"]);
          console.log("Mesh created:", mesh);
      })
      .catch(error => {
          console.error("Error in DrawMandrel:", error);
      });
}
