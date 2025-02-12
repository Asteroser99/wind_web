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


// vessel_data

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


// lambdaCall

function lambdaCall(name, param) {
    const path = 'https://z2qmzcusx7.execute-api.eu-central-1.amazonaws.com/prod/';
    const accessToken = localStorage.getItem('accessToken'); // Получаем токен из локального хранилища

    const headers = {
        headers: {
            auth: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    }

    return axios.post(
        path + name,
        JSON.stringify(param),
        headers
    )
        .then((response) => {
            if(!response.data) throw new Error("Empty lambdaCall result");
            return response.data;
        })
        .catch((error) => {
            showError(error);
        });
}

function SetPole() {
    const mandrel = getField("mandrel")
    const {x, r} = mandrel
    if (r.length > 0) inputValue('poleInput', r[0]);
}


// Mandrel

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

    setField("mandrel", { x, r });
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

// Преобразование массива объектов в CSV
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
    'click', () => saveCsvWithDialog(getField("mandrel"))
);

document.getElementById('mandrelExportCSVSmoothed').addEventListener(
    'click', () => saveCsvWithDialog(getField("smoothed"))
);


// mandrelDraw

function mandrelDraw() {
    removeMesh(window.mandrelMesh);

    const {render, isSmoothed} = mandrelRender();

    window.mandrelMesh = addMesh(render, true,  isSmoothed ? 0x2973B2: 0x48A6A7);

    mandrelChartUpdate(mandrelGet(true ));
    mandrelChartUpdate(mandrelGet(false));
}

function mandrelGet(isSmoothed = null){
    if (isSmoothed == null){
        let mandrel = getField("smoothed");
        if (mandrel)
            return {mandrel, isSmoothed: true};
        
        mandrel = getField("mandrel");
        if (mandrel)
            return {mandrel, isSmoothed: false};
        
        throw new Error("no mandrel");

    } else {
        return {mandrel: getField(isSmoothed ? "smoothed" : "mandrel"), isSmoothed};

    }
}

function mandrelRender() {
    const { mandrel: { x: x, r: r }, isSmoothed } = mandrelGet();

    const resolution = 100;
    const indices = [];
    const points = [];

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
            const nxt = (j + 1) % max;
            const p1 = indices[i][j];
            const p2 = indices[i][nxt];
            const p3 = indices[i + 1][j];
            const p4 = indices[i + 1][nxt];
            faces.push(p1, p4, p2);
            faces.push(p1, p3, p4);
        }
}

    return {render: [points, faces], isSmoothed}
}

// smooth

document.getElementById('mandrelSmooth').addEventListener(
    'click', () => { mandrelSmoothOnClick(); }
);

