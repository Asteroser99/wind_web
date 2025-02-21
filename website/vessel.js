window.vessel = {};

window.mandrelMesh = null;


// storage

const asyncStorageUpdate = (key, value) => {
    return new Promise((resolve, reject) => {
        try {
            const keys = JSON.parse(localStorage.getItem('vessel_keys')) || [];

            if (!keys.includes(key)) {
                keys.push(key);
                localStorage.setItem('vessel_keys', JSON.stringify(keys));
            }

            localStorage.setItem(`vessel_${key}`, JSON.stringify(value));

            resolve(`Key "${key}" updated successfully.`);

        } catch (error) {
            reject(`Error updating key "${key}": ${error}`);
        }
    });
};


const getField = (key) => {
    if (Object.keys(vessel).length === 0) {
        const keys = JSON.parse(localStorage.getItem('vessel_keys')) || [];
        // console.log(keys);
        keys.forEach((storedKey) => {
            const value = JSON.parse(localStorage.getItem(`vessel_${storedKey}`));
            vessel[storedKey] = value;
        });
    }
    return vessel[key];
};
window.getField = getField

const setField = async (key, value) => {
    vessel[key] = value;

    try {
        const result = await asyncStorageUpdate(key, value);
    } catch (error) {
        showError(error);
    }
};
window.setField = setField

const clearVessel = () => {
    const keys = JSON.parse(localStorage.getItem('vessel_keys')) || [];

    keys.forEach((key) => {
        localStorage.removeItem(`vessel_${key}`);
    });

    localStorage.removeItem('vessel_keys');

    vessel = {};
};

const setVessel = async (newVessel) => {
    clearVessel();

    vessel = newVessel;

    const promises = Object.entries(newVessel).map(([key, value]) =>
        asyncStorageUpdate(key, value)
    );

    // try {
    //     await Promise.all(promises);
    //     console.log('New vessel set successfully.');
    // } catch (error) {
        // showError(error);
    // }
};

const getVessel = () => {
    const keys = JSON.parse(localStorage.getItem('vessel_keys')) || [];

    keys.forEach((key) => {
        const jsonStr = localStorage.getItem(`vessel_${key}`)
        if (jsonStr && jsonStr != "undefined") {
            const value = JSON.parse(jsonStr);
            vessel[key] = value;
        }
    });
};


// vessel

function getVesselData(){
    const fibboSel = fibboGetSelectedValues()

    return {
        //  parseFloat(document.getElementById('value-x').textContent), //.toFixed(2)
        "Pole": inputValue('poleInput'),
        "Band": 10.,
        "Conv": 4,
        "Turns": fibboSel["Turns"],
        "Coils": fibboSel["Coils"],
    };
}
window.getVesselData = getVesselData

// vesselLoad

const vesselLoadInput = document.getElementById('vesselLoadInput');
document.getElementById('vesselLoad').addEventListener(
    'click', () => { vesselLoadInput.click(); }
);
vesselLoadInput.addEventListener(
    'change', function (event) { vesselLoadOnClick(event) }
);
function vesselLoadOnClick(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = vesselLoadOnFileLoad;

    reader.readAsText(file);
};
function vesselLoadOnFileLoad(event) {
    setVessel(loadFromYaml(event.target.result));
    drawAll()
}
function loadFromYaml(yamlString){
    let parsedData = null;
    try {
        parsedData = jsyaml.load(yamlString);
    } catch (error) {
        showError(error);
    }
    return parsedData;
}


// lambdaCall

