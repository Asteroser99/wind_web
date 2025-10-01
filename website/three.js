import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

window.scene = { scene: null, renderer: null, camera: null, controls: null, canvas: null}
window.scale = { x: {}, y: {}, z: {}, factor: 1 };
window.meshes = {}

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
window.scaleSet = scaleSet

function dashedMaterial(color){
        return new THREE.LineDashedMaterial({
            color: color,
            linewidth: 1,
            scale: 1,
            dashSize: 3,   // длина штриха
            gapSize: 1,    // длина пробела
        });
}
window.dashedMaterial = dashedMaterial

function createGradientTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `hsl(139, 70%, 80%)`);
    gradient.addColorStop(1, `hsl(208, 70%, 80%)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    scene.scene.background = texture;
    return texture;
}

function resizeScene() {
  const parent = scene.canvas.parentElement;

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
  scene.camera.updateProjectionMatrix();
}
window.resizeScene = resizeScene

window.addEventListener('resize', () => {
  resizeScene();
});

async function frameInit(){
  const Fr = scale.y.max;
  const Fd = Fr / 50;
  const SR = await layerPropGet("safetyR");

  { // frameLine
    const vertices = Array(6 * 3).fill(0);
    const indices = [
      0, 1,  1, 2,  2, 3,  3, 4,  4, 5,  5, 0,
    ];

    const Rm = scale.y.max;
    const SR = await layerPropGet("safetyR");
    const Xn = scale.x.min - (Rm + SR);
    const Xm = scale.x.max + (Rm + SR);
    const Yd = + (Rm * 1.5 + SR);
    const Zd = - (Rm * 2);

    const posVertices = [
      Xn, 0., 0.,
      Xn, Zd, 0.,
      Xn, Zd, Yd,
      Xm, Zd, Yd,
      Xm, Zd, 0.,
      Xm, 0., 0.,
    ];

    const mesh = meshCreateLine([vertices, indices], 0xffffff)

    const pos = mesh.geometry.attributes.position;
    pos.array.set(posVertices);
    pos.needsUpdate = true;

    meshResize(mesh)

    mesh.visible = false;

    meshSet("frameLine", mesh);
  }

  { // standMesh
    const Xi = 0;
    const Yi = 0;
    const Zi = Fr * 1.5 + SR;

    const vert = [];
    vert.push(Xi - Fd * 8,  Yi - Fr * 2,  Zi - Fd * 4);
    vert.push(Xi - Fd * 8,  Yi + Fd * 8,  Zi - Fd * 4);
    vert.push(Xi + Fd * 8,  Yi + Fd * 8,  Zi - Fd * 4);
    vert.push(Xi + Fd * 8,  Yi - Fr * 2,  Zi - Fd * 4);

    vert.push(Xi - Fd * 8,  Yi - Fr * 2,  Zi + Fd * 4);
    vert.push(Xi - Fd * 8,  Yi + Fd * 8,  Zi + Fd * 4);
    vert.push(Xi + Fd * 8,  Yi + Fd * 8,  Zi + Fd * 4);
    vert.push(Xi + Fd * 8,  Yi - Fr * 2,  Zi + Fd * 4);
    
    const indices = [];
    indices.push(0, 1, 2,  2, 3, 0);
    indices.push(4, 5, 6,  6, 7, 4);

    indices.push(0, 4, 5,  5, 1, 0);
    indices.push(1, 5, 6,  6, 2, 1);
    indices.push(2, 6, 7,  7, 3, 2);
    indices.push(3, 7, 4,  4, 0, 3);

    const mesh = meshCreate([vert, indices], 0x00ffff, 0.3);
    mesh.visible = false;
    meshSet("standMesh", mesh);
  }

  { // carretMesh
      const Xi = 0;
      const Yi = 0;
      const Zi = Fr * 2;

      const vert = [];
      vert.push(Xi - Fd * 2,  Yi - Fd,  Fd * 4);
      vert.push(Xi - Fd * 2,  Yi + Fd,  Fd * 4);
      vert.push(Xi + Fd * 2,  Yi + Fd,  Fd * 4);
      vert.push(Xi + Fd * 2,  Yi - Fd,  Fd * 4);

      vert.push(Xi - Fd * 2,  Yi - Fd,  Fr * 2 + SR);
      vert.push(Xi - Fd * 2,  Yi + Fd,  Fr * 2 + SR);
      vert.push(Xi + Fd * 2,  Yi + Fd,  Fr * 2 + SR);
      vert.push(Xi + Fd * 2,  Yi - Fd,  Fr * 2 + SR);
      
      const indices = [];
      indices.push(0, 1, 2,  2, 3, 0);
      indices.push(4, 5, 6,  6, 7, 4);

      indices.push(0, 4, 5,  5, 1, 0);
      indices.push(1, 5, 6,  6, 2, 1);
      indices.push(2, 6, 7,  7, 3, 2);
      indices.push(3, 7, 4,  4, 0, 3);

      const mesh = meshCreate([vert, indices], 0x00ffff, 0.3);
      mesh.position.z = Zi * scale.factor
      mesh.visible = false;
      meshSet("carretMesh", mesh);
  };


  { // chain
    const coilCorrected = await coilGet("Corrected");

    const TK = await coilGet     ("Interpolated"            );
    const TU = await layerPropGet("equidistantaInterpolated");

    window.chain = await lambdaCall("calc.chain", ["RPN", TK, TU, null, null])

    console.log(window.chain)
    console.log(scale)

    const i = 0
    for (let j = 0; j < 4; j += 1) {
      const ch = window.chain[j]
      const x0 = 0; const y0 = 0; const z0 = 0;
      const xD = ch.sx[i]
      const yD = ch.sz[i]
      const zD = ch.sy[i]

      const vert = [];
      vert.push(x0 - xD * 0.5,  y0,  z0 - zD * 0.5);
      vert.push(x0 - xD * 0.5,  y0,  z0 + zD * 0.5);
      vert.push(x0 + xD * 0.5,  y0,  z0 + zD * 0.5);
      vert.push(x0 + xD * 0.5,  y0,  z0 - zD * 0.5);

      vert.push(x0 - xD * 0.5,  y0 + yD,  z0 - zD * 0.5);
      vert.push(x0 - xD * 0.5,  y0 + yD,  z0 + zD * 0.5);
      vert.push(x0 + xD * 0.5,  y0 + yD,  z0 + zD * 0.5);
      vert.push(x0 + xD * 0.5,  y0 + yD,  z0 - zD * 0.5);
      
      const indices = [];
      indices.push(0, 1, 2,  2, 3, 0);
      indices.push(4, 5, 6,  6, 7, 4);

      indices.push(0, 4, 5,  5, 1, 0);
      indices.push(1, 5, 6,  6, 2, 1);
      indices.push(2, 6, 7,  7, 3, 2);
      indices.push(3, 7, 4,  4, 0, 3);

      const mesh = meshCreate([vert, indices], 0x00ffff, 0.3);
      mesh.visible = false;

      meshSet("chain" + j, mesh);
    }
  };

}
window.frameInit = frameInit

async function floorInit(){
  { // floorMesh
    floorMesh.position.y = -2 * scale.y.max * scale.factor;
    floorMesh.position.x = scale.x.center * scale.factor;
  }
}
window.floorInit = floorInit


// meshes

function meshResize(mesh) {
  mesh.scale.set(scale.factor, scale.factor, scale.factor);
}

function meshCreate(render, color = 0x4444FF, transparent = 1., setScale = false) {
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


  const material = new THREE.MeshStandardMaterial({
    // map: colorTexture,
    // normalMap: normalTexture,
    // roughnessMap: roughnessTexture,
    roughness: 0.3,
    metalness: 0.5,
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

    const center = box.getCenter(new THREE.Vector3());  // Object center

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

    scene.controls.target.set(center.x * scale.factor, center.y * scale.factor, center.z * scale.factor); // rotation centre 0, 0, 0
    scene.controls.update();

  }

  meshResize(mesh);

  return mesh;
}
window.meshCreate = meshCreate

function meshCreateLine([vertices, indices], color = 0xff0000, transparent = false, dashed = false) {
  if (vertices.length == 0) return;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);

  const materialproperties = { color: color };
  if (transparent) {
    materialproperties.transparent = true;
    materialproperties.opacity = 0.9;
  }

  let material;
  if (!dashed) {
    material = new THREE.LineBasicMaterial(materialproperties);
  } else {
    material = new THREE.LineDashedMaterial(materialproperties);
    material.linewidth = 1;
    material.scale = 1;
    material.dashSize = 3;
    material.gapSize = 1;
  }

  const lines = new THREE.LineSegments(geometry, material);

  lines.frustumCulled = false;

  scene.scene.add(lines);

  meshResize(lines);

  return lines;
}
window.meshCreateLine = meshCreateLine

function meshCreateMeshLine([vertices, indices], color = 0xff0000) {
  if (vertices.length == 0) return;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);

  const line = new MeshLine();
  line.setGeometry(geometry);

  const material = new MeshLineMaterial({ color: color, lineWidth: 5, });

  const mesh = new THREE.Mesh(line, material);

  scene.scene.add(mesh);

  meshResize(mesh);

  return mesh;
}

function meshCreateFromFile() {
  const loader = new GLTFLoader().setPath('img/');
  loader.load('scene.gltf', (gltf) => {
    const mesh = gltf.scene;

    meshResize(mesh);

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

function meshCreateBox() {
  const geometry = new THREE.BoxGeometry(2, 2, 2);

  const textureLoader = new THREE.TextureLoader();

  const colorTexture = textureLoader.load('Pic.jpg');

  colorTexture.wrapS = THREE.RepeatWrapping;
  colorTexture.wrapT = THREE.RepeatWrapping;
  colorTexture.repeat.set(2, 2);

  const material = new THREE.MeshStandardMaterial({
    map: colorTexture,
    roughness: 0.3,
    metalness: 0.5,
  });

  const cube = new THREE.Mesh(geometry, material);
  // cube.castShadow = true;
  // cube.receiveShadow = true;
  cube.position.set(3, 2.0, -1);

  meshResize(cube);

  scene.scene.add(cube);
}

function meshSet(name, mesh) {
    meshRemove(name);
    if (mesh)
        meshes[name] = mesh;

    scene.scene.add(mesh);
}
window.meshSet = meshSet

function meshRemove(name) {
    const mesh = meshes[name];
    if (!mesh) return;

    meshes[name] = null;

    if (mesh.geometry) {
        mesh.geometry.dispose(); // free geometry resources
    }

    if (mesh.material) {
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose()); // free materials
        } else {
            mesh.material.dispose();
        }
    }

    scene.scene.remove(mesh);
}
window.meshRemove = meshRemove

function meshClear() {
  // const toRemove = [];
  // scene.scene.traverse((object) => {
  //   if (
  //       (object.type == "Mesh" || object.type == "LineSegments")
  //    && (object != meshes.floorMesh && object != meshes.frameLine")
  //   ) {
  //     toRemove.push(object);
  //   }
  // });
  // toRemove.forEach((object) => {
  //   meshRemove(object);
  // });

  for (const key of Object.keys(meshes)) {
    if (key === "frameLine") continue;
    meshRemove(key);
  }
}
window.meshClear = meshClear


// onLoad

function sceneOnLoad() {
  scene.canvas = document.getElementById('scene-canvas')

  scene.scene = new THREE.Scene();
  scene.renderer = new THREE.WebGLRenderer({
    canvas: scene.canvas,
    antialias: true,
    alpha: true,
  });

  scene.renderer.domElement.style.minWidth  = '0';
  scene.renderer.domElement.style.minHeight = '0';

  scene.renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene.renderer.setClearColor(0x9ACBD0);
  scene.renderer.setPixelRatio(window.devicePixelRatio);
  scene.renderer.shadowMap.enabled = true;
  scene.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const axesHelper = new THREE.AxesHelper(15);
  scene.scene.add(axesHelper);

  createGradientTexture();


  scene.camera = new THREE.OrthographicCamera(
    -1, 1, 1, -1,
    0.1, 1000
  );
  scene.camera.position.set(10., 20., 20.);
  scene.camera.lookAt(0, 0, 0);

  // Первая координата (X) → Вдоль горизонтальной оси (вправо-влево)
  // Вторая координата (Y) → Вдоль вертикальной оси (вверх-вниз)
  // Третья координата (Z) → Вдоль глубины сцены (вперёд-назад)

  const x = 20; // tetraedr
  const sh = x / Math.sqrt(3);

  const lights = [
    [-sh, x, 0],
    [-sh, -x, 0],
    [sh, 0, x],
    [sh, 0, -x]
  ];

  lights.forEach(vertex => {
    const light = new THREE.SpotLight(0xffffff, 5000, 30, 1.0, 2);
    light.position.set(...vertex);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    scene.scene.add(light.target);
    scene.scene.add(light);
  });

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

  scaleSet();
}

function floorOnLoad() {

  // floor
  const vertexShader = `
  varying vec2 vUv;
  void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `;
  
  const fragmentShader = `
  varying vec2 vUv;
  uniform vec2 uCenter;
  uniform float uFade;
  uniform float uGridSize;

  void main() {
      float dist = distance(vUv, uCenter); // main fading
      float alpha = smoothstep(1.0, 0.0, dist * uFade); 

      // square grid
      vec2 grid = mod(vUv * uGridSize, 1.0);
      float lineThickness = 0.02;
      float gridLines = max(step(grid.x, lineThickness), step(grid.y, lineThickness));

      float gridAlpha = gridLines * alpha; // main fading for grid

      vec3 baseColor = vec3( 72. / 256., 166. / 256., 167. / 256.);
      vec3 gridColor = vec3(154. / 256., 203. / 256., 208. / 256.);

      // mixing colors
      vec3 finalColor = mix(baseColor, gridColor, gridAlpha);

      gl_FragColor = vec4(finalColor, alpha);
  }`;

  const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
          uCenter: { value: new THREE.Vector2(0.5, 0.5) },
          uFade: { value: 4.0 },
          uGridSize: { value: 70.0 },
        },
      transparent: true
  });
  
  // create PlaneGeometry and apply shader
  const geometry = new THREE.PlaneGeometry(100, 100, 10, 10);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;

  meshResize(mesh);

  scene.scene.add(mesh);

  window.floorMesh = mesh;
}

async function threeOnLoad() {
    sceneOnLoad();
    floorOnLoad();
}
window.threeOnLoad = threeOnLoad