function mandrelSmoothOnClick() {
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

function mandrelSmooth() {
    const mandrel = getField("mandrel");
    if (mandrel == undefined) return null;
    return lambdaCall("smooth_full", [mandrel])
        .then((res) => {
            setField("smoothed", res);
            mandrelDraw();
        })
        .catch(error => {
            showError(error);
        });
}

// reverse

document.getElementById('mandrelReverse').addEventListener(
    'click', () => { mandrelReverseOnClick(); }
);

function mandrelReverseOnClick() {
    const mandrel = getField("mandrel");
    if (mandrel == undefined){
        return null;
    }
    let { x, r } = mandrel;

    x = x.map(value => -value);
    
    setField("mandrel", { x, r });

    SetPole();
    mandrelDraw();
}

// mirror

document.getElementById('mandrelMirror').addEventListener(
    'click', () => { mandrelMirrorOnClick(); }
);

function mandrelMirrorOnClick() {
    const mandrel = getField("mandrel");
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

    setField("mandrel", { x, r });

    SetPole();
    mandrelDraw();
}

// swap

document.getElementById('mandrelSwap').addEventListener(
    'click', () => { mandrelSwapOnClick(); }
);

function mandrelSwapOnClick() {
    const mandrel = getField("mandrel");
    if (mandrel == undefined){
        return null;
    }
    let { x, r } = mandrel;

    setField("mandrel", { x: r, r: x });

    SetPole();
    mandrelDraw();
}


// swap

document.getElementById('mandrelDir').addEventListener(
    'click', () => { mandrelDirOnClick(); }
);

function mandrelDirOnClick() {
    const mandrel = getField("mandrel");
    if (mandrel == undefined){
        return null;
    }
    let { x, r } = mandrel;

    setField("mandrel", { x: x.reverse(), r: r.reverse() });

    SetPole();
    mandrelDraw();
}


// Line coil

function coilDraw() {
    removeMesh(window.coilMesh);
    window.coilMesh = addLine(coilRender("coil"));
}

document.getElementById('coilDraw').addEventListener(
    'click', () => { coilDrawOnClick(); }
);

function coilDrawOnClick() {
    loading();

    try {
        coilFromMandrel()
            .then(() => {
                coilDraw();
                loaded();
            });
            // .catch(error => {
            //     showError(error);
            // });
    } catch (error) {
        showError(error);
    }
}

function coilFromMandrel() {
    const { mandrel, isSmoothed } = mandrelGet();

    const vessel_data = getVesselData();

    return lambdaCall("vitok", [vessel_data, mandrel])
        .then(res => {
            if(!res) throw new Error("Empty lambdaCall result");
            setField("coil", res);
        })
        .catch(error => {
            showError(error);
        });
}

function coilRender(coilName) {
    const coil = getField(coilName);
    if (coil == undefined){
        return [[], []];
    }
    const n = coil.x.length

    const vertices = [];
    const indices = [];

    for (let i = 0; i < n; i++) {
        pushPoint(coil, i, vertices);

        if (i > 0) {
            indices.push(i - 1);
            indices.push(i);
        }
    }

    return [vertices, indices];
}


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


// Tape coil

document.getElementById('tapeDraw').addEventListener(
    'click', () => { tapeDrawOnClick(); }
);

function tapeDrawOnClick() {
    loading();
    tapeFromCoil()
        .then(() => {
            tapeDraw();
            loaded();
        })
        .catch(error => {
            showError(error);
        });
}

function tapeFromCoil() {
    const vessel_data = getVesselData();
    const coil = getField("coil");

    return lambdaCall("gltfCoil", ["TapeN", vessel_data, coil])
        .then(gltf => {
            if(!gltf) throw new Error("Empty lambdaCall result");
            setField("tape", gltf);
        })
        .catch(error => {
            showError(error);
        });
}

function tapeDraw() {
    const gltf = getField("tape");
    if (gltf == undefined){
        return;
    }
    removeMesh(window.tapeMesh);
    window.tapeMesh = addMesh([gltf.verticesArray, gltf.indicesArray], false, 0xffff00);
}


// Equidestanta

function pushPoint(source, i, vertices){
    const cXi = source.x[i];
    const cYi = source.r[i] * Math.sin(source.fi[i]);
    const cZi = source.r[i] * Math.cos(source.fi[i]);
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

        const pCoil = j + 0;
        pushPoint(window.animateCoil, i, vertices);

        const pEqd  = j + 1;
        pushPoint(window.animateEqd, i, vertices);

        const pTL = j + 2;
        pushPoint(window.animateRolley0, i, vertices);

        const pTR = j + 3;
        pushPoint(window.animateRolley1, i, vertices);

        if (long && i > 0) {
            indices.push(pEqd - pN); indices.push(pEqd);
        }
        if (i % 5 == 0) {
            indices.push(pCoil); indices.push(pEqd);
            indices.push(pTL  ); indices.push(pTR )
        }
    };

    return [vertices, indices];
}

