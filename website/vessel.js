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

    localStorage.clear();
    vessel = {};
};

const fieldAllSet = async (newVessel) => {
    fieldAllClear();

    vessel = newVessel;

    const promises = Object.entries(newVessel).map(([key, value]) =>
        fieldAsyncStorageSet(key, value)
    );
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

    const cognitoAccessToken = localGet('cognitoAccessToken');
    const headers = {
        headers: {
            auth: `Bearer ${cognitoAccessToken}`,
            'Content-Type': 'application/json',
        },
    }

    return axios.post(
        path + name,
        JSON.stringify(param),
        headers
    )
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            showError(error);
            throw new Error("Lambda call failed");
        });
}
window.lambdaCall = lambdaCall;


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


function mandrelShiftX(){
    const mandrel = mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    x = x.map(value => value + inputValue("shift"));
    mandrelSet("Raw", x, r);
}
window.mandrelShiftX = mandrelShiftX;

function mandrelShiftR(){
    const mandrel = mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    r = r.map(value => value + inputValue("shift"));
    mandrelSet("Raw", x, r);
}
window.mandrelShiftR = mandrelShiftR;

function mandrelMultiplyX(){
    const mandrel = mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    x = x.map(value => value * inputValue("koeff"));
    mandrelSet("Raw", x, r);
}
window.mandrelMultiplyX = mandrelMultiplyX;

function mandrelMultiplyR(){
    const mandrel = mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    r = r.map(value => value * inputValue("koeff"));
    mandrelSet("Raw", x, r);
}
window.mandrelMultiplyR = mandrelMultiplyR;

function mandrelReverse(){
    const mandrel = mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    x = x.map(value => -value);
    mandrelSet("Raw", x, r);
}
window.mandrelReverse = mandrelReverse;

function mandrelSwap(){
    const mandrel = mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    mandrelSet("Raw", r, x)
};
window.mandrelSwap = mandrelSwap;

function mandrelRedirect(){
    const mandrel = mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    mandrelSet("Raw", x.reverse(), r.reverse())
}
window.mandrelRedirect = mandrelRedirect;

function mandrelMirror(){
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
window.mandrelMirror = mandrelMirror;


// Thickness

document.getElementById('thicknessGet').addEventListener(
    'click', () => {
        loading();

        const coilCorrected = coilGet("Corrected")
        const coilMeridian = fieldGet("coilMeridian");

        if (!coilCorrected || !coilMeridian) {
            showError("No data");
            return;
        }

        return lambdaCall("thickness.thickness", [coilCorrected, coilMeridian, fieldGet('band')])
            .then((res) => {
                mandrelSet("Winded", res);
                loaded();
            })
            .catch(error => {
                showError(error);
            });
    }
);


// Smooth

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
        return lambdaCall("vitok.vitok", [mandrel, fieldGet("poleR"), fieldGet("band")])
            .then(res => {
                const [coil, meridian] = res
                coilSet("Initial", coil);
                fieldSet("coilMeridian", meridian);

                loaded();

                patternsCalc();
            })
            .catch(error => {
                showError(error);
            });
    } catch (error) {
        showError(error);
    }
}

function coilRender(suffix) {
    const coil = coilGet(suffix)
    if (!coil) return undefined;

    const n = coil.x.length

    const mode = suffix == "Initial" ? "first" : fieldGet("windingMode");
    let Coils = 1
    if (mode == "first"){
        Coils = 1
    } else if (mode == "round") {
        Coils = fieldGet("conv") + 1
    } else if (mode == "all") {
        const fibboGetSelected = fibboGetSelectedValues();
        Coils = fibboGetSelected["Coils"]
    }

    const vertices = [];
    const indices  = [];


    let i = 0, j = 0;
    vertices.push(...pointXYZ(coil, i));
    j++;

    // for (let i = 0; i < n; i++) {
    for (let round = 0, fiShift = 0; round < Coils; round++) {

        for (i = 1; i < n; i++, j++) {

            vertices.push(...pointXYZ(coil, i, fiShift));

            indices.push(j - 1, j);

        }
        fiShift += coil.fi[n - 1];
    }

    return [vertices, indices];
}


// Tape

