function getT(begin=0, end=0, long = false){
    if(end == 0)
        end = begin + 1;
  
    const pN = 4; // point count
    const vertices = [];
    const indices  = [];
  
    for (let i = begin; i < end; i++) {
        const j = (i - begin) * pN;
  
        const fiShift = 0. // (inputValue('testModeInput') == 0 ? 0. : -window.animateEqd["fi"][i]);
        const yShift  = 0. // (inputValue('testModeInput') <= 1 ? 0. : -window.animateEqd["r" ][i] + 120.);
  
        const jCoil = j + 0;
        const pC0 = pointXYZ(window.animateCoil, i, fiShift, 0.0, yShift)
        vertices.push(...pC0);
  
        const jEqd  = j + 1;
        const pT0 = pointXYZ(window.animateEqd , i, fiShift, 0.0, yShift)
        vertices.push(...pT0);


        // const tape = window.animateTape


  
        const jTL = j + 2;
        const pTR = pointXYZ(window.animateRolley, i, fiShift, 0.0, yShift);
        vertices.push(...pTR);
  
        const jTR = j + 3;
        const pTL = pointXYZ(window.animateRolley, i, fiShift, 0.0, yShift, pT0)
        vertices.push(...pTL);
  
        if (long && i > 0) {
            indices.push(jEqd - pN); indices.push(jEqd);
        }
        if (i % 5 == 0) {
            // if (inputValue('testModeInput') == 0){
                indices.push(jCoil); indices.push(jEqd);
                indices.push(jTL  ); indices.push(jTR )
            // } else {
            //     indices.push(jTL  ); indices.push(jTR )
            //     indices.push(jTL  ); indices.push(jTR )
            // }
        }
    };
  
    return [vertices, indices];
  }
  window.getT = getT;

