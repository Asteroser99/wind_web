let isMouseDown = false;
let moveForward = false;
let moveBackward = false;
let keyStates = {};

let velocity = 0;
const acceleration = 0.5;
const deceleration = 0.02;
const maxSpeed = 0.2;

document.addEventListener('contextmenu', e => e.preventDefault());

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

keys3 = 'xyz'
keys4 = ["xyz", "wyz", "wxy", "wxz"];

function Vector4to3(v4, v3, i, add = false) {
    for (let j = 0; j < 3; j++) {
        const key3 = keys3[j];
        const key4 = keys4[i][j];
        v3[key3] = (add ? v3[key3] : 0) + v4[key4];
    }
}

function Vector3to4(v3, v4, i, add = false) {
    for (let j = 0; j < 3; j++) {
        const key3 = keys3[j];
        const key4 = keys4[i][j];
        v4[key4] = (add ? v4[key4] : 0) + v3[key3];
    }
}

class camerasClass {
    constructor() {
        this.list = [];
        this.position = new THREE.Vector4(0,0,0,0);
    }

    spread(i) {
        const camera = this.list[i]
        Vector3to4(camera.position, this.position, i);

        for (let j = 0; j < this.list.length; j++) {
            if (i == j) continue;
            const curCam = this.list[j];

            for (const keyi of keys4[i]) {
                for (const keyj of keys4[j]) {
                    if (keyi != keyj) continue;
                    curCam.position[keyj] = camera.position[keyi];
                    curCam.rotation[keyj] = camera.rotation[keyi];
                }
            }
        }
    }
}
cameras = new camerasClass()

const scenes = [], viewports = [], hcubes = [];
const colors = {
    "w": new THREE.Color(0xffff00),
    "x": new THREE.Color(0xff0000),
    "y": new THREE.Color(0x00ff00),
    "z": new THREE.Color(0x0000ff)
};
const linkedMeshes = [];
let activeIndex = -1; // никакая секция не выбрана

renderer.domElement.addEventListener('mousemove', event => {
    const x = event.clientX;
    const y = window.innerHeight - event.clientY; // инвертируем Y для WebGL

    activeIndex = -1;

    for (let i = 0; i < viewports.length; i++) {
        const { vx, vy, vw, vh } = viewports[i];
        if (x >= vx && x <= vx + vw && y >= vy && y <= vy + vh) {
            activeIndex = i;
            break;
        }
    }
});

renderer.domElement.addEventListener('mousedown', event => {
    if (activeIndex === -1) return;

    const x = event.clientX;
    const y = window.innerHeight - event.clientY; // инвертируем Y для WebGL

    const camera   = cameras.list[activeIndex];
    const viewport = viewports[activeIndex];

    if (event.button == 0 || event.button == 2) {
        mouse.x = ((x - viewport.vx) / viewport.vw) * 2 - 1;
        mouse.y = ((y - viewport.vy) / viewport.vh) * 2 - 1;

        raycaster.setFromCamera(mouse, camera);
        // const intersects = raycaster.intersectObject(cube);

        const cubes = []
        for (const hcube of hcubes) {
            cubes.push(hcube.meshes[activeIndex]);
        }
        const intersects = raycaster.intersectObjects(cubes, true);

        // intersects[0] — первый по лучу
        if (intersects.length > 0) {
            const cube = intersects[0].object;
            const face = intersects[0].face;

            // const colorAttr = cube.geometry.attributes.color;
            // const r = Math.random();
            // const g = Math.random();
            // const b = Math.random();

            // const indices = [face.a, face.b, face.c];
            // for (const i of indices) {
            //     colorAttr.setXYZ(i, r, g, b);
            // }
            // colorAttr.needsUpdate = true;

            const pushStrength = 0.02;
            const normal = face.normal.clone().transformDirection(cube.matrixWorld);
            const direction = (event.button === 0) ? -1 : 1;
            const impulse = normal.multiplyScalar(direction * pushStrength);

            Vector3to4(impulse, cube.userData.parent.velocity, activeIndex, add = true)
        }

    } else if (event.button == 1) {
        activeIndex = (activeIndex === i) ? -1 : i;

    }
});

