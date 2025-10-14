function getT(begin=0, end=0, long=false){
    if(end == 0)
        end = begin + 1;
  
    const pN = 6; // point count
    const vertices = [];
    const indices  = [];
  
    const th0 = window.tapeThicknessFirst, th = window.tapeThickness;
    const thd = th / window.animateCoil.x.length;

    for (let i = begin, thi = th0 + begin * thd; i < end; i++, thi += thd) {
        const j = (i - begin) * pN;
  
        const jCoil = j + 0;
        const pCoil = pointXYZ(window.animateCoil, i, 0, thi, window.animateCoil)
        vertices.push(...pCoil);
  
        const jTapeL = j + 1;
        const pTapeR = pointXYZ(window.animateTape, i, 0, thi, window.animateCoil)
        vertices.push(...pTapeR);
  
        const jTapeR = j + 2;
        const pTapeL = mirrorXYZ(pTapeR, pCoil)
        vertices.push(...pTapeL);


        const jEqd = j + 3;
        const pEqd = pointXYZ(window.animateEqd , i)
        vertices.push(...pEqd);

        const jRollL = j + 4;
        // const pRollL = mirrorXYZ(pRollR, pEqd)
        const pRollL = window.animateChainRolley[i][0]
        vertices.push(...pRollL);

        const jRollR = j + 5;
        // const pRollR = pointXYZ(window.animateRolley, i)
        const pRollR = window.animateChainRolley[i][1]
        vertices.push(...pRollR);
  
        
        if (long && i > 0) {
            indices.push(jEqd - pN); indices.push(jEqd);
        }
        if (i % 5 == 0) {
            indices.push(jCoil ); indices.push(jEqd  );
            indices.push(jTapeL); indices.push(jTapeR);
            indices.push(jRollL); indices.push(jRollR);
        }
    };
  
    return [vertices, indices];
  }
  window.getT = getT;

function interpolateVertices(array, DoubleT, rows) {
    const cols = 3;
    
    const row0D = 0 * cols * 3
    const row1D = 1 * cols * 3

    for (let rowI = 0; rowI <= rows; rowI++) {
        let t = rowI / rows;
        const rowID = rowI * cols * 3

        const col0D = 0 * 3;
        for (let colI = 0; colI < cols; colI++){
            const colID = colI * 3
            for (let coord = 0; coord < 3; coord++){
                let c0b  = DoubleT[row0D + col0D + coord];
                let c0e  = DoubleT[row1D + col0D + coord];

                let cIb  = DoubleT[row0D + colID + coord];
                let cIee =  DoubleT[row1D + colID + coord];

                const cIeb = cIb + c0e - c0b

                const cIeI = cIeb * (1 - t) + cIee * t;

                const cI = cIb * (1 - t) + cIeI * t;

                array[rowID + colID + coord] = cI
            }
        }
    }
}

function generateIndices(rows) {
    const newIndices = [];
    const cols = 3;
    
    for (let r = 0; r < rows; r++) {
        let i00 = r * cols;
        let i01 = i00 + 1;
        let i02 = i00 + 2;
        let i10 = (r + 1) * cols;
        let i11 = i10 + 1;
        let i12 = i10 + 2;
        newIndices.push(i00, i11, i01,  i00, i10, i11,  i00, i12, i10,  i00, i02, i12);
    }
    return newIndices;
}