function animateInit(){
    let coil = coilGet("Interpolated");
    let tape = getField("tapeInterpolated");
    let eqd  = getField("equidistantaInterpolated");
    let roll = getField("rolleyInterpolated");
    let color = 0x9ACBD0

    if (!coil) {
        coil = coilGet("Corrected");
        tape = getField("tapeCorrected");
        eqd  = getField("equidistanta");
        roll = getField("rolley");
        color = 0xfea02a
    }

    if (!coil || !eqd){
        window.animateOn = false;
        return
    }

    window.animateOn = true;

    window.animateCoil   = coil;
    window.animateTape   = tape;
    window.animateEqd    = eqd ;
    window.animateRolley = roll;

    window.animateIndex  = 0;

    document.getElementById("animateSlider").max = window.animateCoil.x.length - 1;
    window.animateUpdateTime = 0;

    const Fr = scale.y.max * 2;
    const Fd = Fr / 100;

    { // equidMesh
        removeMesh(window.equidMesh);
        window.equidMesh = addLine(getT(0, coil.x.length, true), color, true);
    }

    { // freeLine
        removeMesh(window.freeLine);
        const vertices = Array(4 * 3).fill(0);
        const indices = [0, 1,  2, 3];
        window.freeLine = addLine([vertices, indices], 0xff0000);
    };

    { // freeMesh
        removeMesh(window.freeMesh);
        const vertices = Array(4 * 3).fill(0);
        const indices = [0, 2, 1,  1, 2, 3];
        window.freeMesh = addMesh([vertices, indices], 0xff0000);
    };

    { // carretLine
        removeMesh(window.carretLine);
        const vertices = Array(4 * 3).fill(0);
        const indices = [0, 1,  2, 3];
        window.carretLine = addLine([vertices, indices], 0x00ff00);
    };

    { // carretMesh
        const Xi = 0;
        const Yi = 0;
        const Zi = Fr;

        const vert = [];
        vert.push(Xi - Fd * 2,  Yi - Fd,  Fd * 8);
        vert.push(Xi - Fd * 2,  Yi + Fd,  Fd * 8);
        vert.push(Xi + Fd * 2,  Yi + Fd,  Fd * 8);
        vert.push(Xi + Fd * 2,  Yi - Fd,  Fd * 8);

        vert.push(Xi - Fd * 2,  Yi - Fd,  Fr);
        vert.push(Xi - Fd * 2,  Yi + Fd,  Fr);
        vert.push(Xi + Fd * 2,  Yi + Fd,  Fr);
        vert.push(Xi + Fd * 2,  Yi - Fd,  Fr);
        
        const indices = [];
        indices.push(0, 1, 2,  2, 3, 0);
        indices.push(4, 5, 6,  6, 7, 4);

        indices.push(0, 4, 5,  5, 1, 0);
        indices.push(1, 5, 6,  6, 2, 1);
        indices.push(2, 6, 7,  7, 3, 2);
        indices.push(3, 7, 4,  4, 0, 3);

        removeMesh(window.carretMesh);
        window.carretMesh = addMesh([vert, indices], 0x00ff00);
        window.carretMesh.position.z = Zi * scale.factor
    };

    { // standMesh
        const Xi = 0;
        const Yi = 0;
        const Zi = Fr * 1;

        const vert = [];
        vert.push(Xi - Fd * 8,  Yi - Fr    ,  Zi - Fd * 4);
        vert.push(Xi - Fd * 8,  Yi + Fd * 8,  Zi - Fd * 4);
        vert.push(Xi + Fd * 8,  Yi + Fd * 8,  Zi - Fd * 4);
        vert.push(Xi + Fd * 8,  Yi - Fr    ,  Zi - Fd * 4);

        vert.push(Xi - Fd * 8,  Yi - Fr    ,  Zi + Fd * 4);
        vert.push(Xi - Fd * 8,  Yi + Fd * 8,  Zi + Fd * 4);
        vert.push(Xi + Fd * 8,  Yi + Fd * 8,  Zi + Fd * 4);
        vert.push(Xi + Fd * 8,  Yi - Fr    ,  Zi + Fd * 4);
        
        const indices = [];
        indices.push(0, 1, 2,  2, 3, 0);
        indices.push(4, 5, 6,  6, 7, 4);

        indices.push(0, 4, 5,  5, 1, 0);
        indices.push(1, 5, 6,  6, 2, 1);
        indices.push(2, 6, 7,  7, 3, 2);
        indices.push(3, 7, 4,  4, 0, 3);

        removeMesh(window.standMesh);
        window.standMesh = addMesh([vert, indices], 0x00ff00);
    }
    
    { // rolleyMesh
        removeMesh(window.rolleyMesh);

        const band = inputValue('bandInput') / 2
        const rolleyMandrel = {
            x: [-band * 1.05, -band, -band * 0.6, -band * 0.3,  0, band * 0.3,  band * 0.6,  band,  band * 1.05],
            r: [ 0  ,  2,  1.3,  1.1,  1,  1.1,  1.3,  2,  0 ],
        };
        
        const render = generatrixRender(rolleyMandrel, 8)

        const mesh = addMesh(render, 0xFFFFFF);
        
        window.rolleyMesh = mesh;

        rolleyAnimate();
    }
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
        const pos = window.freeMesh.geometry.attributes.position;
        pos.array.set(rolleyVert);
        pos.needsUpdate = true;
    }

    if (window.rolleyMesh) { // rolleyMesh
        window.rolleyMesh.rotation.z = eqd["al"][i];
        window.rolleyMesh.position.set(eqd["x"][i] * scale.factor, 0, eqd["r"][i] * scale.factor);
    }

    if (window.carretLine) { // carretLine
        const Fr = scale.y.max * 2;
        // const Fd = Fr / 8;

        const Xi = eqd.x[i]
        const Yi = 0;
        const Zi = eqd.r[i]

        const vert = [];
        vert.push(Xi,  Yi,  Zi);
        vert.push(Xi,  Yi,  Zi + Fr);
        vert.push(Xi,  Yi,  Fr);
        vert.push(Xi, -Fr,  Fr);
        
        const pos = window.carretLine.geometry.attributes.position;
        pos.array.set(vert);
        pos.needsUpdate = true;

        window.carretMesh.position.x = Xi * scale.factor;
        window.carretMesh.position.z = Zi * scale.factor;
        window.carretMesh.rotation.z = eqd["al"][i];

        window.standMesh.position.x = Xi * scale.factor;
    }

}
window.rolleyAnimate = rolleyAnimate;


function animate(timestamp) {
    requestAnimationFrame(animate);
  
    // const parent = canvas.parentElement;
    // if (parent.offsetWidth == 0 || parent.offsetHeight == 0) return
    // if (!parent.classList.contains("active")) return
  
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
  
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
    
      const fi = window.animateEqd.fi[window.animateIndex]
      const dl = window.animateEqd.al[window.animateIndex]
  
      // &Delta; &delta; &phi; &varphi; &Oslash; &oslash; &#10667; (Ø, ⊘, ⦻)
      const animateText = ""
        + `i ${window.animateIndex} | `
        + `x ${window.animateCoil.x[window.animateIndex].toFixed(3)} | `
        + `φ ${fi.toFixed(3)} | `
        + `Δ ${(dl * 180. / Math.PI).toFixed(1)}°`
      ;
      document.querySelector(".program-p").textContent = animateText;
    
      rolleyAnimate();
      
  
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
  
  
      if (window.equidMesh)
        window.equidMesh.rotation.x = fi; // (inputValue('testModeInput') == 0 ? fi : 0);
  
      if (window.freeLine)
        window.freeLine .rotation.x = fi; // (inputValue('testModeInput') == 0 ? fi : 0);

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
            setField("windingMode", button.getAttribute("data-mode"));
            coilDraws();
        });
    });

    // window.animateAngle += 0.01;
    // animateSlider.value = window.animateAngle;
    // if (window.animateAuto) {
    //     requestAnimationFrame(animateOnLoad);
    // }
    
}
window.animateOnLoad = animateOnLoad
