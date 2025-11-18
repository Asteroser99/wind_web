import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

window.scene = { scene: null, renderer: null, camera: null, controls: null, canvas: null}
window.scale = { x: {}, y: {}, z: {}, factor: 1 };
window.meshes = {}

window.stanokScale = { y: 1.8, z: 1.5};

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
  if (!scene.canvas)
    return
  
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
  const safetyR = await layerPropGet("safetyR");

  { // frameLine
    const vertices = Array(6 * 3).fill(0);
    const indices = [
      0, 1,  1, 2,  2, 3,  3, 4,  4, 5,  5, 0,
    ];

    const Rm = scale.y.max;
    const Xn = scale.x.min - (Rm);
    const Xm = scale.x.max + (Rm);
    const Yd = + ((Rm + safetyR) * stanokScale.y);
    const Zd = - ((Rm + safetyR) * stanokScale.z);

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
    const Zi = Fr * stanokScale.z + safetyR;

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

      vert.push(Xi - Fd * 2,  Yi - Fd,  Fr * 2 + safetyR);
      vert.push(Xi - Fd * 2,  Yi + Fd,  Fr * 2 + safetyR);
      vert.push(Xi + Fd * 2,  Yi + Fd,  Fr * 2 + safetyR);
      vert.push(Xi + Fd * 2,  Yi - Fd,  Fr * 2 + safetyR);
      
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


  if (window.animateChain) { // chain
    const machine = await layerPropGet("machine");

    const i = 0
    for (let j = 0; j < window.animateChain.length; j += 1) {
      const ch = window.animateChain[j]
      const x0 = 0; const y0 = 0; const z0 = 0;
      const xD = ch.sx[i]
      const yD = ch.sz[i]
      const zD = ch.sy[i]

      // const vert = [];
      // vert.push(x0 - xD * 0.5,  y0,  z0 - zD * 0.5);
      // vert.push(x0 - xD * 0.5,  y0,  z0 + zD * 0.5);
      // vert.push(x0 + xD * 0.5,  y0,  z0 + zD * 0.5);
      // vert.push(x0 + xD * 0.5,  y0,  z0 - zD * 0.5);

      // vert.push(x0 - xD * 0.5,  y0 + yD,  z0 - zD * 0.5);
      // vert.push(x0 - xD * 0.5,  y0 + yD,  z0 + zD * 0.5);
      // vert.push(x0 + xD * 0.5,  y0 + yD,  z0 + zD * 0.5);
      // vert.push(x0 + xD * 0.5,  y0 + yD,  z0 - zD * 0.5);
      
      // const indices = [];
      // indices.push(0, 1, 2,  2, 3, 0);
      // indices.push(4, 5, 6,  6, 7, 4);

      // indices.push(0, 4, 5,  5, 1, 0);
      // indices.push(1, 5, 6,  6, 2, 1);
      // indices.push(2, 6, 7,  7, 3, 2);
      // indices.push(3, 7, 4,  4, 0, 3);

      // const mesh = meshCreate([vert, indices], 0x00ffff, 0.3);

      const opacity = j < window.animateChain.length - 1 ? .5 : 1.;
      const mesh = await meshCreateFromFile(machine + "_" + j, opacity);

      mesh.visible = false;

      // Bounding box
      const box = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      // Масштаб по осям
      const scaleX = (xD * scale.factor) / size.x;
      const scaleY = (yD * scale.factor) / size.y;
      const scaleZ = (zD * scale.factor) / size.z;

      mesh.scale.set(scaleX, scaleY, scaleZ);

      // После скейла надо пересчитать
      const newBox = new THREE.Box3().setFromObject(mesh);
      const newSize = new THREE.Vector3();
      const newCenter = new THREE.Vector3();
      newBox.getSize(newSize);
      newBox.getCenter(newCenter);

      // Сдвигаем: центр по XY → в (0,0), нижняя грань по Z → в 0
      mesh.position.x -= newCenter.x;
      mesh.position.y -= newCenter.y;
      mesh.position.z -= newBox.min.z; // дно к нулю      

      meshSet("chain" + j, mesh);
    }
  };

}
window.frameInit = frameInit