document.addEventListener('wheel', e => {
    moveForward = e.deltaY < 0;
    moveBackward = e.deltaY > 0;
});

document.addEventListener('keydown', e => keyStates[e.code] = true );
document.addEventListener('keyup'  , e => keyStates[e.code] = false);

function createScene() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.position.set(0, 1.6, 5);

    const x = 25; // tetraedr
    const sh = x / Math.sqrt(3);

    const lights = [
        [-sh,  x,  0],
        [-sh, -x,  0],
        [ sh,  0,  x],
        [ sh,  0, -x]
    ];

    lights.forEach(vertex => {
        const light = new THREE.SpotLight(0xffffff, 5000, 0);
        light.position.set(...vertex);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        scene.add(light.target);
        scene.add(light);
    });

    scenes.push(scene);
    cameras.list.push(camera);
}
for (let i = 0; i < 4; i++) createScene();


class HyperCube {
    constructor() {
        this.meshes = []; // массива из 4-мешей
        this.velocity = new THREE.Vector4(0,0,0,0);

        this.position = new THREE.Vector4();
        this.position.w = Math.random() * 30 - 15;
        this.position.x = Math.random() * 30 - 15;
        this.position.y = Math.random() * 30 - 15;
        this.position.z = Math.random() * 30 - 15;

        for (let i = 0; i < 4; i++) {
            const scene = scenes[i];

            // for (let i = 0; i < faceCount; i++) {
            //     colors.push(1, 1, 1); // белый по умолчанию
            // }


            const geometry = new THREE.BoxGeometry();

            const geometryColors = [];

            const colorX = colors[keys4[i][0]];
            const colorY = colors[keys4[i][1]];
            const colorZ = colors[keys4[i][2]];

            // BoxGeometry groups:
            // 0: +X; 1: -X; 2: +Y; 3: -Y; 4: +Z; 5: -Z

            const faceColors = [colorX, colorX, colorY, colorY, colorZ, colorZ];

            // Записываем цвета по вершинам
            for (let groupIdx = 0; groupIdx < faceColors.length; groupIdx++) {
                const color = faceColors[groupIdx];
            
                // В каждом групе 2 треугольника = 6 вершин
                for (let i = 0; i < 4; i++) {
                    geometryColors.push(color.r, color.g, color.b);
                }
            }

            geometry.setAttribute('color', new THREE.Float32BufferAttribute(geometryColors, 3));


            const material = new THREE.MeshStandardMaterial({
                vertexColors: true,
                flatShading: true
            });

            const mesh = new THREE.Mesh(geometry, material);

            for (let j = 0; j < 3; j++) {
                const key3 = keys3[j];
                const key4 = keys4[i][j];
                mesh.position[key3] = this.position[key4];
            }

            mesh.userData = {
                parent: this,
                index: i,
                get velocityVector3() {
                    const v = new THREE.Vector3(0, 0, 0);
                    for (let j = 0; j < 3; j++) {
                        const key3 = keys3[j];
                        const key4 = keys4[i][j];
                        v[key3] = this.parent.velocity[key4];
                    }
                    return v;
                },
            };

            scene.add(mesh);

            this.meshes.push(mesh);
        }
    }
}

function createCubes() {
    hcubes.push(new HyperCube());
    hcubes.push(new HyperCube());
    hcubes.push(new HyperCube());
}
createCubes()