async function animateInit(){
    // await setRolley()
    
    let eqdColor  = 0x9ACBD0
    let freeColor = 0xffff00

    let machine = await layerPropGet("machine");
    let coil  = await coilGet("Interpolated");
    let tape  = await layerPropGet("tapeInterpolated");
    let eqd   = await layerPropGet("equidistantaInterpolated");
    let mtu   = await layerPropGet("MTU");
    let chain = await layerPropGet("chain");
    let roll  = await layerPropGet("rolleyInterpolated");
    let chrl  = await layerPropGet("chainRolley");
    
    window.animateMachine = machine;
    window.animateCoil    = coil;
    window.animateTape    = tape;
    window.animateEqd     = eqd ;
    window.animateMTU     = mtu ;
    window.animateChain   = chain;
    window.animateRolley  = roll;
    window.animateChainRolley = chrl;

    // scaleSet();
    await floorInit();
    await frameInit();

    window.animateReady = coil != undefined && tape != undefined && eqd != undefined && chain != undefined
    window.animateOn = window.animateReady;

    let coilInitial = await coilGet("Initial");
    if (coilInitial) meshes.frameLine.visible = true;

    document.getElementById("programBar").style.display = "none";
    document.getElementById("playerBar" ).style.display = "none";


    if (!window.animateReady) return;

    let mesh;

    { // tails
        window.angleStep = coil.fi[coil.fi.length-1]

        mesh = meshes.tapeInterpolatedLine.clone()
        mesh.geometry = mesh.geometry.clone()
        mesh.material = mesh.material.clone()
        meshSet("tapeTailLine", mesh)

        mesh = meshes.tapeInterpolatedMesh.clone()
        mesh.geometry = mesh.geometry.clone()
        mesh.material = mesh.material.clone()
        meshSet("tapeTailMesh", mesh)
    }


    
    window.animateIndex  = 0;

    document.getElementById("animateSlider").max = window.animateCoil.x.length - 1;
    window.animateUpdateTime = 0;

    { // equidLine
        meshSet("equidLine", meshCreateLine(getT(0, coil.x.length, true), eqdColor, true));
    }

    { // freeLine
        const vertices = Array(6 * 3).fill(0);
        const indices = [0, 3,  1, 2,  4, 5];
        meshSet("freeLine", meshCreateLine([vertices, indices], 0xff0000));
    };

    { // freeMesh
        const vertices = Array(9 * (4 + 1)).fill(0);
        const indices = generateIndices(4);
        meshSet("freeMesh", meshCreate([vertices, indices], freeColor));
    };

    { // rolleyMesh
        const band = await layerPropGet('band') / 2
        const rolleyMandrel = {
            x: [-band * 1.05, -band, -band * 0.6, -band * 0.3,  0, band * 0.3,  band * 0.6,  band,  band * 1.05],
            r: [ 0  ,  2,  1.3,  1.1,  1,  1.1,  1.3,  2,  0 ],
        };
        const render = generatrixRender(rolleyMandrel, 8)
        mesh = meshCreate(render, 0xFFFFFF);
        mesh.visible = false;
        meshSet("rolleyMesh", mesh);
    }

    // rolleyAnimate();
}
window.animateInit = animateInit;

async function meshesShow(){
    const layerId = await layerIdGet()
    if(!layerId) return;

    window.animateOn = await layerPropGet("windingMode") == "first"
    const on = window.animateReady && window.animateOn

    document.getElementById("programBar").style.display = on ? "flex" : "none";
    document.getElementById("playerBar" ).style.display = on ? "flex" : "none";

    if (meshes.standMesh ) meshes.standMesh .visible = false;
    if (meshes.carretMesh) meshes.carretMesh.visible = false;
    if (meshes.rolleyMesh) meshes.rolleyMesh.visible = false;

    if (window.animateChain) {
        for (let i = 0; i < window.animateChain.length; i += 1) {
            meshes["chain" + i].visible = on;
        }
    }
    // meshes["chain" + (window.animateChain.length-1)].visible = false;

    const mesh = meshes.mandrelRawMesh
    if (mesh){
        const mandrelShow = await layerPropGet("mandrelShow")
        mesh.material.transparent = !mandrelShow;
        mesh.material.opacity     = !mandrelShow ? 0.1 : 1.;
    }

    if (meshes.freeLine) meshes.freeLine.visible = on && !!await layerPropGet("lineShow");
    if (meshes.freeMesh) meshes.freeMesh.visible = on && !!await layerPropGet("tapeShow");

    await tapeVisibility("Initial")
    await tapeVisibility("Corrected")
    await tapeVisibility("Interpolated")

    if (meshes.tapeTailLine) meshes.tapeTailLine.visible = on && !!await layerPropGet("tapeShow");
    if (meshes.tapeTailMesh) meshes.tapeTailMesh.visible = on && !!await layerPropGet("tapeShow");
    if (meshes.equidLine   ) meshes.equidLine   .visible = on && !!await layerPropGet("equidistantaShow");
}
window.meshesShow = meshesShow

function rolleyAnimate(){
    const i = window.animateIndex;
    if (!window.scale) return;

    const eqd = window.animateEqd
    const rolleyVert = getT(i)[0];

    let mesh;

    const Xi = eqd.x[i] * scale.factor
    const Ri = eqd.r[i] * scale.factor
    const Ai = eqd.al[i]


    // Machine

    mesh = meshes.standMesh
    if (mesh) { // standMesh
        mesh.position.x = Xi;
    }

    mesh = meshes.carretMesh
    if (mesh) { // carretMesh
        mesh.position.x = Xi;
        mesh.position.z = Ri;
        mesh.rotation.z = Ai;
    }

    mesh = meshes.rolleyMesh
    if (mesh) { // rolleyMesh
        mesh.position.set(Xi, 0, Ri);
        mesh.rotation.z = Ai;
    }


    // chain
    if (window.animateChain) {
        for (let j = 0; j < window.animateChain.length; j += 1) {
            mesh = meshes["chain" + j];
            const ch = window.animateChain[j]
            mesh.position.set(
                ch.x[i] * scale.factor,
                ch.z[i] * scale.factor,
                ch.y[i] * -scale.factor
            )

            mesh.rotation.x = ch.rx[i];
            mesh.rotation.y = ch.rz[i];
            mesh.rotation.z = -ch.ry[i];
        }
    }

    // Free tape

    mesh = meshes.freeLine
    if (mesh) { // freeLine
        const pos = mesh.geometry.attributes.position;
        pos.array.set(rolleyVert);
        pos.needsUpdate = true;
    }

    mesh = meshes.freeMesh
    if (mesh) { // freeMesh
        const geometry = mesh.geometry;
        // geometry.attributes.position.array.set(rolleyVert);
        interpolateVertices(geometry.attributes.position.array, rolleyVert, 4)
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals()
    }

}
window.rolleyAnimate = rolleyAnimate;

