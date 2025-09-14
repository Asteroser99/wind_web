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
        const pTapeR = pointXYZ(window.animateTape, i, 0, thi, window.animateCoil);
        vertices.push(...pTapeR);
  
        const jTapeR = j + 2;
        const pTapeL = mirrorXYZ(pTapeR, pCoil)
        vertices.push(...pTapeL);


        const jEqd = j + 3;
        const pEqd = pointXYZ(window.animateEqd , i)
        vertices.push(...pEqd);

        const jRollL = j + 4;
        const pRollR = pointXYZ(window.animateRolley, i);
        vertices.push(...pRollR);
  
        const jRollR = j + 5;
        const pRollL = mirrorXYZ(pRollR, pEqd)
        vertices.push(...pRollL);

        
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
    let coil = await coilGet("Interpolated");
    let tape = await layerPropGet("tapeInterpolated");
    let eqd  = await layerPropGet("equidistantaInterpolated");
    let roll = await layerPropGet("rolleyInterpolated");
    let eqdColor  = 0x9ACBD0
    let freeColor = 0xffff00

    // scaleSet();
    await floorInit();
    await frameInit();

    window.animateReady = coil != undefined && tape != undefined && eqd != undefined && roll != undefined
    window.animateOn = window.animateReady;

    let coilInitial = await coilGet("Initial");
    if (coilInitial) window.frameLine .visible = true;

    document.getElementById("programBar").style.display = "none";
    document.getElementById("playerBar" ).style.display = "none";

    if (!window.animateReady) return;

    window.animateCoil   = coil;
    window.animateTape   = tape;
    window.animateEqd    = eqd ;
    window.animateRolley = roll;


    // if (false) 
    { // tails
        // const { Turns, Coils } = await fibboGetSelectedValues();
        // window.angleStep = 2 * Math.PI * Turns / Coils;
        window.angleStep = coil.fi[coil.fi.length-1]

        removeMesh(window.tapeLineTail);
        window.tapeLineTail          = window.tapeInterpolatedLine         .clone();
        window.tapeLineTail.geometry = window.tapeInterpolatedLine.geometry.clone();
        window.tapeLineTail.material = window.tapeInterpolatedLine.material.clone();
        // window.tapeLineTail.material.color.set(0xffff00);
        // window.tapeLineTail.geometry = window.tapeLineTail.geometry.toNonIndexed();
        // window.tapeLineTail.material = dashedMaterial(window.tapeInterpolatedLine.material.color);
        // window.tapeLineTail.computeLineDistances();
        scene.scene.add(window.tapeLineTail);

        removeMesh(window.tapeMeshTail);
        window.tapeMeshTail          = window.tapeInterpolatedMesh         .clone();
        window.tapeMeshTail.geometry = window.tapeInterpolatedMesh.geometry.clone();
        window.tapeMeshTail.material = window.tapeInterpolatedMesh.material.clone();
        // window.tapeMeshTail.material.color.set(0x00ffff);
        scene.scene.add(window.tapeMeshTail);
    }


    
    window.animateIndex  = 0;

    document.getElementById("animateSlider").max = window.animateCoil.x.length - 1;
    window.animateUpdateTime = 0;

    { // tapeInterpolatedMesh
        const mesh = window.tapeInterpolatedMesh
        if (mesh)
            window.animateTapeMeshIndices = Array.from(mesh.geometry.getIndex().array);
    }
    { // tapeInterpolatedLine
        const mesh = window.tapeInterpolatedLine
        if (mesh)
            window.animateTapeLineIndices = Array.from(mesh.geometry.getIndex().array);
    }

    { // equidLine
        removeMesh(window.equidLine);
        window.equidLine = addLine(getT(0, coil.x.length, true), eqdColor, true);
    }

    { // freeLine
        removeMesh(window.freeLine);
        const vertices = Array(6 * 3).fill(0);
        const indices = [0, 3,  1, 2,  4, 5];
        window.freeLine = addLine([vertices, indices], 0xff0000);
    };

    { // freeMesh
        removeMesh(window.freeMesh);
        const vertices = Array(9 * (4 + 1)).fill(0);
        const indices = generateIndices(4);
        window.freeMesh = addMesh([vertices, indices], freeColor);
    };

    { // rolleyMesh
        removeMesh(window.rolleyMesh);
  
        const band = await layerPropGet('band') / 2
        const rolleyMandrel = {
            x: [-band * 1.05, -band, -band * 0.6, -band * 0.3,  0, band * 0.3,  band * 0.6,  band,  band * 1.05],
            r: [ 0  ,  2,  1.3,  1.1,  1,  1.1,  1.3,  2,  0 ],
        };
        
        const render = generatrixRender(rolleyMandrel, 8)
  
        const mesh = addMesh(render, 0xFFFFFF);
        
        window.rolleyMesh = mesh;
        window.rolleyMesh.visible = false;
    }

    // rolleyAnimate();
}
window.animateInit = animateInit;

