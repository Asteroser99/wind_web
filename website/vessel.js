// layers

async function layerAddOnClick(){
    clearScene();

    let curLayerId = await layerAdd();
    await layerIdSet(curLayerId)
    await fieldAllGet()
    await inputFieldInit()
    // await inputFieldSet("layer", "LayerName", "Layer Name") // ???

    await layersRenderTable()
    await layersSelectRow(curLayerId)
    await allDraw()
};
window.layerAddOnClick = layerAddOnClick;


async function layersRenderTable() {
    const layers = await storageGet("layers") || []

    const tableBody = document.querySelector("#layers-table tbody");

    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }    

    let names = await storageAllGetField("LayerName")

    layers.forEach((item, index) => {
        const row = document.createElement("tr");
        
        let name = names[item]

        row.innerHTML = `
            <td style="display:none">${item}</td>
            <td>${name}</td>
             <td>
                <div style="display:inline-block; vertical-align:middle; text-align:center; line-height:0">
                    <button class="btn-up image-button very-small-half" title="Move up"><img src="./img/up.png"></button><br>
                    <button class="btn-down image-button very-small-half" title="Move down"><img src="./img/down.png"></button>
                </div>
                <button class="btn-delete image-button very-small" title="Remove layer"><img src="./img/minus.png"></button>
            </td>
        `;
        row.onclick = async () => {
            clearScene();

            await layersSelectRow(item);
            await fieldAllGet();
            await allDraw()
        };
        row.dataset.index = item;
        row.classList.add("clickable-row");

        tableBody.appendChild(row);

        // const btnAdd = row.querySelector(".btn-add");
        // btnAdd.onclick = async (event) => {
        //     event.stopPropagation();

        //     clearScene();

        //     let curLayerId = await layerAdd(item);
        //     await layersRenderTable()
        //     await layersSelectRow(curLayerId)
        //     await fieldAllGet();
        //     await allDraw()
        // };

        let btn
        btn = row.querySelector(".btn-up");
        btn.onclick = async (event) => {
            event.stopPropagation();

            const layers = await storageGet("layers")

            const i = layers.indexOf(item);
            if (i > 0)
                [layers[i - 1], layers[i]] = [layers[i], layers[i - 1]];
            await storageSet("layers", layers)
    
            await layersRenderTable()
        };

        btn = row.querySelector(".btn-down");
        btn.onclick = async (event) => {
            event.stopPropagation();

            const layers = await storageGet("layers")

            const i = layers.indexOf(item);
            if (i >= 0 && i < layers.length - 1)
                [layers[i], layers[i + 1]] = [layers[i + 1], layers[i]];
            await storageSet("layers", layers)

            await layersRenderTable()
        };

        btn = row.querySelector(".btn-delete");
        btn.onclick = async (event) => {
            event.stopPropagation();

            const curLayer = await layerIdGet()
            const itemLayer = await layerDelete(item);
            await layersRenderTable()
            if(curLayer == item){

                clearScene();

                await layersSelectRow(itemLayer)
                await fieldAllGet();
                await allDraw()
            }
        };

    });

    await layersSelectRow(await layerIdGet())
}
window.layersRenderTable = layersRenderTable;