function tapeCalc(prefix) {
    const coil = coilGet(prefix)
    if (coil) {
        loading();
        lambdaCall("calc.tape", [coil, fieldGet("band")])
            .then(res => {
                fieldSet("tape" + prefix, res);
                coilDraws();
                loaded();
            })
            .catch(error => {
                showError(error);
            });
    } else {
        fieldSet("tape" + prefix, undefined);
        coilDraws();
    }
}

function tapeRemove(suffix) {
    removeMesh(window["coil" + suffix + "Line"]);
    removeMesh(window["tape" + suffix + "Line"]);
    removeMesh(window["tape" + suffix + "Mesh"]);
}

function coilDraw(suffix) {
    let render = coilRender(suffix);
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

    animateInit();
}
window.coilDraws = coilDraws

function tapeRender(suffix) {
    const coil = coilGet(suffix);
    if (!coil) return undefined

    const tape = fieldGet("tape" + suffix);
    if (!tape) return undefined;

    const mode = suffix == "Initial" ? "first" : fieldGet("windingMode");
    const n = coil.x.length;
    
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

    const th0 = window.tapeThicknessFirst, th = window.tapeThickness;
    const thd = th / n;

    let i = 0, j = 0;
    const pT0 = pointXYZ(coil, i, 0, th0, coil)
    const pTR = pointXYZ(tape, i, 0, th0, coil)
    vertices.push(...pTR);
    // const pTL = pointXYZ(tape, i, 0, 0, 0, pT0)
    const pTL = mirrorXYZ(pTR, pT0)
    vertices.push(...pTL);
    j++;
    for (let round = 0, fiShift = 0, thi = th0; round < Coils; round++) {
        for (i = 1; i < n; i++, j++, thi += thd) {
            const pT0 = pointXYZ(coil, i, fiShift, thi, coil)

            const pTR = pointXYZ(tape, i, fiShift, thi, coil)
            vertices.push(...pTR);

            const pTL = mirrorXYZ(pTR, pT0)
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


// Winding
function Winding(param = undefined){
    loading();

    const coilCorrected = coilGet("Corrected");
    if (!coilCorrected){
        showError("No coil data")
        return
    }

    lambdaCall("calc.winding", [coilCorrected, fieldGet('safetyR'), fieldGet('lineCount'), fieldGet('band')])
        .then(res => {
            coilSet ("Interpolated"            , res[0]);
            // fieldSet("tapeInterpolated"        , res[1]);
            fieldSet("equidistantaInterpolated", res[1]);
            fieldSet("rolleyInterpolated"      , res[2]);

            // drawAll();
            coilDraws();
            animateInit();

            loaded();
        })
        .catch(error => {
            showError(error);
        });
}
window.Winding = Winding


// Patterns

document.getElementById('conv').addEventListener(
    'change', function (event) { patternsCalc() }
);

document.getElementById('netStructure').addEventListener(
    'click', function (event) { patternsCalc() }
);

function patternsCalc() {
    loading();

    const coil = coilGet("Initial");

    lambdaCall("fibbo", [coil, fieldGet("band"), fieldGet("conv"), fieldGet("netStructure")])
        .then((patterns) => {
            fieldSet("patterns", patterns);
            fibboRenderTable();

            const minIndex = patterns.reduce((minIdx, entry, idx, arr) => 
                Math.abs(entry.Correction) < Math.abs(arr[minIdx].Correction) ? idx : minIdx
            , 0);
            fibboSelectRow(minIndex);

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
    } else if (suffix == "Corrected") {
        coilSet("Interpolated", undefined);
    }

    tapeCalc(suffix);
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
            loaded();
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
    loading();
    vesselClear();
    clearScene();

    loadFromYamlURL('./examples/' + name + '.yaml').then(() => {
        SetPole();
        drawAll();
        loaded();
    })
};
window.vesselloadFromURL = vesselloadFromURL


// Clear
function vesselClear() {
    fieldAllClear();
    inputFieldInit();
    clearScene();
    drawAll();
}
window.vesselClear = vesselClear

function vesselOnLoad() {
    window.tapeThickness = 0.05
    window.tapeThicknessFirst = window.tapeThickness * 5

    fieldAllUpdateFromStorage();
    if (!vessel.mandrelRaw) {
        toggleHelp(true);
        vesselloadFromURL("V2_Engine");
        document.getElementById('toggle-button-equidistanta').click();
    } else {
        drawAll();
    }
    SetPole();
}
window.vesselOnLoad = vesselOnLoad
