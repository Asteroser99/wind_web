import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// let scene = null;
// let renderer = null;
// let camera = null;
// let controls = null;
// let canvas = null;
window.scene = { scene: null, renderer: null, camera: null, controls: null, canvas: null}
window.scale = { x: {}, y: {}, z: {}, factor: 1 };

// let spotLight = null;

let meshes = {}

function createGradientTexture() {
    const canvas = document.createElement('canvas');
    // const canvas = document.getElementById('scene-canvas')
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
    scene.scene.background = texture;
    return texture;
}

function resizeScene() {
  const parent = scene.canvas.parentElement;
  // if (parent.offsetWidth == 0 || parent.offsetHeight == 0) return
  // if (!parent.classList.contains("active")) {
  //   console.log("not active")
  //   return
  // }

  let width = Math.max(parent.offsetWidth - 1, 0);
  let height = Math.max(parent.offsetHeight - 1, 0);

  scene.canvas.style.width = width;
  scene.canvas.style.height = height;

  scene.renderer.setSize(width, height);

  const d = 15;
  const aspect = width / height;
  scene.camera.left = -d * aspect;
  scene.camera.right = d * aspect;
  scene.camera.top = d;
  scene.camera.bottom = -d;

//  scene.camera.near = 0.001;
  // scene.camera.aspect = width / height;
  scene.camera.updateProjectionMatrix();
}
window.resizeScene = resizeScene

window.addEventListener('resize', () => {
  resizeScene();
});

function sceneInit() {
  scene.canvas = document.getElementById('scene-canvas')
  // log size of canvas

  scene.scene = new THREE.Scene();
  // const scene.camera = new THREE.PerspectiveCamera(75, scene.canvas.width / scene.canvas.height, 0.1, 1000);
  // const scene.renderer = new THREE.WebGLRenderer({ canvas: scene.canvas });
  scene.renderer = new THREE.WebGLRenderer({
    canvas: scene.canvas,
    antialias: true,
    alpha: true,
  });

  scene.renderer.domElement.style.minWidth  = '0';
  scene.renderer.domElement.style.minHeight = '0';

  // scene.renderer = new THREE.WebGLRenderer({
  //   canvas: scene.canvas,
  //   antialias: true,
  // });
  // const canvas = document.createElement('canvas');
  // canvas.width = 128;
  // canvas.height = 128;

  scene.renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene.renderer.setClearColor(0x9ACBD0);
  scene.renderer.setPixelRatio(window.devicePixelRatio);
  scene.renderer.shadowMap.enabled = true;
  scene.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // console.log(canvas.width, canvas.height)
  // return

  // document.body.appendChild(scene.renderer.domElement);

  // scene = new THREE.Scene();

  const axesHelper = new THREE.AxesHelper(15);
  scene.scene.add(axesHelper);

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


  // scene.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  // scene.camera.position.set(4, 5, 11);

  // Ортографическая камера для изометрии
  scene.camera = new THREE.OrthographicCamera(
    -1, 1, 1, -1,
    0.1, 1000
  );
  scene.camera.position.set(10., 20., 20.);
  // scene.camera.near = 0.0000001;
  scene.camera.lookAt(0, 0, 0);

  // Первая координата (X) → Вдоль горизонтальной оси (вправо-влево)
  // Вторая координата (Y) → Вдоль вертикальной оси (вверх-вниз)
  // Третья координата (Z) → Вдоль глубины сцены (вперёд-назад)

  const x = 20; // Расстояние от центра до вершины тетраэдра
  const sh = x / Math.sqrt(3);

  const lights = [
    [-sh, x, 0],
    [-sh, -x, 0],
    [sh, 0, x],
    [sh, 0, -x]
  ];

  // const v1 = [2 * x / Math.sqrt(3),  0, -x / Math.sqrt(3)];
  // const v2 = [   -x / Math.sqrt(3),  x, -x / Math.sqrt(3)];
  // const v3 = [   -x / Math.sqrt(3), -x, -x / Math.sqrt(3)];
  // const v4 = [                   0,  0, Math.sqrt(3) * x];

  lights.forEach(vertex => {
    const light = new THREE.SpotLight(0xffffff, 5000, 30, 1.0, 2);
    light.position.set(...vertex);                 // Устанавливаем позицию
    light.target.position.set(0, 0, 0);            // Устанавливаем цель на центр (0, 0, 0)
    light.castShadow = true;                       // Включаем отбрасывание теней
    scene.scene.add(light.target);                       // Добавляем цель в сцену
    scene.scene.add(light);                              // Добавляем свет в сцену
  });




  // spotLight = new THREE.SpotLight(0xffffff, 7000, 100, 0.5, 1);
  // spotLight.position.set(0, 7., 0.);
  // spotLight.castShadow = true;
  // spotLight.shadow.bias = -0.0001;
  // scene.scene.add(spotLight);

  // const spotLight = new THREE.SpotLight(0xff11ff, 3000, 100, 0.22, 1);
  // spotLight.position.set(-20, 25, 0);
  // spotLight.castShadow = true;
  // spotLight.shadow.bias = -0.0001;
  // scene.scene.add(spotLight);

  // const spotLight1 = new THREE.SpotLight(0xffff11, 3000, 100, 0.22, 1);
  // spotLight1.position.set(20, 25, 0);
  // spotLight1.castShadow = true;
  // spotLight1.shadow.bias = -0.0001;
  // scene.scene.add(spotLight1);

  //const light = new THREE.DirectionalLight(0xffffff, 1);
  //light.position.set(5, 10, 7);
  //scene.scene.add(light);

  scene.controls = new OrbitControls(scene.camera, scene.renderer.domElement);
  scene.controls.enableDamping = true;
  scene.controls.enablePan = true;
  scene.controls.minDistance = 3;
  scene.controls.maxDistance = 30;
  // scene.controls.minPolarAngle = 0.5;
  // scene.controls.maxPolarAngle = 1.5;
  // scene.controls.autoRotate = true;
  scene.controls.target = new THREE.Vector3(0, 1, 0);
  scene.controls.update();

  resizeScene();

  floorInit();

  frameInit();

  scaleSet();
}