function lambdaCall(name, param) {
    let path = 'https://z2qmzcusx7.execute-api.eu-central-1.amazonaws.com/prod/';

    const origin = window.location.origin;
    if(origin == "http://127.0.0.1:5500"){ // local web server
        path = 'http://127.0.0.1:5000/';   // local flask server
    }

    const accessToken = localStorage.getItem('accessToken'); // Получаем токен из локального хранилища
    const headers = {
        headers: {
            auth: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    }

    // console.log("post", path + name);

    // return fetch(
    //     path + name, {
    //         method: 'POST',
    //         headers,
    //         body: JSON.stringify(param)
    //     }
    // )

    return axios.post(
        path + name,
        JSON.stringify(param),
        headers
    )
        .then((response) => {
            // console.log("response", response);
            
            if(!response.data) throw new Error("Empty lambdaCall result");

            return response.data;
        })
        .catch((error) => {
            showError(error);
        });
}

// document.getElementById('test').addEventListener(
//     'click', () => {
//         loading();
//         lambdaCall("helloWorld", [0., "1", 2])
//         .then((res) => {
//             console.log(res);
//             loaded();
//         })
//         .catch(error => {
//             showError(error);
//         });
//     }
// );


// Mandrel

function SetPole() {
    const mandrel = getField("mandrelRaw")
    if (!mandrel) return;
    const {x, r} = mandrel
    if (r.length > 0) inputValue('poleInput', r[0]);
}

// ImportCSV

const mandrelImportCSVInput = document.getElementById('mandrelImportCSVInput');
document.getElementById('mandrelImportCSV').addEventListener(
    'click', () => {
        mandrelImportCSVInput.value = "";
        mandrelImportCSVInput.click();
        loading();
    }
);

mandrelImportCSVInput.addEventListener(
    'change', function (event) {
        const file = event.target.files[0];
        if (!file){
            loaded();
            return 
        }
    
        const reader = new FileReader();
        reader.onload = mandrelImportCSVOnFileLoad;
        reader.readAsText(file);
    }
);

function mandrelImportCSVOnFileLoad(event) {
    const csvText = event.target.result;

    const colNumEl = document.getElementById('csv-column');
    const colNum = colNumEl.value - 1;

    mandrelFromCSV(csvText, colNum);

    SetPole();
    mandrelDraw();

    loaded();
};

function mandrelFromCSV(csvText, colNum = 0) {
    const lines = csvText.trim().split("\n");

    let div = ","
    let headers = lines[0].split(div);
    if (headers.length < 2) {
        div = ";"
        headers = lines[0].split(div);
        if (headers.length < 2) {
            throw new Error("CSV must have at least two columns");
        }
    }

    const r = []; const x = [];

    const k = (headers[colNum * 2 + 0].includes("x") || headers[colNum * 2 + 0].includes("y")) ? [x, r] : [r, x];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].split(div);
        // const [v0, v1] = line;
        const [v0, v1] = [line[colNum * 2 + 0], line[colNum * 2 + 1]]
        if (v0.trim() == "" && v1.trim() == "") continue;
        k[0].push(parseFloat(v0.trim()));
        k[1].push(parseFloat(v1.trim()));
    }

    setField("mandrelRaw", { x, r });
}

// Export CSV

// function mandrelExportCSVWithInputDialog(data) {
//     const input = document.createElement("input");
//     input.type = "file";
//     input.accept = ".csv";
//     input.addEventListener("change", (event) => {
//         const file = event.target.files[0];
//         if (!file) return;

//         mandrelExportCSVFileWrite(file, data);
//     });

//     input.click();
// }

// // Запись данных в файл через File API
// function mandrelExportCSVFileWrite(file, data) {
//     const blob = new Blob([convertArrayToCsv(data)], { type: "text/csv" });
//     const fileWriter = new FileReader();

//     fileWriter.onload = function () {
//         const link = document.createElement("a");
//         link.href = fileWriter.result;
//         link.download = file.name;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     };

//     fileWriter.readAsDataURL(blob);
// }

async function saveCsvWithDialog(data) {
    try {
        // Проверяем поддержку API
        if (!window.showSaveFilePicker) {
            alert("Ваш браузер не поддерживает File System Access API.");
            return;
        }

        // Открываем диалоговое окно выбора места сохранения
        const handle = await window.showSaveFilePicker({
            suggestedName: "vessel.csv",
            types: [
                {
                    description: "CSV file",
                    accept: { "text/csv": [".csv"] }
                }
            ]
        });

        // Записываем данные в файл
        const writable = await handle.createWritable();
        await writable.write(convertArrayToCsv(data));
        await writable.close();

        console.log("Файл успешно сохранен!");
    } catch (error) {
        console.error("Ошибка сохранения:", error);
    }
}