function tapeAnimate(prefix, fi){
    let mesh

    mesh = meshes["coil" + prefix + "Line"]
    if (mesh){
        mesh.rotation.x = fi;
    }

    mesh = meshes["tape" + prefix + "Mesh"]
    if (mesh){
        mesh.rotation.x = fi;
    }

    mesh = meshes["tape" + prefix + "Line"]
    if (mesh){
        mesh.rotation.x = fi;
    }
}

async function tapeVisibility(prefix){
    let mesh

    const lineShow = !!await layerPropGet("lineShow")

    mesh = meshes["coil" + prefix + "Line"]
    if (mesh){
        mesh.visible = lineShow;
    }

    const tapeShow = !!await layerPropGet("tapeShow")

    mesh = meshes["tape" + prefix + "Mesh"]
    if (mesh){
        mesh.visible = tapeShow;
    }

    mesh = meshes["tape" + prefix + "Line"]
    if (mesh){
        mesh.visible = tapeShow;
    }
}

function animate(timestamp) {
    requestAnimationFrame(animate);

    if (window.animateOn && window.animateReady
        && timestamp - window.animateUpdateTime > 100
    ) {
        window.animateUpdateTime = timestamp;

        let i = parseInt(animateSlider.value, 10);
        if (window.animateAuto) {
            let n = window.animateCoil.x.length
            i += 3
            if (i >= n) i = i - n
            animateSlider.value = i;
        }
        window.animateIndex = i;

        const x  = window.animateEqd.x [i]
        const r  = window.animateEqd.r [i]
        const fi = window.animateEqd.fi[i]
        const dl = window.animateEqd.al[i]

        let FI
        if (window.animateMachine == "RPN") {
            FI = fi + 30. * Math.PI / 180.
        } else {
            FI = window.animateMTU[0].fi[i] + 10. * Math.PI / 180.
        }
  
        // &Delta; &delta; &phi; &varphi; &Oslash; &oslash; &#10667; (Ø, ⊘, ⦻)
        const animateText = ""
            + `N ${i} | `
            + `x ${x .toFixed(1)} | `
            + `r ${r .toFixed(1)} | `
            + `φ ${FI.toFixed(5)} | `
            + `δ ${(dl * 180. / Math.PI).toFixed(1)}°`
        ;
        document.querySelector(".program-p").textContent = animateText;
    
        rolleyAnimate();

        tapeAnimate("Initial", FI)
        tapeAnimate("Corrected", FI)
        tapeAnimate("Interpolated", FI)

        let mesh, inds;

        mesh = meshes.tapeInterpolatedLine
        inds = window.animateTapeLineIndices
        if (mesh && inds) {
            mesh.geometry.setIndex([...inds.slice(   i * 2 * 2)]);
        }

        mesh = meshes.tapeTailLine
        inds = window.animateTapeLineIndices
        if (mesh && inds) {
            mesh.rotation.x = FI - window.angleStep;
            mesh.geometry.setIndex([...inds.slice(0, i * 2 * 2),]);
        }
        
        mesh = meshes.tapeInterpolatedMesh
        inds = window.animateTapeMeshIndices
        if (mesh && inds) {
            mesh.geometry.setIndex([...inds.slice(0, i * 2 * 3)]);
        }

        mesh = meshes.tapeTailMesh
        inds = window.animateTapeMeshIndices
        if (mesh && inds) {
            mesh.rotation.x = FI + window.angleStep;
            mesh.geometry.setIndex([...inds.slice(   i * 2 * 3),]);
        }

        mesh = meshes.equidLine
        if (mesh) {
            mesh.rotation.x = FI;
        }

        mesh = meshes.freeLine
        if (mesh) {
            mesh.rotation.x = FI;
        }

        mesh = meshes.freeMesh
        if (mesh) {
            mesh.rotation.x = FI;
        }
    }

    scene.controls.update();

    scene.renderer.render(scene.scene, scene.camera);
}
window.animate = animate

async function animateOnLoad(){
    const animateButton = document.getElementById("animateButton");
    animateButton.onclick = () => {
        window.animateAuto = !window.animateAuto;
        animateButton.classList.toggle("active", window.animateAuto);
    };

    document.addEventListener("keydown", function(event) {
        if (event.code === "Space") {
            event.preventDefault();
            animateButton.click();
        }
    });


    window.animateAuto = true;

    animate();
}
window.animateOnLoad = animateOnLoad