function equidDraw(){
    const coil = getField("coil");
    const eqd  = getField("equidistanta");

    if (!coil || !eqd){
        window.animate = false;
        return
    }
    window.animate = true;

    window.animateCoil    = coil;
    window.animateEqd     = eqd ;
    window.animateRolley0 = getField("rolley0");
    window.animateRolley1 = getField("rolley1");

    document.getElementById("animateSlider").max = window.animateCoil.x.length;
    window.animateUpdateTime = 0;

    removeMesh(window.equidMesh);
    window.equidMesh = addLine(getT(0, coil.x.length, true), 0x9ACBD0);

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

function rolleyUpdate(i){
    if (!window.scale) return;

    {
        const rolleyVert = getT(i)[0];
        const pos = window.rolleyMesh.geometry.attributes.position;
        pos.array.set(rolleyVert);
        pos.needsUpdate = true;
    }

    {
        const Fr = scale.y.max * 2;

        const Xi = window.animateEqd.x[i]
        const Yi = 0;
        const Zi = window.animateEqd.r[i]
        
        const vert = [];
        vert.push(Xi,  Yi, Zi);
        vert.push(Xi,  Yi, Zi + Fr);
        vert.push(Xi,  Yi, Fr);
        vert.push(Xi, -Fr, Fr);
        
        const pos = window.carretMesh.geometry.attributes.position;
        pos.array.set(vert);
        pos.needsUpdate = true;
    }
}
window.rolleyUpdate = rolleyUpdate;

document.getElementById('equidDraw').addEventListener(
    'click', () => { equidDrawOnClick(); }
);

function equidDrawOnClick() {
    loading();

    try {
        EqudestantaFromCoil()
            .then(() => {
                equidDraw();
                loaded();
            });
            // .catch(error => {
            //     showError(error);
            // });
    } catch (error) {
        showError(error);
    }
}

function EqudestantaFromCoil() {
    const coil = getField("coil");

    return lambdaCall("equidistantaRolley", [coil])
        .then(res => {
            if(!res) throw new Error("Empty lambdaCall result");
            setField("equidistanta", res[0]);
            setField("rolley0", res[1]);
            setField("rolley1", res[2]);
        })
        .catch(error => {
            showError(error);
        });
}


// Patterns

document.getElementById('getPatterns').addEventListener(
    'click', () => {
        loading();
        getPatterns()
            .then(() => {
                fibboRenderTable();
                loaded();
            })
            .catch(error => {
                showError(error);
            });
    }
);


function getPatterns() {
    const vessel_data = getVesselData();
    const coil = getField("coil");
    return lambdaCall("fibbo", [vessel_data, coil])
        .then(res => {
            if(!res) throw new Error("Empty lambdaCall result");
            setField("fibbo", res);
        })
        .catch(error => {
            showError(error);
        });
}


// Correct coils

function correctedCoilDraw() {
    removeMesh(window.correctedCoilMesh);
    window.correctedCoilMesh = addLine(coilRender("correctedCoil"));
}

document.getElementById('correctCoil').addEventListener(
    'click', () => {
        loading();

        const vessel_data = getVesselData();
        const coil = getField("coil");

        lambdaCall("conte", [vessel_data, coil])
            .then(res => {
                // if(!res) throw new Error("Empty lambdaCall result");
                setField("correctedCoil", res);
                console.log(res);
                correctedCoilDraw();
                loaded();
            })
            .catch(error => {
                showError(error);
            });
    }
);


// ALL

function drawAll() {
    mandrelDraw();
    coilDraw();
    tapeDraw();
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
    setField("coil", loadFromYaml(event.target.result));
    coilDraw();
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
document.getElementById('clear').addEventListener(
    'click', () => {
        clearVessel();
        clearScene();
        clearChart();
    }
);


function vesselOnLoad() {
    getVessel();
    if (Object.keys(vessel).length === 0) {
        vesselloadFromURL("Example1");
    } else {
        drawAll();
    }
}
window.vesselOnLoad = vesselOnLoad