function convertArrayToCsv(data) {
    const keys = Object.keys(data); // Получаем заголовки (x, r)
    const rows = [];

    // Формируем строки CSV
    for (let i = 0; i < data[keys[0]].length; i++) {
        rows.push(keys.map(key => data[key][i]).join(",")); // x[i], r[i]
    }

    return keys.join(",") + "\n" + rows.join("\n");
}

document.getElementById('mandrelExportCSV').addEventListener(
    'click', () => saveCsvWithDialog(getField("mandrelRaw"))
);

document.getElementById('mandrelExportCSVSmoothed').addEventListener(
    'click', () => saveCsvWithDialog(getField("mandrelSmoothed"))
);


// mandrel

function mandrelGet(isSmoothed = null){
    if (isSmoothed == null){
        let mandrel = getField("mandrelSmoothed");

        if (mandrel)
            return {mandrel, isSmoothed: true};
        
        mandrel = getField("mandrelRaw");
        if (mandrel)
            return {mandrel, isSmoothed: false};
        
        // throw new Error("no mandrel");
        return undefined

    } else {
        return {mandrel: getField(isSmoothed ? "mandrelSmoothed" : "mandrelRaw"), isSmoothed};

    }
}

function generatrixRender(mandrel, resolution) {
    const { x: x, r: r } = mandrel;

    const indices = [];
    const points  = [];

    const theta = Array.from({ length: resolution }, (_, j) => (2 * Math.PI * j) / resolution);

    for (let i = 0; i < r.length; i++) {
        const row = [];

        for (const fii of theta) {
            const px = x[i];
            const py = r[i] * Math.sin(fii);
            const pz = r[i] * Math.cos(fii);
            points.push(px, py, pz);

            row.push(points.length / 3 - 1);
        }
        indices.push(row);
    }

    const faces = [];
    for (let i = 0; i < indices.length - 1; i++) {
        const max = indices[i].length - 1
        for (let j = 0; j <= max; j++) {
            const nxt = (j + 1) % (max + 1);
            const p1 = indices[i][j];
            const p2 = indices[i][nxt];
            const p3 = indices[i + 1][j];
            const p4 = indices[i + 1][nxt];
            faces.push(p1, p4, p2);
            faces.push(p1, p3, p4);
        }
    }

    return [points, faces]
} 

function mandrelRender() {
    const mandrelData = mandrelGet();
    if (!mandrelData) return undefined;
    const { mandrel, isSmoothed } = mandrelData;
    return {render: generatrixRender(mandrel, 90), isSmoothed}
}

function mandrelDraw() {
    removeMesh(window.mandrelMesh);

    const renderData = mandrelRender();
    if (!renderData) return;
    const {render, isSmoothed} = renderData;

    window.mandrelMesh = addMesh(render, isSmoothed ? 0x2973B2: 0x48A6A7, true);

    mandrelChartUpdate(mandrelGet(true ));
    mandrelChartUpdate(mandrelGet(false));
}


// mandrel transformation

// reverse
document.getElementById('mandrelReverse').addEventListener(
    'click', () => {
        const { mandrel, isSmoothed } = mandrelGet();
        if (mandrel == undefined){
            return null;
        }
        let { x, r } = mandrel;
    
        x = x.map(value => -value);
        
        setField((isSmoothed ? "mandrelSmoothed" : "mandrelRaw"), { x, r });
    
        SetPole();
        mandrelDraw();
    }
);

// mirror
document.getElementById('mandrelMirror').addEventListener(
    'click', () => {
        const { mandrel, isSmoothed } = mandrelGet();
        if (mandrel == undefined){
            return null;
        }
        let { x, r } = mandrel;
    
        // 1. shift X to 0
        const shiftValue = x[0];
        const xSh = x.map(val => val - shiftValue);
    
        // 2. mirror by Y
        const xReflected = xSh.map((val, index) => (index === 0 ? val : -val)).reverse().slice(0, xSh.length - 1);
        const rReflected = [...r].reverse().slice(0, r.length - 1);
        
        // 3. combine halfs
        x = [...xReflected, ...xSh];
        r = [...rReflected, ...r];
    
        setField((isSmoothed ? "mandrelSmoothed" : "mandrelRaw"), { x, r });
    
        SetPole();
        mandrelDraw();
    }
);