function resizeMesh(mesh) {
  // console.log("resize scale = ", scale)
  mesh.scale.set(scale.factor, scale.factor, scale.factor);
}

// document.addEventListener('DOMContentLoaded', function () {
function threeOnLoad() {
  sceneInit();
  loaded();
  animate();
}
window.threeOnLoad = threeOnLoad


// models

function floorInit() {
  // const groundGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
  // groundGeometry.rotateX(-Math.PI / 2);
  // const groundMaterial = new THREE.MeshStandardMaterial({
  //   color: 0x556655,
  //   side: THREE.DoubleSide
  // });
  // const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  // groundMesh.castShadow = false;
  // groundMesh.receiveShadow = true;
  // scene.scene.add(groundMesh);


  // floor

  // const floor = new THREE.GridHelper(100, 100);
  // floor.material.transparent = true;
  // floor.material.opacity = 0.5;
  // floor.matrixAutoUpdate = false; // Отключаем автообновление матрицы
  // floor.matrix.makeTranslation(0, -2, 0); // Смещаем вручную
  // scene.scene.add(floor);

  // const floor = new THREE.GridHelper(100, 100);
  // floor.material.transparent = true;
  // floor.material.opacity = 0.5;
  // floor.position.y = -2; // Опускаем на -100 по оси Y
  // scene.scene.add(floor);

  // const planeGeometry = new THREE.PlaneGeometry(100, 100);
  // const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
  // // const planeMaterial = new THREE.MeshStandardMaterial({
  // //   // map: colorTexture,
  // //   // normalMap: normalTexture,
  // //   // roughnessMap: roughnessTexture,
  // //   roughness: 0.3, // Подстройка уровня шероховатости
  // //   metalness: 0.5, // Придаёт металлический блеск
  // // });
  // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  // plane.rotation.x = -Math.PI / 2; // Разворачиваем в горизонтальное положение
  // plane.position.y = -2; // Опускаем под кубик
  // plane.receiveShadow = true; // Позволяет принимать тени
  // scene.scene.add(plane);


  const vertexShader = `
  varying vec2 vUv; // Передаём координаты в фрагментный шейдер
  void main() {
      vUv = uv; // Запоминаем координаты
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `;
  
  const fragmentShader = `
  varying vec2 vUv;
  uniform vec2 uCenter; // Центр затухания
  uniform float uFade;  // Коэффициент затухания
  uniform float uGridSize; // Размер квадратов в сетке

  void main() {
      // Основное затухание (круг)
      float dist = distance(vUv, uCenter);
      float alpha = smoothstep(1.0, 0.0, dist * uFade); 

      // Квадратная сетка
      vec2 grid = mod(vUv * uGridSize, 1.0); // Создаём повторяющиеся клетки
      float lineThickness = 0.02; // Толщина линий сетки
      float gridLines = max(step(grid.x, lineThickness), step(grid.y, lineThickness)); // Линии по X и Y

      // Итоговая прозрачность (сетку тоже делаем затухающей)
      float gridAlpha = gridLines * alpha; // Используем основное затухание для сетки

      // Основной цвет (бирюзовый)
      vec3 baseColor = vec3(72. / 256., 166. / 256., 167. / 256.);
      // Цвет сетки (чёрный)
      vec3 gridColor = vec3(154. / 256., 203. / 256., 208. / 256.);

      // Смешиваем цвет сетки и основного фона
      vec3 finalColor = mix(baseColor, gridColor, gridAlpha);

      gl_FragColor = vec4(finalColor, alpha);
  }`;

  // gl_FragColor = vec4(41. / 256., 115. / 256., 178. / 256., alpha);
  // gl_FragColor = vec4(154. / 256., 203. / 256., 208. / 256., alpha);
  // gl_FragColor = vec4(72. / 256., 166. / 256., 167. / 256., alpha);

  const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
          uCenter: { value: new THREE.Vector2(0.5, 0.5) }, // Центр текстурных координат (0.5, 0.5 = середина)
          uFade: { value: 4.0 }, // Насколько быстро затухает прозрачность
          uGridSize: { value: 70.0 },  // Количество квадратов на единицу
          // uLineThickness: { value: 0.05 }, // Толщина линий
        },
      transparent: true
  });
  
  // Создаём обычный `PlaneGeometry` и накладываем на него градиентный шейдер
  const geometry = new THREE.PlaneGeometry(100, 100, 10, 10);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;

  resizeMesh(mesh);

  scene.scene.add(mesh);

  window.floorMesh = mesh;
}

