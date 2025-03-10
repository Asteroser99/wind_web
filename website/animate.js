function getT(begin=0, end=0, long = false){
    if(end == 0)
        end = begin + 1;
  
    const pN = 6; // point count
    const vertices = [];
    const indices  = [];
  
    for (let i = begin; i < end; i++) {
        const j = (i - begin) * pN;
  
        // const fiShift = 0. // (fieldGet('testMode') == 0 ? 0. : -window.animateEqd["fi"][i]);
        // const yShift  = 0. // (fieldGet('testMode') <= 1 ? 0. : -window.animateEqd["r" ][i] + 120.);
  

        const jCoil = j + 0;
        const pCoil = pointXYZ(window.animateCoil, i)
        vertices.push(...pCoil);
  
        const jTapeL = j + 1;
        const pTapeR = pointXYZ(window.animateTape, i);
        vertices.push(...pTapeR);
  
        const jTapeR = j + 2;
        // const pTapeL = pointXYZ(window.animateTape, i, pCoil)
        const pTapeL = mirrorXYZ(pTapeR, pCoil)
        vertices.push(...pTapeL);


        const jEqd = j + 3;
        const pEqd = pointXYZ(window.animateEqd , i)
        vertices.push(...pEqd);

        const jRollL = j + 4;
        const pRollR = pointXYZ(window.animateRolley, i);
        vertices.push(...pRollR);
  
        const jRollR = j + 5;
        // const pRollL = pointXYZ(window.animateRolley, i, pEqd)
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

function animateInit(){
    let coil = coilGet("Interpolated");
    let tape = fieldGet("tapeInterpolated");
    let eqd  = fieldGet("equidistantaInterpolated");
    let roll = fieldGet("rolleyInterpolated");
    let eqdColor  = 0x9ACBD0
    let freeColor = 0xffff00

    if (!coil) {
        coil = coilGet("Corrected");
        tape = fieldGet("tapeCorrected");
        eqd  = fieldGet("equidistanta");
        roll = fieldGet("rolley");
        eqdColor = 0xfea02a
        freeColor = 0xfea02a
    }

    window.animateOn = coil && tape && eqd && roll

    document.getElementById("programBar").style.display = window.animateOn ? "flex" : "none";
    document.getElementById("playerBar" ).style.display = window.animateOn ? "flex" : "none";

    if (!window.animateOn) return;

    frameInit()
    frameUpdate();

    window.animateCoil   = coil;
    window.animateTape   = tape;
    window.animateEqd    = eqd ;
    window.animateRolley = roll;

    window.animateIndex  = 0;

    document.getElementById("animateSlider").max = window.animateCoil.x.length - 1;
    window.animateUpdateTime = 0;

    if (window.tapeInterpolatedMesh){
        const geometry = window.tapeInterpolatedMesh.geometry;
        window.animateTapeIndices = Array.from(geometry.getIndex().array);
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
        const vertices = [ // Array(6 * 3).fill(0);
            0, 0, 0, 2, 0, 1, 
            1, 0, 0, 1, 1, 1, 
            0, 1, 0, 2, 1, 1, 
        ]
        const indices = [1, 0, 4,  4, 0, 3,  2, 0, 5,  5, 0, 3];

        window.freeMesh = addMesh([vertices, indices], freeColor);
    };

    if (false) { // carretLine
        removeMesh(window.carretLine);
        const vertices = Array(4 * 3).fill(0);
        const indices = [0, 1,  2, 3];
        window.carretLine = addLine([vertices, indices], 0x00ff00);
    };

    { // rolleyMesh
        removeMesh(window.rolleyMesh);
  
        const band = fieldGet('band') / 2
        const rolleyMandrel = {
            x: [-band * 1.05, -band, -band * 0.6, -band * 0.3,  0, band * 0.3,  band * 0.6,  band,  band * 1.05],
            r: [ 0  ,  2,  1.3,  1.1,  1,  1.1,  1.3,  2,  0 ],
        };
        
        const render = generatrixRender(rolleyMandrel, 8)
  
        const mesh = addMesh(render, 0xFFFFFF);
        
        window.rolleyMesh = mesh;
    }

    rolleyAnimate();
}
window.animateInit = animateInit;

function rolleyAnimate(){
    const i = window.animateIndex;
    if (!window.scale) return;

    const eqd = window.animateEqd
    const rolleyVert = getT(i)[0];

    if (window.tapeCorrectedMesh) { // tape
        // const pos = window.tapeCorrectedMesh.geometry.attributes.position;
        // console.log(pos.array)
    }

    if (window.freeLine) { // freeLine
        const pos = window.freeLine.geometry.attributes.position;
        pos.array.set(rolleyVert);
        pos.needsUpdate = true;
    }

    if (window.freeMesh) { // freeMesh
        const pos = window.freeMesh.geometry.attributes.position;
        pos.array.set(rolleyVert);
        pos.needsUpdate = true;
    }

    if (window.rolleyMesh) { // rolleyMesh
        window.rolleyMesh.rotation.z = eqd["al"][i];
        window.rolleyMesh.position.set(eqd["x"][i] * scale.factor, 0, eqd["r"][i] * scale.factor);
    }

    const Xi = eqd.x[i]
    const Yi = 0;
    const Zi = eqd.r[i]

    if (window.carretLine) { // carretLine
        const Fr = scale.y.max * 2;
        // const Fd = Fr / 8;

        const vert = [];
        vert.push(Xi,  Yi,  Zi);
        vert.push(Xi,  Yi,  Zi + Fr);
        vert.push(Xi,  Yi,  Fr);
        vert.push(Xi, -Fr,  Fr);
        
        const pos = window.carretLine.geometry.attributes.position;
        pos.array.set(vert);
        pos.needsUpdate = true;
    }

    if (window.carretMesh) { // carretMesh
        window.carretMesh.position.x = Xi * scale.factor;
        window.carretMesh.position.z = Zi * scale.factor;
        window.carretMesh.rotation.z = eqd["al"][i];

        window.standMesh.position.x = Xi * scale.factor;
    }

}
window.rolleyAnimate = rolleyAnimate;


function animate(timestamp) {
    requestAnimationFrame(animate);
  
    // timestamp
    if (window.animateOn && timestamp - window.animateUpdateTime > 100) {
      window.animateUpdateTime = timestamp;
  
      window.animateIndex = parseInt(animateSlider.value, 10);
      if (window.animateAuto) {
        window.animateIndex += 3
        if (window.animateIndex >= window.animateCoil.x.length) {
          window.animateIndex = 0
        }
        animateSlider.value = window.animateIndex;
      }
    
      const x  = window.animateEqd.x [window.animateIndex]
      const r  = window.animateEqd.r [window.animateIndex]
      const fi = window.animateEqd.fi[window.animateIndex]
      const dl = window.animateEqd.al[window.animateIndex]
  
      // &Delta; &delta; &phi; &varphi; &Oslash; &oslash; &#10667; (Ø, ⊘, ⦻)
      const animateText = ""
        + `№ ${window.animateIndex} | `
        + `x ${x.toFixed(1)} | `
        + `r ${r.toFixed(1)} | `
        + `φ ${fi.toFixed(5)} | `
        + `Δ ${(dl * 180. / Math.PI).toFixed(1)}°`
      ;
      document.querySelector(".program-p").textContent = animateText;
    
      rolleyAnimate();


      if ( window.animateTapeIndices ) {
        const geometry = window.tapeInterpolatedMesh.geometry;
        geometry.setIndex(window.animateTapeIndices.slice(0, window.animateIndex * 2 * 3));
        // geometry.computeVertexNormals();
      }

      
      if (window.coilInitialLine)
        window.coilInitialLine.rotation.x = fi;
    
      if (window.tapeInitialMesh)
        window.tapeInitialMesh.rotation.x = fi;
  
      if (window.tapeInitialLine)
        window.tapeInitialLine.rotation.x = fi;
  
      
      if (window.coilCorrectedLine)
        window.coilCorrectedLine.rotation.x = fi;
    
      if (window.tapeCorrectedMesh)
        window.tapeCorrectedMesh.rotation.x = fi;
    
      if (window.tapeCorrectedLine)
        window.tapeCorrectedLine.rotation.x = fi;
  
  
      if (window.coilInterpolatedLine)
        window.coilInterpolatedLine.rotation.x = fi;
    
      if (window.tapeInterpolatedMesh)
        window.tapeInterpolatedMesh.rotation.x = fi;
    
      if (window.tapeInterpolatedLine)
        window.tapeInterpolatedLine.rotation.x = fi;
  
      window.equidLine.visible = window.equidistantaShow;
      if (window.equidLine)
        window.equidLine.rotation.x = fi;
  
      if (window.freeLine)
        window.freeLine .rotation.x = fi;

      if (window.freeMesh)
        window.freeMesh .rotation.x = fi;
  
    }
  
    scene.controls.update();
  
    scene.renderer.render(scene.scene, scene.camera);
}
window.animate = animate


function animateOnLoad(){
    // let animateSlider = document.getElementById("animateSlider");
    // animateSlider.addEventListener("input", () => window.animateAngle = parseFloat(animateSlider.value));

    const animateButton = document.getElementById("animateButton");
    animateButton.addEventListener("click", () => {
        window.animateAuto = !window.animateAuto;
        animateButton.classList.toggle("active", window.animateAuto);
    });

    document.addEventListener("keydown", function(event) {
        if (event.code === "Space") {
            event.preventDefault(); // Чтобы страница не прокручивалась
            animateButton.click();
        }
    });


    window.animateAuto = false;
    window.animateAngle = 0;

    const buttons = document.querySelectorAll(".mode-button");
    buttons.forEach(button => {
        button.addEventListener("click", () => {
            buttons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            fieldSet("windingMode", button.getAttribute("data-mode"));
            coilDraws();
        });
    });

    // window.animateAngle += 0.01;
    // animateSlider.value = window.animateAngle;
    // if (window.animateAuto) {
    //     requestAnimationFrame(animateOnLoad);
    // }
    
    animate();
}
window.animateOnLoad = animateOnLoad