async function layersSelectRow(index) {
    const tableBody = document.querySelector("#layers-table tbody");

    const selected = tableBody.querySelector(".selected");
    if (selected) {
        selected.classList.remove("selected");
    }

    await layerIdSet(index);

    const row = tableBody.querySelector(`tr[data-index='${index}']`);
    if (row){
        row.classList.add("selected");
    }
}
window.layersSelectRow = layersSelectRow;


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
async function vesselLoadOnFileLoad(event) {
    await fieldAllSet(loadFromYaml(event.target.result));
    await allDraw()
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

async function lambdaCall(name, param) {
    let path = 'https://z2qmzcusx7.execute-api.eu-central-1.amazonaws.com/prod/';

    const origin = window.location.origin;
    if(origin == "http://127.0.0.1:5500"){ // local web server
        path = 'http://127.0.0.1:5000/';   // local flask server
    }

    const cognitoAccessToken = await storageGet('cognitoAccessToken');
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
    reader.onload = async function(event) {
        const colNumEl = document.getElementById('csvColumn');
        if(colNumEl.value == "") colNumEl.value = 1
        await mandrelImportCSVOnFileLoad(prefix, event.target.result, colNumEl.value - 1);
    };
    reader.readAsText(file);
}
window.mandrelImportCSV = mandrelImportCSV;

async function mandrelImportCSVOnFileLoad(prefix, text, colNum) {
    let mandrel
    try {
        if (prefix == "Raw")
            await vesselClear();

        mandrel = mandrelFromCSV(text, colNum);
        await mandrelSet(prefix, mandrel)
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
        const [v0, v1] = [line[colNum * 2 + 0], line[colNum * 2 + 1]]
        if (v0.trim() == "" && v1.trim() == "") continue;
        k[0].push(parseFloat(v0.trim()));
        k[1].push(parseFloat(v1.trim()));
    }

    return { x, r }
}


// Export CSV

async function saveFile(fun, par, suggestedName, type = "text/plain") {
    try {
        if (window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({
                suggestedName,
                types: [
                    {
                        description: `${type} file`,
                        accept: { [type]: [`.${suggestedName.split('.').pop()}`] }
                    }
                ]
            });

            const data = await fun(par);

            const writable = await handle.createWritable();
            await writable.write(data);
            await writable.close();

        } else { // Fallback: trigger file download
            const blob = new Blob([data], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = suggestedName;
            a.click();

            URL.revokeObjectURL(url);
        }

    } catch (error) {
        showError(error);
    }
}

async function saveCsvWithDialog(name) {
    const mandrel = await fieldGet("mandrel" + name);
    if (!mandrel) {
        showError("No mandrel data to save");
        return;
    }
    const filename = await fieldGet("PartNumber") + "_" + await fieldGet("LayerNumber") + "_" + name + ".csv";
    await saveFile(convertArrayToCsv, mandrel, filename, "text/csv");
}
window.saveCsvWithDialog = saveCsvWithDialog;

function convertArrayToCsv(data) {
    const keys = Object.keys(data); // headers (x, r)
    const rows = [];

    // CSV lines
    for (let i = 0; i < data[keys[0]].length; i++) {
        rows.push(keys.map(key => data[key][i]).join(","));
    }

    return keys.join(",") + "\n" + rows.join("\n");
}


// mandrel

async function mandrelGet(name){
    return await fieldGet("mandrel" + name);
}
window.mandrelGet = mandrelGet

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

async function mandrelTreeUpdate(name) {
    removeMesh(window["mandrel" + name + "Mesh"]);
  
    const mandrel = await mandrelGet(name);

    if (mandrel){
        const render = generatrixRender(mandrel, 90)
    
        let color;
        let transpatent;
        let setScale = false;
        if        (name == "Raw"){
            color = 0x2973B2;
            transpatent = 1.;
            setScale = true;
        } else if (name == "Wound"){
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
  
async function SetPole() {
    const mandrel = await mandrelGet("Raw")
    if (!mandrel) return;
    const {x, r} = mandrel
    if (r.length > 0)
        await inputFieldValue('poleR', r[0]);
}

async function mandrelSet(name, xOrMandrel, r = null){
    let mandrel = xOrMandrel;
    if (r) mandrel = { x: xOrMandrel, r: r };
    await fieldSet("mandrel" + name, mandrel);
    if (name == "Raw") SetPole();
    mandrelDraw(name);
}

function mandrelDraw(name) {
    mandrelTreeUpdate (name);
    mandrelChartUpdate(name);
}

function mandrelsDraw() {
    mandrelDraw("Raw")
    mandrelDraw("Wound")
    mandrelDraw("Smoothed")
}

async function mandrelClear(name) {
    await mandrelSet(name, undefined);
}
window.mandrelClear = mandrelClear;


// mandrel transformation


async function mandrelShiftX(){
    const mandrel = await mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    x = x.map(value => value + inputValue("shift"));
    await mandrelSet("Raw", x, r);
}
window.mandrelShiftX = mandrelShiftX;

async function mandrelShiftR(){
    const mandrel = await mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    r = r.map(value => value + inputValue("shift"));
    await mandrelSet("Raw", x, r);
}
window.mandrelShiftR = mandrelShiftR;

async function mandrelMultiplyX(){
    const mandrel = await mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    x = x.map(value => value * inputValue("koeff"));
    await mandrelSet("Raw", x, r);
}
window.mandrelMultiplyX = mandrelMultiplyX;

async function mandrelMultiplyR(){
    const mandrel = await mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    r = r.map(value => value * inputValue("koeff"));
    await mandrelSet("Raw", x, r);
}
window.mandrelMultiplyR = mandrelMultiplyR;

async function mandrelReverse(){
    const mandrel = await mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    x = x.map(value => -value);
    await mandrelSet("Raw", x, r);
}
window.mandrelReverse = mandrelReverse;

async function mandrelSwap(){
    const mandrel = await mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    await mandrelSet("Raw", r, x)
};
window.mandrelSwap = mandrelSwap;

async function mandrelRedirect(){
    const mandrel = await mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    await mandrelSet("Raw", x.reverse(), r.reverse())
}
window.mandrelRedirect = mandrelRedirect;

async function mandrelMirror(){
    const mandrel = await mandrelGet("Raw");
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

    await mandrelSet("Raw", x, r);
}
window.mandrelMirror = mandrelMirror;


// Thickness

document.getElementById('thicknessGet').addEventListener(
    'click', async () => {
        loading();

        const coilCorrected = await coilGet("Corrected")
        const coilMeridian = await fieldGet("coilMeridian");

        if (!coilCorrected || !coilMeridian) {
            showError("No data");
            return;
        }

        return lambdaCall("thickness.thickness", [coilCorrected, coilMeridian, await fieldGet('band')])
            .then(async (res) => {
                await mandrelSet("Wound", res);
                loaded();
            })
            .catch(error => {
                showError(error);
            });
    }
);


// Smooth

document.getElementById('mandrelSmooth').addEventListener(
    'click', async () => {
        loading();

        const mandrel = await mandrelGet("Wound");
        if (!mandrel) {
            showError("No wound mandrel");
            return;
        }

        return lambdaCall("smooth_full", [mandrel])
            .then(async (res) => {
                await mandrelSet("Smoothed", res);
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

async function coilCalc() {
    loading();

    const mandrel = await mandrelGet("Raw");
    if (!mandrel) return null;

    try {
        return lambdaCall("vitok.vitok", [mandrel, await fieldGet("poleR"), await fieldGet("band")])
            .then(async (res) => {
                const [coil, meridian] = res
                coilSet("Initial", coil);
                await fieldSet("coilMeridian", meridian);

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

async function coilRender(suffix) {
    const coil = await coilGet(suffix)
    if (!coil) return undefined;

    const n = coil.x.length

    const mode = suffix == "Initial" ? "first" : await storageGet("windingMode");
    let Coils = 1
    if (mode == "first"){
        Coils = 1
    } else if (mode == "round") {
        Coils = await fieldGet("conv") + 1
    } else if (mode == "all") {
        const fibboGetSelected = await fibboGetSelectedValues();
        Coils = fibboGetSelected["Coils"]
    }

    const vertices = [];
    const indices  = [];


    let i = 0, j = 0;
    vertices.push(...pointXYZ(coil, i));
    j++;

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

async function tapeCalc(prefix) {
    const coil = await coilGet(prefix)
    if (coil) {
        loading();
        lambdaCall("calc.tape", [coil, await fieldGet("band")])
            .then(async res => {
                await fieldSet("tape" + prefix, res);
                await tapeDraws();
                loaded();
            })
            .catch(error => {
                showError(error);
            });
    } else {
        await fieldSet("tape" + prefix, undefined);
        await tapeDraws();
    }
}

function tapeRemove(suffix) {
    removeMesh(window["coil" + suffix + "Line"]);
    removeMesh(window["tape" + suffix + "Line"]);
    removeMesh(window["tape" + suffix + "Mesh"]);
}

async function tapeDraw(suffix) {
    let render = await coilRender(suffix);
    if(render){
        window["coil" + suffix + "Line"] = addLine(render);
    }

    render = await tapeRender(suffix);
    if (render){
        const colorLine = 0xd38629
        window["tape" + suffix + "Line"] = addLine([render[0], render[1]], colorLine);
    
        const colorMesh = suffix == "Initial" ? 0xff5500 : (suffix == "Corrected" ? 0xfea02a : 0xffff00)
        window["tape" + suffix + "Mesh"] = addMesh([render[0], render[2]], colorMesh);
    }
}

async function tapeDraws() {
    tapeRemove("Initial");
    tapeRemove("Corrected");
    tapeRemove("Interpolated");

    if (await coilGet("Interpolated")){
        await tapeDraw("Interpolated");
    } else if (await coilGet("Corrected")){
        await tapeDraw("Corrected");
    } else {
        await tapeDraw("Initial");
    }
}
window.tapeDraws = tapeDraws

async function tapeRender(suffix) {
    const coil = await coilGet(suffix);
    if (!coil) return undefined

    const tape = await fieldGet("tape" + suffix);
    if (!tape) return undefined;

    const mode = suffix == "Initial" ? "first" : await storageGet("windingMode");
    const n = coil.x.length;
    
    const vertices = [];
    const indLine  = [];
    const indPlain = [];

    let Coils = 1
    if (mode == "first"){
        Coils = 1
    } else if (mode == "round") {
        Coils = await fieldGet("conv") + 1
    } else if (mode == "all") {
        const fibboGetSelected = await fibboGetSelectedValues();
        Coils = fibboGetSelected["Coils"]
    }

    const th0 = window.tapeThicknessFirst, th = window.tapeThickness;
    const thd = th / n;

    let i = 0, j = 0;
    const pT0 = pointXYZ(coil, i, 0, th0, coil)
    const pTR = pointXYZ(tape, i, 0, th0, coil)
    vertices.push(...pTR);
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
async function Winding(param = undefined){
    loading();

    const coilCorrected = await coilGet("Corrected");
    if (!coilCorrected){
        showError("No coil data")
        return
    }

    lambdaCall("calc.winding", [coilCorrected, await fieldGet('safetyR'), await fieldGet('lineCount'), await fieldGet('band')])
        .then(async res => {
            coilSet ("Interpolated"            , res[0]);
            await fieldSet("equidistantaInterpolated", res[1]);
            await fieldSet("rolleyInterpolated"      , res[2]);

            await tapeDraws();
            await animateInit();

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
    'change', function (event) { patternsCalc() }
);

async function patternsCalc() {
    loading();
    lambdaCall("fibbo", [await coilGet("Initial"), await fieldGet("band"), await fieldGet("conv"), await fieldGet("netStructure")])
        .then(async (patterns) => {
            await fieldSet("patterns", patterns);
            await fibboRenderTable();

            const minIndex = patterns.reduce((minIdx, entry, idx, arr) => 
                Math.abs(entry.Correction) < Math.abs(arr[minIdx].Correction) ? idx : minIdx
            , 0);
            await fibboSelectRow(minIndex);

            loaded();
        })
        .catch(error => {
            showError(error);
        });
}


// Correct coils

async function coilSet(suffix, coil) {
    await fieldSet("coil" + suffix, coil)

    if (suffix == "Initial") {
        await coilSet("Corrected", undefined);
    } else if (suffix == "Corrected") {
        await coilSet("Interpolated", undefined);
    }

    await tapeCalc(suffix);
}

async function coilGet(suffix) {
    let coil = await fieldGet("coil" + suffix);

    if (!coil) return undefined;
    
    if (suffix == "Corrected") {
        const coilInitial = await fieldGet("coilInitial");
        coil = {
            x : coilInitial["x" ],
            r : coilInitial["r" ],
            fi: coil["fi"],
            al: coil["al"],
        };
    };

    return coil;
}
window.coilGet = await coilGet


document.getElementById('coilCorrect').addEventListener('click', async () => {
    loading();

    const coil = await coilGet("Initial");
    const { Turns, Coils } = await fibboGetSelectedValues();

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

async function CNCGet(itpEqd) {
    return await lambdaCall("CNC", [itpEqd]);
}

async function CNCExport() {
    loading();
    const itpEqd = await fieldGet("equidistantaInterpolated");
    if (!itpEqd) {
        showError("No interpolated equidistanta yet");
        loaded();
        return;
    }

    const txt = await lambdaCall("CNC", [itpEqd]);
    const filename = await fieldGet("PartNumber") + "_" + await fieldGet("LayerNumber") + "_CNC.txt";
    await saveFile(CNCGet, itpEqd, filename, "text/plain");
    loaded();
}
window.CNCExport = CNCExport


// ALL

async function allClear() {
    await vesselClear();
    clearScene();
}

async function allDraw() {
    scaleSet()

    await layersRenderTable()

    await inputFieldInit()
    await modeButtonInit()
    await SetPole()

    mandrelsDraw()

    await tapeDraws()
    await animateInit()
}


// vesselSave
function convertToYaml(data){
    return jsyaml.dump(data)
}


async function vesselPrint(){
    console.log("theVessel:", theVessel);
    console.log("theLayer:", theLayer);
}
window.vesselPrint = vesselPrint;

async function vesselSave(){
    const filename = await fieldGet("PartNumber") + "_" + await fieldGet("LayerNumber") + ".yaml";
    await saveFile(convertToYaml, theLayer, filename, "application/x-yaml");
}
window.vesselSave = vesselSave;


// vesselLoad

function coilLoadOnClick(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = coilLoadOnFileLoad;

    reader.readAsText(file);
};
async function coilLoadOnFileLoad(event) {
    await fieldSet("coilInitial", loadFromYaml(event.target.result));
    await tapeCalc("Corrected");
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

    await fieldAllSet(
        loadFromYaml(await response.text())
    );
}
async function vesselloadFromURL(name) {
    loading();

    await layerAddIfNotExist()
    await allClear()

    loadFromYamlURL('./examples/' + name + '.yaml').then(async () => {
        loaded();

        await allDraw();

        await layersRenderTable();
    })
};
window.vesselloadFromURL = vesselloadFromURL


// Clear
async function vesselClear() {
    await fieldAllClear();
    clearScene();

    allDraw();
}
window.vesselClear = vesselClear

async function vesselActualise() {
    const layers = await storageGet("layers")
    if (!layers) {
        toggleHelp(true);

        await vesselloadFromURL("engine");

        document.getElementById('toggle-button-mandrel').click();
        document.getElementById('toggle-button-equidistanta').click();
    } else {
        await allDraw();
    }
}
window.vesselActualise = vesselActualise

async function vesselOnLoad() {
    window.tapeThickness = 0.05
    window.tapeThicknessFirst = window.tapeThickness * 5
}
window.vesselOnLoad = vesselOnLoad
