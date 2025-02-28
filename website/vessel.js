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

// ImportCSV

// const mandrelImportCSVInput = document.getElementById('mandrelImportCSVInput');
// document.getElementById('mandrelImportCSV').addEventListener(
//     'click', () => {
//         loading();
//         mandrelImportCSVInput.value = "";
//         mandrelImportCSVInput.click();
//     }
// );

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


function mandrelImportCSV(Name){
    const fileInput = document.getElementById('fileInput');
    fileInput.onchange = function (event) {
        const file = event.target.files[0];
        if (!file) return;
        
        mandrelImportCSVOnInputClick(file, Name)
    };
    
    fileInput.value = "";
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.click();
}

function mandrelImportCSVOnInputClick(file, Name){
    const reader = new FileReader();
    reader.onload = function(event) {
        const colNumEl = document.getElementById('csv-column');
        mandrelImportCSVOnFileLoad(Name, event.target.result, colNumEl.value - 1);
    };
    reader.readAsText(file);
}
window.mandrelImportCSV = mandrelImportCSV;

function mandrelImportCSVOnFileLoad(name, text, colNum) {
    const mandrel = mandrelFromCSV(text, colNum);
    mandrelSet(name, mandrel.x, mandrel.y)
    loaded();
};
window.mandrelImportCSVOnFileLoad = mandrelImportCSVOnFileLoad;

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

    return { x, r }
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

async function saveCsvWithDialog(Name) {
    const data = getField(Name)
    if (!data) {
        showError("No data to save");
        return
    }

    try {
        if (!window.showSaveFilePicker) {
            alert("File System Access API is not supported by your browser");
            return;
        }

        const handle = await window.showSaveFilePicker({
            suggestedName: "vessel.csv",
            types: [
                {
                    description: "CSV file",
                    accept: { "text/csv": [".csv"] }
                }
            ]
        });

        const writable = await handle.createWritable();
        await writable.write(convertArrayToCsv(data));
        await writable.close();

    } catch (error) {
        showError(error);

    }
}
window.saveCsvWithDialog = saveCsvWithDialog

function convertArrayToCsv(data) {
    const keys = Object.keys(data); // Получаем заголовки (x, r)
    const rows = [];

    // Формируем строки CSV
    for (let i = 0; i < data[keys[0]].length; i++) {
        rows.push(keys.map(key => data[key][i]).join(",")); // x[i], r[i]
    }

    return keys.join(",") + "\n" + rows.join("\n");
}

// document.getElementById('mandrelExportCSV').addEventListener(
//     'click', () => saveCsvWithDialog(getField("mandrelRaw"))
// );

// document.getElementById('mandrelExportCSVSmoothed').addEventListener(
//     'click', () => saveCsvWithDialog(getField("mandrelSmoothed"))
// );


// mandrel

function mandrelGet(name){
    return getField("mandrel" + name);
}
window.mandrelGet = mandrelGet