// swap
document.getElementById('mandrelSwap').addEventListener(
    'click', () => {
        const { mandrel, isSmoothed } = mandrelGet();
        if (mandrel == undefined){
            return null;
        }
        let { x, r } = mandrel;
    
        setField((isSmoothed ? "mandrelSmoothed" : "mandrelRaw"), { x: r, r: x });
    
        SetPole();
        mandrelDraw();
    }
);

// reDir
document.getElementById('mandrelRedirect').addEventListener(
    'click', () => {
        const { mandrel, isSmoothed } = mandrelGet();
        if (mandrel == undefined){
            return null;
        }
        let { x, r } = mandrel;
    
        setField((isSmoothed ? "mandrelSmoothed" : "mandrelRaw"), { x: x.reverse(), r: r.reverse() });
    
        SetPole();
        mandrelDraw();
    }
);


// smooth

document.getElementById('mandrelSmooth').addEventListener(
    'click', () => {
        loading();

        mandrelSmooth()
            .then(() => {
                mandrelDraw()
                loaded();
            })
            .catch(error => {
                showError(error);
            });
    }
);

function mandrelSmooth() {
    const mandrel = getField("mandrelRaw");
    if (mandrel == undefined) return null;
    return lambdaCall("smooth_full", [mandrel])
        .then((res) => {
            setField("mandrelSmoothed", res);
            mandrelDraw();
        })
        .catch(error => {
            showError(error);
        });
}


// Coil

document.getElementById('coilCalc').addEventListener(
    'click', () => { coilCalc(); }
);

function coilCalc() {
    loading();

    try {
        const vessel_data = getVesselData();
        const { mandrel, isSmoothed } = mandrelGet();

        return lambdaCall("vitok", [vessel_data, mandrel])
            .then(res => {
                const [coil, mediana] = res
                setField("coilInitial", coil);

                loaded();

                tapeCalc(coilGet("Initial"), "tapeInitial", 0xfea02a);

                patternsCalc();
            })
            .catch(error => {
                showError(error);
            });
    } catch (error) {
        showError(error);
    }
}

function coilRender(coil) {
    if (!coil) 
        return undefined;

    const n = coil.x.length

    const vertices = [];
    const indices = [];

    for (let i = 0; i < n; i++) {
        pointXYZ(coil, i, vertices);

        if (i > 0) {
            indices.push(i - 1);
            indices.push(i);
        }
    }

    return [vertices, indices];
}


// Tape coil

// document.getElementById('tapeCalc').addEventListener(
//     'click', () => { tapeCalc(coilGet("Initial"), "tapeInitial"); }
// );

function tapeCalc(coil, tapeName, color = 0xffff00) {
    loading();
    const vessel_data = getVesselData();

    return lambdaCall("tape", [vessel_data, coil])
        .then(res => {
            setField(tapeName, res);
            coilDraws();
            loaded();
        })
}

function tapeRemove(suffix) {
    removeMesh(window["coil" + suffix + "Line"]);
    removeMesh(window["tape" + suffix + "Line"]);
    removeMesh(window["tape" + suffix + "Mesh"]);
}

function coilDraw(suffix) {
    let render = coilRender(coilGet(suffix));
    if(render){
        window["coil" + suffix + "Line"] = addLine(render);
    }

    render = tapeRender(suffix);
    if (render){
        const colorLine = 0xd38629
        window["tape" + suffix + "Line"] = addLine([render[0], render[1]], colorLine);
    
        const colorMesh = suffix == "Initial" ? 0xfea02a : 0xffff00
        window["tape" + suffix + "Mesh"] = addMesh([render[0], render[2]], colorMesh);
    }
}