function addMeshfromfile() {
  const loader = new GLTFLoader().setPath('img/');
  loader.load('scene.gltf', (gltf) => {
    const mesh = gltf.scene;

    resizeMesh(mesh);

    mesh.position.set(0, 1.05, -1);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.scene.add(mesh);
  }, (xhr) => {
    console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
  }, (error) => {
    console.error(error);
  });
}

function addBox() {
  const geometry = new THREE.BoxGeometry(2, 2, 2);

  // const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

  const textureLoader = new THREE.TextureLoader();

  const colorTexture = textureLoader.load('Pic.jpg');
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
  // cube.castShadow = true;
  // cube.receiveShadow = true;
  cube.position.set(3, 2.0, -1);

  resizeMesh(cube);

  scene.scene.add(cube);
}

function addMesh(render, color = 0x4444FF, transparent = 1., setScale = false) {
  if (!render) return;
  const [vertices, indices] = render;
  if (vertices.length == 0) return;

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
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));



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
    color: color,
    side: THREE.DoubleSide,
  });

  if (transparent != 1.) {
    material.transparent = true;
    material.opacity = transparent;
  }


  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  scene.scene.add(mesh);

  if (setScale) {

    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());

    const center = box.getCenter(new THREE.Vector3());  // Центр объекта

    let minX = 0, maxX = -0;
    let minY = 0, maxY = -0;
    let minZ = 0, maxZ = -0;

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i]; const y = vertices[i + 1]; const z = vertices[i + 2];

      if (i == 0) {
        minX = x; maxX = x;
        minY = y; maxY = y;
        minZ = z; maxZ = z;
      } else {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      }
    }

    scaleSet(
      { size: size.x, center: center.x, max: maxX, min: minX },
      { size: size.y, center: center.y, max: maxY, min: minY },
      { size: size.z, center: center.z, max: maxZ, min: minZ }
    );

    // mesh.position.sub(center);

    scene.controls.target.set(center.x * scale.factor, center.y * scale.factor, center.z * scale.factor); // Центр вращения 0, 0, 0
    scene.controls.update();

    // const pointLight = new THREE.PointLight(0xffffff, 1, 300);  // Сила света и радиус действия
    // spotLight.position.set(0, size.y, 0);  // Размещаем свет выше объекта
    // scene.scene.add(pointLight);

    if(frameMesh){
      frameUpdate()
    }
  }

  resizeMesh(mesh);

  return mesh;
}
window.addMesh = addMesh

function scaleSet(x = 0, y = 0, z = 0){
  if(x == 0) x = { size: 0, center: 0, max: 0, min: 0 }
  if(y == 0) y = { size: 0, center: 0, max: 0, min: 0 }
  if(z == 0) z = { size: 0, center: 0, max: 0, min: 0 }

  scale.x = x;
  scale.y = y;
  scale.z = z;

  const maxSize = Math.max(scale.x.max - scale.x.min, scale.y.max - scale.y.min, scale.z.max - scale.z.min)

  scale.factor = maxSize != 0 ? 20 / maxSize : 1

  // console.log("minX:", minX, "maxX:", maxX);
  // console.log("minY:", minY, "maxY:", maxY);
  // console.log("minZ:", minZ, "maxZ:", maxZ);

  // console.log("scale.factor === ", maxSize, " ===> ", scale.factor)
  // console.log("size", size)
  // console.log("center", center)
}