function mandrelGet_obsolete(isSmoothed = null){
    if (isSmoothed == null){
        let mandrel = getField("mandrelSmoothed");

        if (mandrel)
            return {mandrel, isSmoothed: true};
        
        mandrel = getField("mandrelRaw");
        if (mandrel)
            return {mandrel, isSmoothed: false};
        
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

function mandrelTreeUpdate(name) {
    removeMesh(window["mandrel" + name + "Mesh"]);
  
    const mandrel = mandrelGet(name);
    if (mandrel){
        const render = generatrixRender(mandrel, 90)
    
        let color;
        let transpatent;
        let setScale = false;
        if        (name == "Raw"){
            color = 0x2973B2;
            transpatent = 1.;
            setScale = true;
        } else if (name == "Winded"){
            color = 0x48A6A7;
            transpatent = 0.5;
        } else if (name == "Smoothed"){
            color = 0x000000;
            transpatent = 0.3;
        }
            
        window["mandrel" + name + "Mesh"] = addMesh(render, color, transpatent, setScale);
    }
  
}
window.mandrelTreeUpdate = mandrelTreeUpdate;
  
function SetPole() {
    const mandrel = getField("mandrelRaw")
    if (!mandrel) return;
    const {x, r} = mandrel
    if (r.length > 0) inputValue('poleInput', r[0]);
}

function mandrelSet(name, xOrMandrel, r = undefined){
    const mandrel = r ? { x: xOrMandrel, r: r } : xOrMandrel;
    setField("mandrel" + name, mandrel);
    if (name == "Raw") SetPole();
    mandrelDraw(name);
}

function mandrelDraw(name) {
    mandrelTreeUpdate (name);
    mandrelChartUpdate(name);
}

function mandrelsDraw() {
    mandrelDraw("Raw")
    mandrelDraw("Winded")
    mandrelDraw("Smoothed")
}

function mandrelClear(name) {
    mandrelSet(name, undefined);
}
window.mandrelClear = mandrelClear;


// mandrel transformation

// reverse
document.getElementById('mandrelReverse').addEventListener(
    'click', () => {
        const mandrel = mandrelGet("Raw");
        if (!mandrel) return null;
        let { x, r } = mandrel;
        x = x.map(value => -value);
        mandrelSet("Raw", x, r);
    }
);

// mirror
document.getElementById('mandrelMirror').addEventListener(
    'click', () => {
        const mandrel = mandrelGet("Raw");
        if (!mandrel) return null;
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
    
        mandrelSet("Raw", x, r);
    }
);

// swap
document.getElementById('mandrelSwap').addEventListener(
    'click', () => {
        const mandrel = mandrelGet("Raw");
        if (!mandrel) return null;
        let { x, r } = mandrel;
        mandrelSet("Raw", r, x)
    }
);

// reDir
document.getElementById('mandrelRedirect').addEventListener(
    'click', () => {
        const mandrel = mandrelGet("Raw");
        if (!mandrel) return null;
        let { x, r } = mandrel;
        mandrelSet("Raw", x.reverse(), r.reverse())
    }
);


// smooth

document.getElementById('thicknessGet').addEventListener(
    'click', () => {
        loading();

        const coilCorrected = coilGet("Corrected")
        const coilMeridian = getField("coilMeridian");

        if (!coilCorrected || !coilMeridian) {
            showError("No data");
            return;
        }

        return lambdaCall("thickness", [coilCorrected, coilMeridian])
            .then((res) => {
                mandrelSet("Winded", res);
                loaded();
            })
            .catch(error => {
                showError(error);
            });
    }
);

// smooth

document.getElementById('mandrelSmooth').addEventListener(
    'click', () => {
        loading();

        const mandrel = mandrelGet("Winded");
        if (!mandrel) {
            showError("No winded mandrel");
            return;
        }

        return lambdaCall("smooth_full", [mandrel])
            .then((res) => {
                mandrelSet("Smoothed", res);
                loaded();
            })
            .catch(error => {
                showError(error);
            });
    }
);


// Coil

document.getElementById('coilCalc').addEventListener(
    'click', () => { coilCalc(); }
);

function coilCalc() {
    loading();

    const vessel_data = getVesselData();
    const mandrel = mandrelGet("Raw");
    if (!mandrel) return null;

    try {
        return lambdaCall("vitok", [vessel_data, mandrel])
            .then(res => {
                const [coil, meridian] = res
                setField("coilInitial", coil);
                setField("coilMeridian", meridian);

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

    return lambdaCall("tape", [coil, vessel_data["Band"]])
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

        const fiShift = 0. // (inputValue('testModeInput') == 0 ? 0. : -window.animateEqd["fi"][i]);
        const yShift  = 0. // (inputValue('testModeInput') <= 1 ? 0. : -window.animateEqd["r" ][i] + 120.);

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
            // if (inputValue('testModeInput') == 0){
                indices.push(pCoil); indices.push(pEqd);
                indices.push(pTL  ); indices.push(pTR )
            // } else {
            //     indices.push(pTL  ); indices.push(pTR )
            //     indices.push(pTL  ); indices.push(pTR )
            // }
        }
    };

    return [vertices, indices];
}

function createBoxWithOctagonHole() {
    const vertices = [];
    const indices = [];

    const w = 2, h = 2, d = 2;

    const boxVertices = [
        [-w, -h, -d], [w, -h, -d], [w, h, -d], [-w, h, -d],  // Задняя грань
        [-w, -h, d], [w, -h, d], [w, h, d], [-w, h, d],  // Передняя грань
    ];

    for (let v of boxVertices) vertices.push(...v);

    const boxIndices = [
        0, 1, 2, 2, 3, 0,  // Задняя грань
        4, 5, 6, 6, 7, 4,  // Передняя грань
        0, 1, 5, 5, 4, 0,  // Нижняя грань
        2, 3, 7, 7, 6, 2,  // Верхняя грань
        1, 2, 6, 6, 5, 1,  // Правая грань
        0, 3, 7, 7, 4, 0   // Левая грань
    ];
    
    indices.push(...boxIndices);

    const octagon = [];
    const radius = 0.5;
    for (let i = 0; i < 8; i++) {
        let angle = (Math.PI / 4) * i;
        octagon.push([Math.cos(angle) * radius, Math.sin(angle) * radius, d]);
    }

    let startIdx = vertices.length / 3;
    for (let v of octagon) vertices.push(...v);

    for (let i = 0; i < 8; i++) {
        indices.push(4, startIdx + i, startIdx + (i + 1) % 8); // Треугольники
    }

    return [vertices, indices];
}

function animationSetup(){
    let coil = coilGet("Interpolated");
    let eqd  = getField("equidistantaInterpolated");
    let roll = getField("rolleyInterpolated");
    let color = 0x9ACBD0

    if (!coil) {
        coil = coilGet("Corrected");
        eqd  = getField("equidistanta");
        roll = getField("rolley");
        color = 0xfea02a
    }

    if (!coil || !eqd){
        window.animate = false;
        return
    }

    const Fr = scale.y.max * 2;
    const Fd = Fr / 100;

    window.animate = true;

    window.animateCoil    = coil;
    window.animateEqd     = eqd ;
    window.animateRolley0 = roll;

    const roll1 = {"x": [], "r": [], "fi": [], "al": []};
    for (let i = 0; i < roll.x.length; i++) {
        roll1.x .push(eqd.x [i] * 2 - roll.x [i]);
        roll1.r .push(eqd.r [i]);
        roll1.fi.push(eqd.fi[i] * 2 - roll.fi[i]);
    };
    window.animateRolley1 = roll1;

    document.getElementById("animateSlider").max = window.animateCoil.x.length - 1;
    window.animateUpdateTime = 0;

    removeMesh(window.equidMesh);
    window.equidMesh = addLine(getT(0, coil.x.length, true), color, true);

    {
        removeMesh(window.rolleyMesh);
        const vertices = Array(4 * 3).fill(0);
        const indices = [0, 1,  2, 3];
        window.rolleyMesh = addLine([vertices, indices], 0xff0000);
    };

    {
        removeMesh(window.carretLine);
        const vertices = Array(4 * 3).fill(0);
        const indices = [0, 1,  2, 3];
        window.carretLine = addLine([vertices, indices], 0x00ff00);
    };

    {
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


    {
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

    const eqd = window.animateEqd

    {
        const rolleyVert = getT(i)[0];
        const pos = window.rolleyMesh.geometry.attributes.position;
        pos.array.set(rolleyVert);
        pos.needsUpdate = true;
    }

    if (window.rolleyMesh0){
        window.rolleyMesh0.rotation.z = eqd["al"][i]; //Math.PI * 0.5 - 
        window.rolleyMesh0.position.set(eqd["x"][i] * scale.factor, 0, eqd["r"][i] * scale.factor);
    }

    // if (i == 20){
    //     const angleZ = eqd["al"][i]
    //     const RB = addRolley(angleZ, eqd["x"][i], 0, eqd["r"][i]);
    //     console.log(RB);
    // }


    {
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
window.rolleyUpdate = rolleyUpdate;


// Equdestanta
document.getElementById('eqdDraw').addEventListener( 'click', () => {
    loading();

    const coilCorrected = coilGet("Corrected");
    if (!coilCorrected){
        return
    }

    lambdaCall("equidistantaRolley", [coilCorrected, inputValue('safetyRInput')])
        .then(res => {
            setField("equidistanta", res[0]);
            setField("rolley", res[1]);

            animationSetup();

            loaded();
        })
        .catch(error => {
            showError(error);
        });
});


// Interpolanta
document.getElementById('itpDraw').addEventListener( 'click', () => {
    loading();

    const coilCorrected = coilGet("Corrected");
    const eqd = getField("equidistanta");
    if (!coilCorrected || !eqd){
        showError("no data")
        return
    }

    lambdaCall("interpolantaRolley", [coilCorrected, eqd, inputValue('lineCountInput')])
        .then(res => {
            setField("coilInterpolated"        , res[0]);
            setField("equidistantaInterpolated", res[1]);
            setField("rolleyInterpolated"      , res[2]);

            animationSetup();

            loaded();
        })
        .catch(error => {
            showError(error);
        });
});


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
    let coil = getField("coil" + suffix);

    if (!coil) return undefined;
    
    if (suffix == "Corrected") {
        const coilInitial = getField("coilInitial");
        coil = {
            x : coilInitial["x" ],
            r : coilInitial["r" ],
            fi: coil["fi"],
            al: coil["al"],
        };
    };

    return coil;
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


document.getElementById('CNCExport').addEventListener(
    'click', () => CNCExport()
);

async function CNCExport() {
    loading();
    const itpEqd = getField("equidistantaInterpolated");
    if (!itpEqd) {
        showError("No interpolated equidistanta yet");
        return;
    }

    // Проверяем поддержку API
    if (!window.showSaveFilePicker) {
        alert("File System Access API is not supported by your browser.");
        return;
    }

    let handle;
    try {
        handle = await window.showSaveFilePicker({
            suggestedName: "CNC.txt",
            types: [
                {
                    description: "Text file",
                    accept: { "text/csv": [".txt"] }
                }
            ]
        });
    } catch (error) {
        showError("File picker was cancelled or failed: " + error);
        return;
    }

    try {
        const txt = await lambdaCall("CNC", [itpEqd]);

        const writable = await handle.createWritable();
        await writable.write(txt);
        await writable.close();
        console.log("File saved");
    } catch (error) {
        showError("Failed to save file: " + error);
    } finally {
        loaded();
    }
}



// ALL

function drawAll() {
    mandrelsDraw();
    coilDraws()
    animationSetup();
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
// document.getElementById('vesselExample2').addEventListener(
//     'click', () => { vesselloadFromURL("Example2"); }
// );

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
        drawAll();
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