async function floorInit(){
  const safetyR = await layerPropGet("safetyR");
  
  { // floorMesh
    floorMesh.position.y = -stanokScale.z * (scale.y.max + safetyR) * scale.factor;
    floorMesh.position.x = scale.x.center * scale.factor;

    floorShadowMesh.position.y = floorMesh.position.y;
    floorShadowMesh.position.x = floorMesh.position.x;
  }
}
window.floorInit = floorInit


// meshes

function meshResize(mesh) {
  mesh.scale.set(scale.factor, scale.factor, scale.factor);
}

function meshCreate(render, color = 0x4444FF, opacity = 1., setScale = false) {
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

  if (opacity != 1.) {
    material.transparent = true;
    material.opacity = opacity;
  }


  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  mesh.castShadow = true;
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

async function meshCreateFromFile(fileName, opacity = 1.) {
  const loader = new GLTFLoader().setPath('gltf/');
  const gltf = await loader.loadAsync(fileName + '.gltf'); // <-- правильный async-метод
  const mesh = gltf.scene;

  // meshResize(mesh);

  mesh.position.set(0, 1.05, -1);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.traverse((child) => {
    if (child.isMesh) {
      // child.material = new THREE.MeshStandardMaterial({ color: 0x00ffff });
      child.castShadow = true;
      child.receiveShadow = false;
      if (opacity != 1.) {
        child.material.transparent = true;
        child.material.opacity = opacity;
      }
    }
  });
  
  scene.scene.add(mesh);

  return mesh;
}

function meshCreateBox(x, y, z) {
  const geometry = new THREE.BoxGeometry(2, 2, 2);

  const textureLoader = new THREE.TextureLoader();

  // const colorTexture = textureLoader.load('Pic.jpg');
  // colorTexture.wrapS = THREE.RepeatWrapping;
  // colorTexture.wrapT = THREE.RepeatWrapping;
  // colorTexture.repeat.set(2, 2);

  const material = new THREE.MeshStandardMaterial({
    // map: colorTexture,
    roughness: 0.3,
    metalness: 0.5,
  });

  const cube = new THREE.Mesh(geometry, material);
  // cube.castShadow = true;
  // cube.receiveShadow = true;
  cube.position.set(x, y, z);

  meshResize(cube);

  scene.scene.add(cube);
}

function meshRotate(mesh, rx, ry, rz) {
    // ===== недорабочий вариант
    // const globalRotMatrix = new THREE.Matrix4().makeRotationFromEuler(
    //   new THREE.Euler(rx, rz, -ry, 'XYZ')
    // );
    // mesh.setRotationFromMatrix(globalRotMatrix);

    // =====
    // const globalRotMatrix = new THREE.Matrix4().makeRotationFromEuler(
    //   new THREE.Euler(rx, rz, -ry, 'XYZ')
    // );
    // mesh.setRotationFromMatrix(globalRotMatrix);

    // =====
    // mesh.setRotationFromEuler(new THREE.Euler(rx, rz, ry, 'XYZ'));

    // =====
    // const euler = new THREE.Euler(rx, rz, ry, 'XYZ');
    // const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);
    // mesh.matrix.identity()
    // mesh.applyMatrix4(rotMatrix);  

    // =====
    mesh.rotation.order = 'XYZ';
    mesh.rotation.x =  rx;
    mesh.rotation.y =  rz;
    mesh.rotation.z =  ry;

}
window.meshRotate = meshRotate

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


  const aspect = 1.;
  const frustumSize = 500.;

  scene.camera = new THREE.OrthographicCamera(
    (frustumSize * aspect) / -2,
    (frustumSize * aspect) /  2,
    frustumSize / 2,
    frustumSize / -2,
    0.0001, 200
  );
  scene.camera.position.set(40., 80., 80.);
  scene.camera.lookAt(0, 0, 0);

  scene.camera.zoom = 0.6;
  scene.camera.updateProjectionMatrix();

  // Первая координата (X) → Вдоль горизонтальной оси (вправо-влево)
  // Вторая координата (Y) → Вдоль вертикальной оси (вверх-вниз)
  // Третья координата (Z) → Вдоль глубины сцены (вперёд-назад)

  const lr = 35; // tetraedr
  const lights = [
    [0, 0, -lr],
    [0, -2*Math.sqrt(2)/3 * lr,lr/3],
    [ Math.sqrt(6)/3 * lr, Math.sqrt(2)/3 * lr, lr/3],
    [-Math.sqrt(6)/3 * lr, Math.sqrt(2)/3 * lr, lr/3],
  ];

  lights.forEach(vertex => {
    const light = new THREE.SpotLight(0xffffff, 5000, 1000, Math.PI / 4, 1.0, 2.0);
    light.position.set(...vertex);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

//    light.shadow.mapSize.width = 1024;
//    light.shadow.mapSize.height = 1024;
//    light.shadow.camera.near = 0.5;
//    light.shadow.camera.far = 500;
    light.shadow.focus = 1.0; // влияет на чёткость

    scene.scene.add(light.target);
    scene.scene.add(light);

    // meshCreateBox(...vertex)
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

  let mesh

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
  uniform float lineThickness;

  void main() {
      float dist = distance(vUv, uCenter); // main fading
      float alpha = smoothstep(1.0, 0.0, dist * uFade); 

      // square grid
      vec2 grid = mod(vUv * uGridSize, 1.0);
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
          uFade: { value: 5.0 },
          uGridSize: { value: 60.0 },
          lineThickness: { value: 0.015 },
      },
      transparent: true
  });
  
  // create PlaneGeometry and apply shader
  mesh = new THREE.Mesh(
    // new THREE.PlaneGeometry(100, 100, 10, 10),
    new THREE.CircleGeometry(100, 32),
    material
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  meshResize(mesh);

  window.floorMesh = mesh;
  scene.scene.add(mesh);


  // Shadow plane
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.025 }); 
  shadowMat.polygonOffset = true;
  shadowMat.polygonOffsetFactor = -1;
  shadowMat.polygonOffsetUnits  = -1;

  mesh = new THREE.Mesh(
    new THREE.CircleGeometry(100, 32),
    shadowMat
  );

  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  window.floorShadowMesh = mesh;
  scene.scene.add(mesh);
}