function rolleyAnimate(){
    const i = window.animateIndex;
    if (!window.scale) return;

    const eqd = window.animateEqd
    const rolleyVert = getT(i)[0];

    if (window.freeLine) { // freeLine
        const pos = window.freeLine.geometry.attributes.position;
        pos.array.set(rolleyVert);
        pos.needsUpdate = true;
    }

    if (window.freeMesh) { // freeMesh
        const geometry = window.freeMesh.geometry;
        // geometry.attributes.position.array.set(rolleyVert);
        interpolateVertices(geometry.attributes.position.array, rolleyVert, 4)
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals()
    }

    if (window.rolleyMesh) { // rolleyMesh
        window.rolleyMesh.rotation.z = eqd["al"][i];
        window.rolleyMesh.position.set(eqd["x"][i] * scale.factor, 0, eqd["r"][i] * scale.factor);
    }

    const Xi = eqd.x[i]
    const Yi = 0;
    const Zi = eqd.r[i]

    if (window.carretMesh) { // carretMesh
        window.carretMesh.position.x = Xi * scale.factor;
        window.carretMesh.position.z = Zi * scale.factor;
        window.carretMesh.rotation.z = eqd["al"][i];

        window.standMesh.position.x = Xi * scale.factor;
    }

}
window.rolleyAnimate = rolleyAnimate;

function tapeAnimate(prefix, fi){
    let mesh

    mesh = window["coil" + prefix + "Line"]
    if (mesh){
        mesh.rotation.x = fi;
    }

    mesh = window["tape" + prefix + "Mesh"]
    if (mesh){
        mesh.rotation.x = fi;
    }

    mesh = window["tape" + prefix + "Line"]
    if (mesh){
        mesh.rotation.x = fi;
    }
}

async function tapeVisibility(layerId, prefix){
    let mesh

    const lineShow = layerId && await layerPropGet("lineShow")

    mesh = window["coil" + prefix + "Line"]
    if (mesh){
        mesh.visible = lineShow;
    }

    const tapeShow = layerId && await layerPropGet("tapeShow")

    mesh = window["tape" + prefix + "Mesh"]
    if (mesh){
        mesh.visible = tapeShow;
    }

    mesh = window["tape" + prefix + "Line"]
    if (mesh){
        mesh.visible = tapeShow;
    }
}

async function meshesShow(){
    const layerId = await layerIdGet()

    window.animateOn = layerId ? await layerPropGet("windingMode") == "first" : false;
    const on = window.animateReady && window.animateOn

    document.getElementById("programBar").style.display = on ? "flex" : "none";
    document.getElementById("playerBar" ).style.display = on ? "flex" : "none";

    if (window.standMesh ) window.standMesh .visible = on;
    if (window.carretMesh) window.carretMesh.visible = on;
    if (window.rolleyMesh) window.rolleyMesh.visible = on;

    const mesh = window.mandrelRawMesh;
    if (mesh){
        const mandrelShow = layerId ? await layerPropGet("mandrelShow") : false;
        mesh.material.transparent = !mandrelShow;
        mesh.material.opacity     = !mandrelShow ? 0.1 : 1.;
    }

    if (window.freeLine) window.freeLine      .visible = on && await layerPropGet("lineShow");
    if (window.freeMesh) window.freeMesh      .visible = on && window.tapeShow;

    await tapeVisibility(layerId, "Initial")
    await tapeVisibility(layerId, "Corrected")
    await tapeVisibility(layerId, "Interpolated")

    if (window.tapeLineTail  ) window.tapeLineTail  .visible = on && window.tapeShow;
    if (window.tapeMeshTail  ) window.tapeMeshTail  .visible = on && window.tapeShow;

    if (window.equidLine) window.equidLine.visible = on && await layerPropGet("equidistantaShow");
    
}
window.meshesShow = meshesShow

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
  
        // &Delta; &delta; &phi; &varphi; &Oslash; &oslash; &#10667; (Ø, ⊘, ⦻)
        const animateText = ""
            + `N ${i} | `
            + `x ${x .toFixed(1)} | `
            + `r ${r .toFixed(1)} | `
            + `φ ${fi.toFixed(5)} | `
            + `δ ${(dl * 180. / Math.PI).toFixed(1)}°`
        ;
        document.querySelector(".program-p").textContent = animateText;
    
        rolleyAnimate();


        tapeAnimate("Initial", fi)
        tapeAnimate("Corrected", fi)
        tapeAnimate("Interpolated", fi)

        if (window.animateTapeLineIndices) {
            const mesh = window.tapeInterpolatedLine;
            mesh.geometry.setIndex([
                ...window.animateTapeLineIndices.slice(   i * 2 * 2)
            ]);
        }
        if (window.tapeLineTail){
            window.tapeLineTail.rotation.x = fi - window.angleStep;
            const mesh = window.tapeLineTail;
            mesh.geometry.setIndex([
                ...window.animateTapeLineIndices.slice(0, i * 2 * 2),
            ]);
        }
        
        if (window.animateTapeMeshIndices) {
            const mesh = window.tapeInterpolatedMesh;
            mesh.geometry.setIndex([
                ...window.animateTapeMeshIndices.slice(0, i * 2 * 3)
            ]);
        }
        if (window.tapeMeshTail){
             window.tapeMeshTail.rotation.x = fi + window.angleStep;
            const mesh = window.tapeMeshTail;
            mesh.geometry.setIndex([
                ...window.animateTapeMeshIndices.slice(   i * 2 * 3),
            ]);
        }

        if (window.equidLine) {
            window.equidLine.rotation.x = fi;
        }

        if (window.freeLine)
            window.freeLine.rotation.x = fi;

        if (window.freeMesh)
            window.freeMesh.rotation.x = fi;

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
    await meshesShow();
}
window.animateOnLoad = animateOnLoad