function coilDraws() {
    const mode = getField("windingMode");

    tapeRemove("Initial");
    tapeRemove("Corrected");

    const coilCorrected = coilGet("Corrected")

    if (!coilCorrected){
        coilDraw("Initial");
    } else if (mode == "first"){
        coilDraw("Corrected");
    } else {
        coilDraw("Corrected", mode);
    }
}
window.coilDraws = coilDraws

function tapeRender(suffix) {
    const mode = suffix == "Initial" ? "first" : getField("windingMode");
    // mode: "first" | "round" | "all"

    const coil = coilGet(suffix);
    if (!coil) return undefined

    const n = coil.x.length;
    
    const tape = getField("tape" + suffix);
    if (!tape){
        return [[], []];
    }
    const [coilR, coilL] = tape;

    const vertices = [];
    const indLine  = [];
    const indPlain = [];

    let Coils = 1
    if (mode == "first"){
        Coils = 1
    } else if (mode == "round") {
        const vesselData = getVesselData()
        Coils = vesselData["Conv"] + 1
    } else if (mode == "all") {
        const vesselData = getVesselData()
        Coils = vesselData["Coils"]
    }

    const th = 0.05, thd = th / n;

    let i = 0, j = 0;
    pointXYZ(coilR, i, vertices);
    pointXYZ(coilL, i, vertices);

    j++;
    for (let round = 0, fiShift = 0., thi = th; round < Coils; round++) {

        // console.log("( round", round);

        for (i = 1; i < n; i++, j++, thi += thd) {
            pointXYZ(coilR, i, vertices, fiShift, thi);
            pointXYZ(coilL, i, vertices, fiShift, thi);

            indLine .push(j * 2 - 2); indLine .push(j * 2 + 0);
            indLine .push(j * 2 - 1); indLine .push(j * 2 + 1);

            indPlain.push(j * 2 - 2); indPlain.push(j * 2 - 1); indPlain.push(j * 2 + 0);
            indPlain.push(j * 2 - 1); indPlain.push(j * 2 + 1); indPlain.push(j * 2 + 0);
        };

        fiShift += coil.fi[n - 1];

        // console.log(") round", round);
    };

    return [vertices, indLine, indPlain];
}


// Equidestanta

function getBetaI(x, r, i){
    let j = i;

    if (i == 0           ) j = i + 1;
    if (i == x.length - 1) j = i - 1;

    let beta = Math.atan((r[j] - r[j-1]) / (x[j] - x[j-1]));

    if (Math.abs(beta) < 0.001) beta = 0.0;

    return beta;
}

function pointXYZ(coil, i, vertices, fiShift = 0., th = 0., yShift = 0.0){
    let sbth = 0., cbth = 0.;

    // if (i < 5) console.log(i, th)

    if (th != 0.) {
        const bi = getBetaI(coil["x"], coil["r"], i);
        sbth = th * Math.sin(bi);
        cbth = th * Math.cos(bi);
    };

    const fi  = coil.fi[i] + fiShift;
    const r   = coil.r [i];

    const cXi = (coil.x[i] - sbth);
    const cYi = (r + cbth) * Math.sin(fi) + yShift;
    const cZi = (r + cbth) * Math.cos(fi);

    vertices.push(cXi, cYi, cZi);
}

function getT(begin=0, end=0, long = false){
    if(end == 0)
        end = begin + 1;

    const vertices = [];
    const indices  = [];
    for (let i = begin; i < end; i++) {
        const pN = 4; // point count
        const j = (i - begin) * pN;

        const fiShift = (inputValue('testModeInput') == 0 ? 0. : -window.animateEqd["fi"][i]);
        const yShift  = (inputValue('testModeInput') <= 1 ? 0. : -window.animateEqd["r" ][i] + 120.);

        const pCoil = j + 0;
        pointXYZ(window.animateCoil   , i, vertices, fiShift, 0.0, yShift);

        const pEqd  = j + 1;
        pointXYZ(window.animateEqd    , i, vertices, fiShift, 0.0, yShift);

        const pTL = j + 2;
        pointXYZ(window.animateRolley0, i, vertices, fiShift, 0.0, yShift);

        const pTR = j + 3;
        pointXYZ(window.animateRolley1, i, vertices, fiShift, 0.0, yShift);

        if (long && i > 0) {
            indices.push(pEqd - pN); indices.push(pEqd);
        }
        if (i % 5 == 0) {
            if (inputValue('testModeInput') == 0){
                indices.push(pCoil); indices.push(pEqd);
                indices.push(pTL  ); indices.push(pTR )
            } else {
                indices.push(pTL  ); indices.push(pTR )
                indices.push(pTL  ); indices.push(pTR )
            }
        }
    };

    return [vertices, indices];
}