function rotateX(point, fi) {
  const [ x, y, z ] = point;
  const cos = Math.cos(fi);
  const sin = Math.sin(fi);

  return [
    x,
    y * cos - z * sin,
    y * sin + z * cos
  ];
}

async function setRolley() {
    const chain = await layerPropGet("chain");
    const rolley = chain[chain.length - 1]

    const machine = await layerPropGet("machine");
    const TS      = await layerPropGet("equidistantaInterpolated");
    const MTU     = await layerPropGet("MTU");

    const res = []
    rolley.x.forEach((_, i) => {
      const x  =  rolley.x [i];
      const y  =  rolley.z [i];
      const z  = -rolley.y [i];
      const rx =  rolley.rx[i];
      const ry =  rolley.rz[i];
      const rz =  rolley.ry[i];
      const sx =  rolley.sx[i];
      const sy =  rolley.sz[i];
      const sz =  rolley.sy[i];

      let FI
      if (machine == "RPN") {
          const supportAngle = 15.
          FI = TS.fi[i] + supportAngle * Math.PI / 180.
      } else {
          const supportAngle = 10.
          FI = MTU[0].fi[i] + supportAngle * Math.PI / 180.
      }

      const euler = new THREE.Euler(rx, ry, rz, 'XYZ');
      const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);

      const p1 = new THREE.Vector3(-sx * 0.5, 0, 0).applyMatrix4(rotMatrix);
      const p2 = new THREE.Vector3( sx * 0.5, 0, 0).applyMatrix4(rotMatrix);

      const r1 = rotateX([x + p1.x, y + p1.y, z + p1.z], -FI)
      const r2 = rotateX([x + p2.x, y + p2.y, z + p2.z], -FI)

      res.push([r1, r2]);
    });

  await layerPropSet("chainRolley", res)
}
window.setRolley = setRolley

async function threeOnLoad() {
    sceneOnLoad();
    floorOnLoad();
}
window.threeOnLoad = threeOnLoad
