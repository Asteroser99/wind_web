import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let vessel = {};
let scaleFactor = 1;

let renderer = null;
let scene    = null;
let camera   = null;
let controls = null;


function loaded(){
  document.getElementById('progress-container').style.display = 'none';
}

function loading(){
  document.getElementById('progress-container').style.display = '';
}

loading()

function setupScene(){
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
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

  controls = new OrbitControls(camera, renderer.domElement);
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
    color: 0x556655,
    side: THREE.DoubleSide
  });
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.castShadow = false;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);
}

function resize(mesh){
  mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
}

function calcScaleFactor(mesh){
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  scaleFactor = 5 / Math.max(size.x, size.y, size.z);

  resize(mesh);
}


setupScene()


function lambda_Call(name, param) { 
  const path = 'https://z2qmzcusx7.execute-api.eu-central-1.amazonaws.com/prod/';
  return axios.post(path + name, JSON.stringify(param));
}



// models

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

  resize(cube);

  scene.add(cube);
}

function model(vertices, indices) {
  const geometry1 = new THREE.BufferGeometry();
  geometry1.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry1.setIndex(indices);
  geometry1.computeVertexNormals();

  const material1 = new THREE.MeshStandardMaterial({ color: 0x00ff00, flatShading: true });

  const mesh = new THREE.Mesh(geometry1, material1);
  mesh.position.set(0, 2.0, 0);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  resize(mesh);

  scene.add(mesh);

  return mesh
}

function line(vertices, indices) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);

  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

  const lines = new THREE.LineSegments(geometry, material);
  lines.position.set(0, 2.0, 0);
  scene.add(lines);

  resize(lines);

  return lines
}

loaded();

function animate() {
  requestAnimationFrame(animate);

  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;

  controls.update();
  renderer.render(scene, camera);
}

animate();



window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


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

function mandrelRender(r0, x0) {
  const resolution = 100;
  const indices = [];
  const points  = [];

  for (let i = 0; i < r0.length; i++) {
      const r = r0[i];
      const h = x0[i];
      const theta = Array.from({ length: resolution }, (_, j) => (2 * Math.PI * j) / resolution);
      const row = [];

      for (const angle of theta) {
          const x = r * Math.cos(angle);
          const y = r * Math.sin(angle);
          const z = h;
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
          faces.push(p1, p2, p4);
          faces.push(p1, p4, p3);
      }
  }

  return {
      Points: points,
      Faces: faces
  };
}



function mandrelRender1(rr, xx) {
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
          faces.push(p1, p2, p4);
          faces.push(p1, p4, p3);
      }
  }

  return {
      Points: points,
      Faces: faces
  };
}

// function CalcMandrel(r, x) {
//   // return lambda_Call("Mandrel", [r, x])
//   //     .then(response => {
//   //         const data = response.data;
//   //         return data;
//   //     })
//   //     .catch(error => {
//   //       console.error("Error in CalcMandrel:", error);
//   //     });
//   return mandrelRender(r, x);
// }

function DrawMandrel() {
  loading();

  const { r, x } = vessel["mandrel"];

  // CalcMandrel(r, x)
  //     .then(res => {
  //         const mesh = model(res["Points"], res["Faces"]);
  //         calcScaleFactor(mesh);
  //         loaded();
  //     })
  //     .catch(error => {
  //         console.error("Error in DrawMandrel:", error);
  //     });


  try {
    // Синхронно вызываем CalcMandrel
    const res = mandrelRender(r, x);

    // Генерируем модель на основе результата
    const mesh = model(res["Points"], res["Faces"]);

    // Рассчитываем масштаб
    calcScaleFactor(mesh);

  } catch (error) {
      console.error("Error in DrawMandrel:", error);
  }

  loaded();
}



const uploadButton = document.getElementById('upload-forming');
uploadButton.addEventListener('click', () => {fileInput.click();});


// coil

const generateButton = document.getElementById('generate-coil');
generateButton.addEventListener('click', () => {DrawCoil();});


function coilRender(fi, xx, rr) {
  const vertices = [];
  const indices  = [];

  for (let i = 0; i < xx.length; i++) {
      const fii = fi[i];
      const x = rr[i] * Math.cos(fii);
      const y = rr[i] * Math.sin(fii);
      const z = xx[i];

      vertices.push(x, y, z);

      if (i > 0) {
        indices.push(i - 1);
        indices.push(i);
      }
  }

  return [vertices, indices];
}

function CalcCoil(r, x) {
  console.log("CalcCoil");
  return lambda_Call("vitok", [x, r, 10., 10.])
      .then(resp => {
        console.log("CalcCoil:", resp.data);
        const [cfi, cx, calfa, cr] = resp.data
        return [cfi, cx, calfa, cr];
      })
      .catch(error => {
        console.error("Error in CalcCoil:", error);
      });
}

function DrawCoil() {
  const { r, x } = vessel["mandrel"];
  loading();
  CalcCoil(r, x)
      .then(([cfi, cx, calfa, cr]) => {
          console.log("vitok:", [cfi, cx, calfa, cr]);
          const [vertices, indices] = coilRender(cfi, cx, cr);
          console.log("render:", vertices, indices);
          const mesh = line(vertices, indices);
          loaded();
        })
      .catch(error => {
          console.error("Error in DrawCoil:", error);
      });
}