function equidDraw(){
    const coilK = coilGet("Corrected");
    const eqd  = getField("equidistanta");

    if (!coilK || !eqd){
        window.animate = false;
        return
    }
    window.animate = true;

    window.animateCoil    = coilK;
    window.animateEqd     = eqd ;
    [window.animateRolley0, window.animateRolley1] = getField("rolley");

    document.getElementById("animateSlider").max = window.animateCoil.x.length - 1;
    window.animateUpdateTime = 0;

    removeMesh(window.equidMesh);
    window.equidMesh = addLine(getT(0, coilK.x.length, true), 0x9ACBD0);

    {
        removeMesh(window.rolleyMesh);
        const vertices = Array(4 * 3).fill(0);
        const indices = [0, 1,  2, 3];
        window.rolleyMesh = addLine([vertices, indices], 0xff0000);
    };

    {
        removeMesh(window.carretMesh);
        const vertices = Array(4 * 3).fill(0);
        const indices = [0, 1,  2, 3];
        window.carretMesh = addLine([vertices, indices], 0x00ff00);
    };

    rolleyUpdate(0);
}


function addRolley() {
    const bend = 10.
    const rolleyMandrel = {
        x: [-bend * 1.05, -bend, -bend * 0.6, -bend * 0.3,  0, bend * 0.3,  bend * 0.6,  bend,  bend * 1.05],
        r: [ 0  ,  2,  1.3,  1.1,  1,  1.1,  1.3,  2,  0 ],
    };
    
    const render = generatrixRender(rolleyMandrel, 8)

    const mesh = addMesh(render, 0xFFFFFF);
    
    window.rolleyMesh0 = mesh;
}

function rolleyUpdate(i){
    if (!window.scale) return;

    {
        const rolleyVert = getT(i)[0];
        const pos = window.rolleyMesh.geometry.attributes.position;
        pos.array.set(rolleyVert);
        pos.needsUpdate = true;
    }

    if (window.rolleyMesh0){
        const eqd = window.animateEqd
        window.rolleyMesh0.rotation.z = eqd["al"][i];
        window.rolleyMesh0.position.set(eqd["x"][i] * scale.factor, 0, eqd["r"][i] * scale.factor);
    }

    // if (i == 20){
    //     const angleZ = window.animateEqd["al"][i]
    //     const RB = addRolley(angleZ, window.animateEqd["x"][i], 0, window.animateEqd["r"][i]);
    //     console.log(RB);
    // }


    {
        const Fr = scale.y.max * 2;
        // const Fd = Fr / 8;

        const Xi = window.animateEqd.x[i]
        const Yi = 0;
        const Zi = window.animateEqd.r[i]
        
        const vert = [];
        vert.push(Xi,  Yi,  Zi);
        vert.push(Xi,  Yi,  Zi + Fr);
        vert.push(Xi,  Yi,  Fr);
        vert.push(Xi, -Fr,  Fr);
        
        const pos = window.carretMesh.geometry.attributes.position;
        pos.array.set(vert);
        pos.needsUpdate = true;
    }
}
window.rolleyUpdate = rolleyUpdate;

document.getElementById('equidDraw').addEventListener( 'click', () => {
    loading();

    try {
        EqudestantaFromCoil()
            .then(() => {
                equidDraw();
                loaded();
            });
    } catch (error) {
        showError(error);
    }
});