function addLine([vertices, indices], color = 0xff0000, transparent = false) {
  if (vertices.length == 0) return;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);

  const materialproperties = { color: color };
  if (transparent) {
    materialproperties.transparent = true;
    materialproperties.opacity = 0.9;
  }
  const material = new THREE.LineBasicMaterial(materialproperties);
  // material.depthTest = false;

  const lines = new THREE.LineSegments(geometry, material);

  lines.frustumCulled = false;
  // lines.renderOrder = 999;

  scene.scene.add(lines);

  resizeMesh(lines);

  return lines;
}
window.addLine = addLine

function frameUpdate(){
  const Rm = scale.y.max;
  const Xn = scale.x.min - Rm;
  const Xm = scale.x.max + Rm;
  const Yd = 2 * Rm;
  const Zd = - 2 * Rm;

  const vertices = [
    Xn, 0., 0.,
    Xn, Zd, 0.,
    Xn, Zd, Yd,
    Xm, Zd, Yd,
    Xm, Zd, 0.,
    Xm, 0., 0.,

    //  Xi, -Zd,  Yd,
    //  Xi,   0,  Yd,
    //  Xi,   0,  Ri,
  ];

  const pos = window.frameMesh.geometry.attributes.position;
  pos.array.set(vertices);
  pos.needsUpdate = true;

  resizeMesh(frameMesh)

  floorMesh.position.y = -2 * scale.y.max * scale.factor;
  floorMesh.position.x = scale.x.center * scale.factor;
}

function frameInit(){
  const vertices = Array(6 * 3).fill(0);
  const indices = [
    0, 1,  1, 2,  2, 3,  3, 4,  4, 5,  5, 0,
  ];

  window.frameMesh = addLine([vertices, indices], 0xffffff);
}

function addMeshLine([vertices, indices], color = 0xff0000) {
  if (vertices.length == 0) return;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);

  const line = new MeshLine();
  line.setGeometry(geometry);

  const material = new MeshLineMaterial({ color: color, lineWidth: 5, });

  const mesh = new THREE.Mesh(line, material);

  scene.scene.add(mesh);

  resizeMesh(mesh);

  return mesh;
}
window.addMeshLine = addMeshLine

function getBetaI(x, r, i){
  let j = i;

  if (i == 0           ) j = i + 1;
  if (i == x.length - 1) j = i - 1;

  let beta = Math.atan((r[j] - r[j-1]) / (x[j] - x[j-1]));

  if (Math.abs(beta) < 0.001) beta = 0.0;

  return beta;
}

function pointXYZ(coil, i, fiShift = 0., th = 0., yShift = 0.0, mirror = undefined){
  let sbth = 0., cbth = 0.;

  if (th != 0.) {
      const bi = getBetaI(coil["x"], coil["r"], i);
      sbth = th * Math.sin(bi);
      cbth = th * Math.cos(bi);
  };

  let x  = coil.x [i];
  let r  = coil.r [i];
  let fi = coil.fi[i];

  fi += fiShift;

  let cXi = (x - sbth);
  let cYi = (r + cbth) * Math.sin(fi) + yShift;
  let cZi = (r + cbth) * Math.cos(fi);

  // if (i < 5) console.log(i, th)
  // if (i = 2368 && window.debug) {
  //     console.log(fi, r, x, cXi, cYi, cZi, window.debug)
  // }

  if (mirror) {
      cXi = mirror[0] * 2 - cXi;
      cYi = mirror[1] * 2 - cYi;
      cZi = mirror[2] * 2 - cZi;
  };

  return [cXi, cYi, cZi];
}
window.pointXYZ = pointXYZ;

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

// scene.scene.add(mesh);


function removeMesh(object) {
  if (!object) return;

  if (object.geometry) {
    object.geometry.dispose(); // Освобождаем ресурсы геометрии
  }

  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose()); // Освобождаем ресурсы материалов
    } else {
      object.material.dispose();
    }
  }

  scene.scene.remove(object); // Удаляем объект из сцены
}
window.removeMesh = removeMesh

function clearScene() {
  const toRemove = [];
  scene.scene.traverse((object) => {
    if (
        (object.type == "Mesh" || object.type == "LineSegments")
     && (object != window.floorMesh && object != window.frameMesh)
    ) {
      toRemove.push(object);
    }
  });
  toRemove.forEach((object) => {
    removeMesh(object);
  });
}
window.clearScene = clearScene
