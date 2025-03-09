window.vessel = {};

window.mandrelMesh = null;


// storage

const fieldAsyncStorageSet = (key, value) => {
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


const fieldGet = (key) => {
    if (Object.keys(vessel).length === 0) {
        const keys = JSON.parse(localStorage.getItem('vessel_keys')) || [];
        // console.log(keys);
        keys.forEach((storedKey) => {
            let value = localStorage.getItem(`vessel_${storedKey}`);
            // console.log(key, typeof value, value);
            if (value && value != undefined){
                try {
                    value = JSON.parse(value);
                } catch (error) {
                    value = undefined;
                }
            }
            vessel[storedKey] = value;
        });
    }
    return vessel[key];
};
window.fieldGet = fieldGet

const fieldSet = async (key, value) => {
    vessel[key] = value;

    try {
        const result = await fieldAsyncStorageSet(key, value);
    } catch (error) {
        showError(error);
    }
};
window.fieldSet = fieldSet

const fieldAllClear = () => {
    const keys = JSON.parse(localStorage.getItem('vessel_keys')) || [];

    keys.forEach((key) => {
        localStorage.removeItem(`vessel_${key}`);
    });

    localStorage.removeItem('vessel_keys');

    vessel = {};
};

const fieldAllSet = async (newVessel) => {
    fieldAllClear();

    vessel = newVessel;

    const promises = Object.entries(newVessel).map(([key, value]) =>
        fieldAsyncStorageSet(key, value)
    );

    // try {
    //     await Promise.all(promises);
    //     console.log('New vessel set successfully.');
    // } catch (error) {
        // showError(error);
    // }
};

const fieldAllUpdateFromStorage = () => {
    const keys = JSON.parse(localStorage.getItem('vessel_keys')) || [];

    keys.forEach((key) => {
        const jsonStr = localStorage.getItem(`vessel_${key}`)
        if (jsonStr && jsonStr != "undefined") {
            const value = JSON.parse(jsonStr);
            vessel[key] = value;
        }
    });
};

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
    fieldAllSet(loadFromYaml(event.target.result));
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


// Mandrel

// ImportCSV

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


function mandrelImportCSV(prefix){
    const fileInput = document.getElementById('fileInput');
    fileInput.onchange = function (event) {
        const file = event.target.files[0];
        if (!file) return;
        
        mandrelImportCSVOnInputClick(file, prefix)
    };
    
    fileInput.value = "";
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.click();
}

function mandrelImportCSVOnInputClick(file, prefix){
    const reader = new FileReader();
    reader.onload = function(event) {
        const colNumEl = document.getElementById('csvColumn');
        if(colNumEl.value == "") colNumEl.value = 1
        mandrelImportCSVOnFileLoad(prefix, event.target.result, colNumEl.value - 1);
    };
    reader.readAsText(file);
}
window.mandrelImportCSV = mandrelImportCSV;

function mandrelImportCSVOnFileLoad(prefix, text, colNum) {
    let mandrel
    try {
        if (prefix == "Raw") vesselClear();
        mandrel = mandrelFromCSV(text, colNum);
        mandrelSet(prefix, mandrel)
    } catch (error) {
        showError(`Error importing file: ${error}`);
    }
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
    if (headers.length < colNum * 2 + 2)
        throw new Error( "There is only " + (headers.length / 2 + 1) + " columns in CSV. Column number " + (colNum + 1) + " is not available" );

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

async function saveCsvWithDialog(name) {
    const data = fieldGet("mandrel" + name)
    if (!data) {
        showError("No data to save");
        return
    }

    try {
        if (!window.showSaveFilePicker) {
            showError("File System Access API is not supported by your browser");
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
//     'click', () => saveCsvWithDialog(fieldGet("mandrelRaw"))
// );

// document.getElementById('mandrelExportCSVSmoothed').addEventListener(
//     'click', () => saveCsvWithDialog(fieldGet("mandrelSmoothed"))
// );


// mandrel

function mandrelGet(name){
    return fieldGet("mandrel" + name);
}
window.mandrelGet = mandrelGet

function mandrelGet_obsolete(isSmoothed = null){
    if (isSmoothed == null){
        let mandrel = fieldGet("mandrelSmoothed");

        if (mandrel)
            return {mandrel, isSmoothed: true};
        
        mandrel = fieldGet("mandrelRaw");
        if (mandrel)
            return {mandrel, isSmoothed: false};
        
        return undefined

    } else {
        return {mandrel: fieldGet(isSmoothed ? "mandrelSmoothed" : "mandrelRaw"), isSmoothed};

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
window.generatrixRender = generatrixRender

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
    const mandrel = mandrelGet("Raw")
    if (!mandrel) return;
    const {x, r} = mandrel
    if (r.length > 0) inputFieldSet('poleR', r[0]);
}

function mandrelSet(name, xOrMandrel, r = null){
    let mandrel = xOrMandrel;
    if (r) mandrel = { x: xOrMandrel, r: r };
    fieldSet("mandrel" + name, mandrel);
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
        const coilMeridian = fieldGet("coilMeridian");

        if (!coilCorrected || !coilMeridian) {
            showError("No data");
            return;
        }

        return lambdaCall("thickness", [coilCorrected, coilMeridian, fieldGet('band')])
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

    const mandrel = mandrelGet("Raw");
    if (!mandrel) return null;

    try {
        return lambdaCall("vitok", [mandrel, fieldGet("poleR"), fieldGet("band")])
            .then(res => {
                const [coil, meridian] = res
                coilSet("Initial", coil);
                fieldSet("coilMeridian", meridian);

                loaded();

                tapeCalc("Initial");

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
    const indices  = [];

    for (let i = 0; i < n; i++) {
        vertices.push(...pointXYZ(coil, i));

        if (i > 0) {
            indices.push(i - 1);
            indices.push(i);
        }
    }

    return [vertices, indices];
}


// Tape

function tapeCalc(prefix) {
    loading();
    const coil = coilGet(prefix)
    return lambdaCall("tape", [coil, fieldGet("band")])
        .then(res => {
            fieldSet("tape" + prefix, res);
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
    
        const colorMesh = suffix == "Initial" ? 0xff5500 : (suffix == "Corrected" ? 0xfea02a : 0xffff00)
        window["tape" + suffix + "Mesh"] = addMesh([render[0], render[2]], colorMesh);
    }
}

function coilDraws() {
    const mode = fieldGet("windingMode");

    tapeRemove("Initial");
    tapeRemove("Corrected");
    tapeRemove("Interpolated");

    if (coilGet("Interpolated")){
        coilDraw("Interpolated");
    } else if (coilGet("Corrected")){
        coilDraw("Corrected");
    } else {
        coilDraw("Initial");
    }
}
window.coilDraws = coilDraws

function tapeRender(suffix) {
    const mode = suffix == "Initial" ? "first" : fieldGet("windingMode");
    // mode: "first" | "round" | "all"

    const coil = coilGet(suffix);
    if (!coil) return undefined

    const n = coil.x.length;
    
    const tape = fieldGet("tape" + suffix);
    if (!tape){
        return [[], []];
    }

    const vertices = [];
    const indLine  = [];
    const indPlain = [];

    let Coils = 1
    if (mode == "first"){
        Coils = 1
    } else if (mode == "round") {
        Coils = fieldGet("conv") + 1
    } else if (mode == "all") {
        const fibboGetSelected = fibboGetSelectedValues();
        Coils = fibboGetSelected["Coils"]
    }

    const th = 0.02, thd = th / n;

    let i = 0, j = 0;
    const pT0 = pointXYZ(coil, i)
    const pTR = pointXYZ(tape, i)
    vertices.push(...pTR);
    // const pTL = pointXYZ(tape, i, 0, 0, 0, pT0)
    const pTL = mirrorXYZ(pTR, pT0)
    vertices.push(...pTL);


    j++;
    for (let round = 0, fiShift = 0, thi = th; round < Coils; round++) {
        for (i = 1; i < n; i++, j++, thi += thd) {
            const pT0 = pointXYZ(coil, i, fiShift)
            const pT1 = pointXYZ(coil, i, fiShift, thi, coil)

            const pTR = pointXYZ(tape, i, fiShift, thi, coil)
            vertices.push(...pTR);
            // const pTL = pointXYZ(tape, i, fiShift, thi, 0, pT0)
            const pTL = mirrorXYZ(pTR, pT1)
            vertices.push(...pTL);

            indLine .push(j * 2 - 2); indLine .push(j * 2 + 0);
            indLine .push(j * 2 - 1); indLine .push(j * 2 + 1);

            indPlain.push(j * 2 - 2); indPlain.push(j * 2 - 1); indPlain.push(j * 2 + 0);
            indPlain.push(j * 2 - 1); indPlain.push(j * 2 + 1); indPlain.push(j * 2 + 0);
        };

        fiShift += coil.fi[n - 1];
    };

    return [vertices, indLine, indPlain];
}


// Equidestanta

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

function Equdestanta(param) {
    loading();

    const coilCorrected = coilGet("Corrected");
    if (!coilCorrected) return

    lambdaCall("equidistantaRolley", [coilCorrected, fieldGet('safetyR'), fieldGet('band')])
        .then(res => {
            fieldSet("equidistanta", res[0]);
            fieldSet("rolley", res[1]);
            
            coilSet("Interpolated", undefined);

            loaded();

            if (param == "+Interpolanta") {
                Interpolanta();
            } else {
                animateInit();
            }
        })
        .catch(error => {
            showError(error);
        });
};
window.Equdestanta = Equdestanta

function Interpolanta(param = undefined){
    loading();

    const coilCorrected = coilGet("Corrected");
    const eqd = fieldGet("equidistanta");
    if (!coilCorrected || !eqd){
        showError("no data")
        return
    }

    lambdaCall("interpolantaRolley", [coilCorrected, eqd, fieldGet('lineCount'), fieldGet('band')])
        .then(res => {
            coilSet ("Interpolated"            , res[0]);
            fieldSet("tapeInterpolated"        , res[1]);
            fieldSet("equidistantaInterpolated", res[2]);
            fieldSet("rolleyInterpolated"      , res[3]);

            animateInit();

            loaded();
        })
        .catch(error => {
            showError(error);
        });
};
window.Interpolanta = Interpolanta


// Patterns

// document.getElementById('patternsCalc').addEventListener(
//     'click', () => { patternsCalc();}
// );

function patternsCalc() {
    loading();

    const coil = coilGet("Initial");

    lambdaCall("fibbo", [coil, fieldGet("band"), fieldGet("conv")])
        .then((res) => {
            fieldSet("patterns", res);
            fibboRenderTable();
            loaded();
        })
        .catch(error => {
            showError(error);
        });
}


// Correct coils

function coilSet(suffix, coil) {
    fieldSet("coil" + suffix, coil)
    if (suffix == "Initial") {
        coilSet("Corrected", undefined);
    }
}

function coilGet(suffix) {
    let coil = fieldGet("coil" + suffix);

    if (!coil) return undefined;
    
    if (suffix == "Corrected") {
        const coilInitial = fieldGet("coilInitial");
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

    const coil = coilGet("Initial");
    const { Turns, Coils } = fibboGetSelectedValues();

    lambdaCall("conte", [coil, Turns, Coils])
        .then(res => {
            coilSet("Corrected", {
                fi: res[0],
                al: res[1],
            });

            // function coilCorrectedDraw() {
            //     removeMesh(window.correctedCoilMesh);
            //     window.correctedCoilMesh = addLine(coilRender(coilGet("Corrected")));
            // }
            // coilCorrectedDraw();

            loaded();

            tapeCalc("Corrected");
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
    const itpEqd = fieldGet("equidistantaInterpolated");
    if (!itpEqd) {
        showError("No interpolated equidistanta yet");
        return;
    }

    // Проверяем поддержку API
    if (!window.showSaveFilePicker) {
        showError("File System Access API is not supported by your browser.");
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
    animateInit();
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
    fieldSet("coilInitial", loadFromYaml(event.target.result));
    tapeCalc("Corrected");
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
    fieldAllSet(loadFromYaml(await response.text()));
}

function vesselloadFromURL(name) {
    vesselClear();
    clearScene();

    loadFromYamlURL('./examples/' + name + '.yaml').then(() => {
        SetPole();
        drawAll();
    })
};


// Clear
function vesselClear() {
    fieldAllClear();
    inputFieldInit();
    clearScene();
    drawAll();
}
window.vesselClear = vesselClear


function vesselOnLoad() {
    fieldAllUpdateFromStorage();
    if (!vessel.mandrelRaw) {
        vesselloadFromURL("Example1");
    } else {
        drawAll();
    }
    SetPole();
}
window.vesselOnLoad = vesselOnLoad