function EqudestantaFromCoil() {
    const coilCorrected = coilGet("Corrected");
    if (!coilCorrected){
        return
    }

    return lambdaCall("equidistantaRolley", [coilCorrected, inputValue('safetyRInput')])
        .then(res => {
            if(!res) throw new Error("Empty lambdaCall result");
            setField("equidistanta", res[0]);
            setField("rolley", [res[1], res[2]]);
        })
        .catch(error => {
            showError(error);
        });
}


// Patterns

// document.getElementById('patternsCalc').addEventListener(
//     'click', () => { patternsCalc();}
// );

function patternsCalc() {
    loading();

    const vessel_data = getVesselData();
    const coil = coilGet("Initial");

    lambdaCall("fibbo", [vessel_data, coil])
        .then((res) => {
            setField("fibbo", res);
            fibboRenderTable();
            loaded();
        })
        .catch(error => {
            showError(error);
        });
}


// Correct coils

function coilGet(suffix) {
    const coilInitial = getField("coilInitial");
    if (suffix == "Initial") {
        return coilInitial;
    }

    const coilCorrected = getField("coilCorrected");
    if (!coilCorrected){
        return undefined;
    }

    return {
        x : coilInitial  ["x" ],
        r : coilInitial  ["r" ],
        fi: coilCorrected["fi"],
        al: coilCorrected["al"],
    };
}
window.coilGet = coilGet


document.getElementById('coilCorrect').addEventListener('click', () => {
    loading();

    const vessel_data = getVesselData();
    const coil = coilGet("Initial");

    lambdaCall("conte", [vessel_data, coil])
        .then(res => {
            setField("coilCorrected", {
                fi: res[0],
                al: res[1],
            });

            // function coilCorrectedDraw() {
            //     removeMesh(window.correctedCoilMesh);
            //     window.correctedCoilMesh = addLine(coilRender(coilGet("Corrected")));
            // }
            // coilCorrectedDraw();

            loaded();

            tapeCalc(coilGet("Corrected"), "tapeCorrected");
        })
        .catch(error => {
            showError(error);
        });
});


// ALL

function drawAll() {
    mandrelDraw();
    coilDraws()
    equidDraw();
}


// vesselSave

function downloadYamlFile(data, fileName) {
    const yamlString = jsyaml.dump(data);

    const blob = new Blob([yamlString], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.getElementById('vesselSave').addEventListener(
    'click', () => {
        downloadYamlFile(vessel, "vessel.yaml");
    }
);


// vesselLoad

const coilLoadInput = document.getElementById('coilLoadInput');
document.getElementById('coilLoad').addEventListener(
    'click', () => { coilLoadInput.click(); }
);
coilLoadInput.addEventListener(
    'change', function (event) { coilLoadOnClick(event) }
);
function coilLoadOnClick(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = coilLoadOnFileLoad;

    reader.readAsText(file);
};
function coilLoadOnFileLoad(event) {
    setField("coilInitial", loadFromYaml(event.target.result));
    tapeCalc();
}


// Examples

document.getElementById('vesselExample1').addEventListener(
    'click', () => { vesselloadFromURL("Example1"); }
);
document.getElementById('vesselExample2').addEventListener(
    'click', () => { vesselloadFromURL("Example2"); }
);

async function loadFromYamlURL(url) {
    let response = null;
    try {
        response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
    } catch (error) {
        showError(error);
    }
    setVessel(loadFromYaml(await response.text()));
}

function vesselloadFromURL(name) {
    clearVessel();
    clearScene();

    loadFromYamlURL('./examples/' + name + '.yaml').then(() => {
        SetPole();
        drawAll();
    })
};


// Clear
document.getElementById('vesselClear').addEventListener(
    'click', () => {
        clearVessel();
        clearScene();
        clearChart();
    }
);


function vesselOnLoad() {
    getVessel();
    if (!vessel.mandrelRaw) {
        vesselloadFromURL("Example1");
    } else {
        drawAll();
    }
    SetPole();

    addRolley();
}
window.vesselOnLoad = vesselOnLoad