function animate() {
    requestAnimationFrame(animate);

    if (activeIndex != -1){
        const camera = cameras.list[activeIndex];

        const rotSpeed = 0.02;

        if (keyStates['KeyA']) camera.rotateY( rotSpeed); // yaw left
        if (keyStates['KeyD']) camera.rotateY(-rotSpeed); // yaw right
        if (keyStates['KeyW']) camera.rotateX(-rotSpeed); // pitch up
        if (keyStates['KeyS']) camera.rotateX( rotSpeed); // pitch down
        if (keyStates['KeyQ']) camera.rotateZ( rotSpeed); // roll left
        if (keyStates['KeyE']) camera.rotateZ(-rotSpeed); // roll right

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
        const right   = new THREE.Vector3(1, 0,  0).applyQuaternion(camera.quaternion).normalize();
        const up      = new THREE.Vector3(0, 1,  0).applyQuaternion(camera.quaternion).normalize();

        // Ускорение / торможение вперёд/назад
        if (moveForward) velocity += acceleration;
        if (moveBackward) velocity -= acceleration;
        if (!moveForward && !moveBackward) {
            if (velocity > 0) velocity -= deceleration;
            if (velocity < 0) velocity += deceleration;
            if (Math.abs(velocity) < deceleration) velocity = 0;
        }
        velocity = Math.max(-maxSpeed, Math.min(maxSpeed, velocity));

        camera.position.add(forward.clone().multiplyScalar(velocity));

        moveForward  = false;
        moveBackward = false;

        const strafeSpeed = 0.05;
        if (keyStates['ArrowLeft'] ) camera.position.add(right.clone().multiplyScalar(-strafeSpeed));
        if (keyStates['ArrowRight']) camera.position.add(right.clone().multiplyScalar( strafeSpeed));
        if (keyStates['ArrowUp']   ) camera.position.add(up   .clone().multiplyScalar( strafeSpeed));
        if (keyStates['ArrowDown'] ) camera.position.add(up   .clone().multiplyScalar(-strafeSpeed));

        // console.log(camera.position, camera.rotation);

        cameras.spread(activeIndex);
    }


    for (const hcube of hcubes) {
        for (const cube of hcube.meshes) {
            Vector4to3(hcube.velocity, cube.position, cube.userData.index, add=true)
        }
        hcube.velocity.multiplyScalar(0.98);
    }

    const w = window.innerWidth;
    const h = window.innerHeight - 15;
    renderer.setSize(w, h);

    let sx = 0.5, sy = 0.5;
    if (activeIndex >= 0) {
        const col = activeIndex & 1;
        const row = (activeIndex >> 1) & 1;
        // sx = col ? 4 / 5 : 1 / 5;
        // sy = row ? 4 / 5 : 1 / 5;
        sx = col ? 0.5 : 0.5;
        sy = row ? 0.5 : 0.5;
    }

    for (let i = 0; i < 4; i++) {
        const col = i & 1;
        const row = (i >> 1) & 1;

        const vw = (col ? sx : (1 - sx)) * w;
        const vh = (row ? sy : (1 - sy)) * h;
        const vx = col ? w - vw : 0;
        const vy = row ? h - vh : 0;

        viewports[i] = { vx, vy, vw, vh };

        // Обновляем aspect с учётом текущего вьюпорта
        const aspect = vw / vh;
        cameras.list[i].aspect = aspect;
        cameras.list[i].updateProjectionMatrix();

        // if (i === activeIndex) {
        //     renderer.setClearColor(0x110000, 1);
        // } else {
        //     renderer.setClearColor(0x000000, 1);
        // }
        // renderer.clear();

        // Настройка рендеринга
        renderer.setViewport(vx, vy, vw, vh);
        renderer.setScissor(vx, vy, vw, vh);
        renderer.setScissorTest(true);
        renderer.setClearColor(0x111111);
        renderer.render(scenes[i], cameras.list[i]);
    }

}
animate();


renderer.domElement.addEventListener('click', (event) => {
});

// Обработка ресайза — вся логика внутри render()
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    cameras.list.forEach(cam => {
        cam.aspect = 1;
        cam.updateProjectionMatrix();
    });
});
