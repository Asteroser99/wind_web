function yamlToData(yamlString){
    let data = null;
    try {
        data = jsyaml.load(yamlString);
    } catch (error) {
        showError(error);
    }
    return data;
};

function dataToYaml(data){
    return jsyaml.dump(data)
}


// geometry

function getBetaI(x, r, i){
  let j = i;

  if (i == 0           ) j = i + 1;
  if (i == x.length - 1) j = i - 1;

  let beta = Math.atan((r[j] - r[j-1]) / (x[j] - x[j-1]));

  if (Math.abs(beta) < 0.001) beta = 0.0;

  return beta;
}

function pointXYZ(coil, i, fiShift = 0, th = 0., center = undefined){
  let sbth = 0., cbth = 0.;

  if (th != 0.) {
      const bi = getBetaI(center["x"], center["r"], i);
      sbth = th * Math.sin(bi);
      cbth = th * Math.cos(bi);
  };

  let x  = coil.x [i];
  let r  = coil.r [i];
  let fi = coil.fi[i];

  fi += fiShift;

  let cXi = (x - sbth);
  let cYi = (r + cbth) * Math.sin(fi); // + yShift
  let cZi = (r + cbth) * Math.cos(fi);

  return [cXi, cYi, cZi];
}
window.pointXYZ = pointXYZ;

function mirrorXYZ(pTR, mirror){
  const cXi = mirror[0] * 2 - pTR[0];
  const cYi = mirror[1] * 2 - pTR[1];
  const cZi = mirror[2] * 2 - pTR[2];
  return [cXi, cYi, cZi];
}
window.mirrorXYZ = mirrorXYZ


// layers-table

async function layerAddOnClick(){
    await layerAddNew()
    await allShow()
};
window.layerAddOnClick = layerAddOnClick;

async function layersRenderTable() {
    const layers = await vesselPropGet("layers") || []

    const tableBody = document.querySelector("#layers-table tbody");

    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }    

    let names = await vesselPropAllGetProp("LayerName")

    layers.forEach((item, index) => {
        const row = document.createElement("tr");
        
        let name = names[item]

        row.innerHTML = `
            <td style="display:none">${item}</td>
            <td>${name}</td>
            <td style="width:35px">
                <div style="display:inline-block; vertical-align:middle; text-align:center; line-height:0">
                    <button class="btn-up   image-button very-small-half" title="Move up"><img src="./img/up.png"></button><br>
                    <button class="btn-down image-button very-small-half" title="Move down"><img src="./img/down.png"></button>
                </div>
                <div style="display:inline-block; vertical-align:middle; text-align:center; line-height:0">
                    <button class="btn-delete image-button very-small" title="Remove layer"><img src="./img/minus.png"></button>
                </div>
            </td>
        `;
        row.onclick = async () => {
            loading();

            await layerIdSet(item);
            await layerPropAllGet();

            await allShow()

            loaded();
        };
        row.dataset.index = item;
        row.classList.add("clickable-row");

        tableBody.appendChild(row);

        let btn
        btn = row.querySelector(".btn-up");
        btn.onclick = async (event) => {
            event.stopPropagation();

            const layers = await vesselPropGet("layers")

            const i = layers.indexOf(item);
            if (i > 0)
                [layers[i - 1], layers[i]] = [layers[i], layers[i - 1]];
            await vesselPropSet("layers", layers)
    
            await layersRenderTable()
        };

        btn = row.querySelector(".btn-down");
        btn.onclick = async (event) => {
            event.stopPropagation();

            const layers = await vesselPropGet("layers")

            const i = layers.indexOf(item);
            if (i >= 0 && i < layers.length - 1)
                [layers[i], layers[i + 1]] = [layers[i + 1], layers[i]];
            await vesselPropSet("layers", layers)

            await layersRenderTable()
        };

        btn = row.querySelector(".btn-delete");
        btn.onclick = async (event) => {
            event.stopPropagation();

            const curLayer = await layerIdGet()
            const layerToSelect = await layerDelete(item);
            if(curLayer == item){
                await layerIdSet(layerToSelect)
                await layerPropAllGet();
                await allShow()
            } else {
                await layersRenderTable()
            }
        };

    });

    await layersSelectRow(await layerIdGet())
}
window.layersRenderTable = layersRenderTable;

async function layersSelectRow(layerId) {
    const tableBody = document.querySelector("#layers-table tbody");

    const selected = tableBody.querySelector(".selected");
    if (selected) {
        selected.classList.remove("selected");
    }

    const row = tableBody.querySelector(`tr[data-index='${layerId}']`);
    if (row){
        row.classList.add("selected");
    }
}
window.layersSelectRow = layersSelectRow;


// machines-table

async function machinesRenderTable() {
    const tableBody = document.querySelector("#machines-table tbody");

    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }

    const machines = [
        ["RPN", "3-axis"],
        ["WE" , "4-axis"]
    ];

    machines.forEach(([item, name], index) => {
        const row = document.createElement("tr");
        
        row.innerHTML = `
            <td style="display:none">${item}</td>
            <td>${name}</td>
        `;
        row.onclick = async () => {
            await layerPropSet("machine", item)
            await machinesRenderTable()
        };
        row.dataset.index = item;
        row.classList.add("clickable-row");

        tableBody.appendChild(row);
    });

    await machinesSelectRow(await layerPropGet("machine"))
}
window.machinesRenderTable = machinesRenderTable;

async function machinesSelectRow(machineId) {
    const tableBody = document.querySelector("#machines-table tbody");

    const selected = tableBody.querySelector(".selected");
    if (selected) {
        selected.classList.remove("selected");
    }

    const row = tableBody.querySelector(`tr[data-index='${machineId}']`);
    if (row){
        row.classList.add("selected");
    }
}
window.machinesSelectRow = machinesSelectRow;


/// vessel

// vesselSave
async function vesselSave(){
    loading()
    const filename = await vesselPropGet("PartNumber") + ".yaml";
    // const vessel = theVessel.clone()
    const vessel = structuredClone(theVessel);
    const layers = {};
    if(vessel.layers)
        for (const layerId of vessel.layers) {
            const layer = await layerPropAllRead(layerId)
            layers[layerId] = layer;
        }
    vessel.layers = layers
    await saveFile(dataToYaml, vessel, filename, "application/x-yaml");
}
window.vesselSave = vesselSave;

// vesselLoad
function vesselLoad(){
    fileOpen(".yaml", vesselLoadOnFileOpen, 0)
}
window.vesselLoad = vesselLoad;

function vesselLoadOnFileOpen(file, par) {
    fileRead(file, vesselLoadOnFileRead, par)
};
window.vesselLoadOnFileOpen = vesselLoadOnFileOpen;

async function vesselLoadOnFileRead(text, par = null) {
    const vessel = yamlToData(text)
    if(!vessel?.PartNumber){
        showError("The file does not appear to be a session file.")
        loaded();
        return;
    }


    await layersAllClear();
    const layers = []
    for (const [layerId, layer] of Object.entries(vessel.layers)) {
        layers.push(layerId);
        await layerPropAllSet(layer, layerId);
    }
    vessel.layers = layers
    await vesselPropAllSet(vessel)

    await allShow()

    loaded();
};
window.vesselLoadOnFileRead = vesselLoadOnFileRead;

// vesselClear
async function vesselClear() {
    if (theVessel.layers)
        for (const layerId of theVessel.layers) {
            await layerPropAllClear(layerId);
        }

    await vesselPropAllClear();

    await allShow();
}
window.vesselClear = vesselClear


/// layer

// layerSave
async function layerSave(){
    loading();
    const filename = await vesselPropGet("PartNumber") + " layer " + await layerPropGet("LayerNumber") + " " + await layerPropGet("LayerName") + ".yaml";
    await saveFile(dataToYaml, theLayer, filename, "application/x-yaml");
}
window.layerSave = layerSave;

// layerLoad
function layerLoad(event) {
    fileOpen(".yaml", layerLoadOnFileOpen)
}
window.layerLoad = layerLoad;

function layerLoadOnFileOpen(file, par) {
    fileRead(file, layerLoadOnFileLoad)
};
window.layerLoadOnFileOpen = layerLoadOnFileOpen;

async function layerLoadOnFileLoad(text, par) {
    await layerPropAllSet(yamlToData(text));
    await allShow()
    loaded()
};
window.layerLoadOnFileLoad = layerLoadOnFileLoad;

// layerClear
async function layerClear() {
    await layerPropAllClear();
    await allShow();
}
window.layerClear = layerClear


// lambdaCall

async function lambdaCall(name, param) {
    let path = 'https://z2qmzcusx7.execute-api.eu-central-1.amazonaws.com/prod/';

    const origin = window.location.origin;
    if(origin == "http://127.0.0.1:5500"){ // local web server
        path = 'http://127.0.0.1:5000/';   // local flask server
    }

    const cognitoAccessToken = await vesselPropGet('cognitoAccessToken');
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

function mandrelImportCSV(prefix){
    fileOpen(".csv", mandrelImportCSVOnFileOpen, prefix)
}
window.mandrelImportCSV = mandrelImportCSV;

function mandrelImportCSVOnFileOpen(file, prefix){
    fileRead(file, mandrelImportCSVOnFileRead, prefix)
}
window.mandrelImportCSVOnFileOpen = mandrelImportCSVOnFileOpen;

async function mandrelImportCSVOnFileRead(text, prefix) {
    let colNum = document.getElementById('csvColumn').value
    if(colNum == "") colNum = 1
    colNum = colNum - 1

    let mandrel
    try {
        if (prefix == "Raw")
            await layerPropAllClear();

        mandrel = mandrelFromCSV(text, colNum);
        await mandrelSet(prefix, mandrel)
    } catch (error) {
        showError(`Error importing file: ${error}`);
    }
    loaded();
};
window.mandrelImportCSVOnFileRead = mandrelImportCSVOnFileRead;

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
        if (error.name !== 'AbortError') {
            showError(error);
        }
    }

    loaded()
}

async function saveCsvWithDialog(name) {
    const mandrel = await layerPropGet("mandrel" + name);
    if (!mandrel) {
        showError("No mandrel data to save");
        return;
    }
    const filename = await layerPropGet("PartNumber") + "_" + await layerPropGet("LayerNumber") + "_" + name + ".csv";
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
    return await layerPropGet("mandrel" + name);
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
    const mandrel = await mandrelGet(name);
    if (!mandrel) return
    
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
        
    meshSet("mandrel" + name + "Mesh", meshCreate(render, color, transpatent, setScale));
}
window.mandrelTreeUpdate = mandrelTreeUpdate;
  
async function setPole() {
    const mandrel = await mandrelGet("Raw")
    if (!mandrel) return;
    const {x, r} = mandrel
    if (r.length > 0)
        await inputSet('poleR', r[0]);
}

async function mandrelSet(name, xOrMandrel, r = null){
    let mandrel = xOrMandrel;
    if (r) mandrel = { x: xOrMandrel, r: r };
    await layerPropSet("mandrel" + name, mandrel);
    if (name == "Raw") setPole();
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
    x = x.map(value => value + inputGet("shift"));
    await mandrelSet("Raw", x, r);
}
window.mandrelShiftX = mandrelShiftX;

async function mandrelShiftR(){
    const mandrel = await mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    r = r.map(value => value + inputGet("shift"));
    await mandrelSet("Raw", x, r);
}
window.mandrelShiftR = mandrelShiftR;

async function mandrelMultiplyX(){
    const mandrel = await mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    x = x.map(value => value * inputGet("koeff"));
    await mandrelSet("Raw", x, r);
}
window.mandrelMultiplyX = mandrelMultiplyX;

async function mandrelMultiplyR(){
    const mandrel = await mandrelGet("Raw");
    if (!mandrel) return null;
    let { x, r } = mandrel;
    r = r.map(value => value * inputGet("koeff"));
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

async function thicknessGet() {
    loading();

    const coilCorrected = await coilGet("Corrected")
    const coilMeridian = await layerPropGet("coilMeridian");

    if (!coilCorrected || !coilMeridian) {
        showError("No data");
        return;
    }

    lambdaCall("thickness.thickness", [coilCorrected, coilMeridian, await layerPropGet('band')])
        .then(async (res) => {
            await mandrelSet("Wound", res);
            loaded();
        })
        .catch(error => {
            showError(error);
            loaded();
        });
}
window.thicknessGet = thicknessGet


// Smooth

async function mandrelSmooth() {
    loading();

    const mandrel = await mandrelGet("Wound");
    if (!mandrel) {
        showError("No wound mandrel");
        return;
    }

    lambdaCall("smooth_full", [mandrel])
        .then(async (res) => {
            await mandrelSet("Smoothed", res);
            loaded();
        })
        .catch(error => {
            showError(error);
            loaded();
        });
}
window.mandrelSmooth = mandrelSmooth


// toNextLevel

async function toNextLevel() {
    loading();

    let mandrel = await mandrelGet("Smoothed");
    if (!mandrel) {
        mandrel = await mandrelGet("Wound");
        if (!mandrel) {
            showError("No smoothed or wound mandrel");
            return;
        }
    }

    await layerAddNew()

    await mandrelSet("Raw", mandrel)

    await allShow()

    loaded();
}
window.toNextLevel = toNextLevel


// Coil

document.getElementById('coilCalc').addEventListener(
    'click', () => { coilCalc(); }
);

async function coilCalc() {
    loading();

    const mandrel = await mandrelGet("Raw");
    if (!mandrel) return null;

    try {
        return lambdaCall("vitok.vitok", [mandrel, await layerPropGet("poleR"), await layerPropGet("band")])
            .then(async (res) => {
                const [coil, meridian] = res
                await coilSet("Initial", coil);
                await layerPropSet("coilMeridian", meridian);

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

    const mode = suffix == "Initial" ? "first" : await layerPropGet("windingMode");
    let Coils = 1
    if (mode == "first"){
        Coils = 1
    } else if (mode == "round") {
        Coils = await layerPropGet("convenience") + 1
    } else if (mode == "full") {
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
        await lambdaCall("calc.tape", [coil, await layerPropGet("band")])
            .then(async res => {
                await layerPropSet("tape" + prefix, res);
                await tapeDraws();
                loaded();
            })
            .catch(error => {
                showError(error);
            });
    } else {
        await layerPropSet("tape" + prefix, undefined);
        await tapeDraws();
    }
}

function tapeRemove(suffix) {
    meshRemove("coil" + suffix + "Line");
    meshRemove("tape" + suffix + "Line");
    meshRemove("tape" + suffix + "Mesh");
}

async function tapeDraw(suffix) {
    let render = await coilRender(suffix);
    if(render){
        meshes["coil" + suffix + "Line"] = meshCreateLine(render);
    }

    render = await tapeRender(suffix);
    // console.log(suffix, render[0].length, render[1].length, render[2].length)
    if (render){
        const colorLine = 0xd38629
        meshes["tape" + suffix + "Line"] = meshCreateLine([render[0], render[1]], colorLine);
    
        const colorMesh = suffix == "Initial" ? 0xff5500 : (suffix == "Corrected" ? 0xfea02a : 0xffff00)
        meshes["tape" + suffix + "Mesh"] = meshCreate([render[0], render[2]], colorMesh);
    }
}

async function tapeDraws() {
    tapeRemove("Initial");
    tapeRemove("Corrected");
    tapeRemove("Interpolated");

    window.animateTapeMeshIndices = null;
    window.animateTapeLineIndices = null;

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

    const tape = await layerPropGet("tape" + suffix);
    if (!tape) return undefined;

    const mode = suffix == "Initial" ? "first" : await layerPropGet("windingMode");
    const n = coil.x.length;
    
    const vertices = [];
    const indLine = [];
    const indMesh = [];

    let Coils = 1
    if (mode == "first"){
        Coils = 1
    } else if (mode == "round") {
        Coils = await layerPropGet("convenience") + 1
    } else if (mode == "full") {
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

            indMesh.push(j * 2 - 2); indMesh.push(j * 2 - 1); indMesh.push(j * 2 + 0);
            indMesh.push(j * 2 - 1); indMesh.push(j * 2 + 1); indMesh.push(j * 2 + 0);
        };
        fiShift += coil.fi[n - 1];
    };

    window.animateTapeMeshIndices = mode === "first" ? Array.from(indMesh) : null;
    window.animateTapeLineIndices = mode === "first" ? Array.from(indLine) : null;

    return [vertices, indLine, indMesh];
}


// Winding
async function Winding(param = undefined){
    loading();

    const coilCorrected = await coilGet("Corrected");
    if (!coilCorrected){
        showError("No coil data")
        return
    }

    lambdaCall("calc.winding", [
        await layerPropGet('machine'),
        coilCorrected,
        await layerPropGet('safetyR'),
        await layerPropGet('lineCount'),
        await layerPropGet('band')
    ])
        .then(async res => {
            await coilSet     ("Interpolated"            , res[0]);
            await layerPropSet("equidistantaInterpolated", res[1]);
            await layerPropSet("MTU"                     , res[2]);
            // await layerPropSet("rolleyInterpolated"      , res[3]);

            const machine = await layerPropGet("machine");
            const TK      = await coilGet     ("Interpolated"            );
            const TS      = await layerPropGet("equidistantaInterpolated");
            const MTU     = await layerPropGet("MTU");
            const band    = await layerPropGet("band")

            const chain = await lambdaCall("calc.chain", [machine, TK, TS, MTU, band])
            await layerPropSet("chain", chain);

            await setRolley()

            // await tapeDraws();
            await animateInit();
            await meshesShow();

            loaded();
        })
        .catch(error => {
            showError(error);
        });
}
window.Winding = Winding


// Patterns

document.getElementById('convenience').addEventListener(
    'change', function (event) { patternsCalc() }
);

document.getElementById('netStructure').addEventListener(
    'change', function (event) { patternsCalc() }
);

async function patternsCalc() {
    loading();
    lambdaCall("fibbo", [await coilGet("Initial"), await layerPropGet("band"), await layerPropGet("convenience"), await layerPropGet("netStructure")])
        .then(async (patterns) => {
            await layerPropSet("fibbo", patterns);
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
    await layerPropSet("coil" + suffix, coil)

    if (suffix == "Initial") {
        await coilSet("Corrected", undefined);
    } else if (suffix == "Corrected") {
        await coilSet("Interpolated", undefined);
    }

    await tapeCalc(suffix);
}

async function coilGet(suffix) {
    let coil = await layerPropGet("coil" + suffix);

    if (!coil) return undefined;
    
    if (suffix == "Corrected") {
        const coilInitial = await layerPropGet("coilInitial");
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


document.getElementById('coilCorrect').addEventListener('click', async () => {
    loading();

    const coil = await coilGet("Initial");
    const { Turns, Coils } = await fibboGetSelectedValues();

    lambdaCall("conte", [coil, Turns, Coils])
        .then(async res => {
            await coilSet("Corrected", {
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
    const itpEqd = await layerPropGet("equidistantaInterpolated");
    if (!itpEqd) {
        showError("No interpolated equidistanta yet");
        loaded();
        return;
    }

    const txt = await lambdaCall("CNC", [itpEqd]);
    const filename = await layerPropGet("PartNumber") + "_" + await layerPropGet("LayerNumber") + "_CNC.txt";
    await saveFile(CNCGet, itpEqd, filename, "text/plain");
    loaded();
}
window.CNCExport = CNCExport


// ALL

async function allShow() {
    meshClear();

    const layerId = await layerIdGet()

    await inputUpdate(layerId)
    await layersRenderTable()
    await machinesRenderTable()
    await fibboRenderTable()
    await appearShow()
    await modeShow(layerId)

    scaleSet()

    if(layerId){
        await setPole()
        mandrelsDraw()
        await tapeDraws()
        await patternDraw()
    }

    await animateInit()
    await meshesShow()
}


// vesselPrint
async function vesselPrint(){
    console.log("theVessel:", theVessel);
    console.log("theLayer:", theLayer);
}
window.vesselPrint = vesselPrint;


// coilLoad - unused
function coilLoad(prefix){
    fileOpen(".yaml", coilLoadOnFileOpen, prefix)
}
window.coilLoad = coilLoad;

function coilLoadOnFileOpen(file, prefix) {
    fileRead(file, coilLoadOnFileRead, prefix)
};
window.coilLoadOnFileOpen = coilLoadOnFileOpen;

async function coilLoadOnFileRead(text, prefix) {
    await layerPropSet("coil" + prefix, yamlToData(text));
    await tapeCalc(prefix);
}


// Examples
async function vesselloadFromURL(name) {
    loading();

    await layerAddIfNotExist()
    // await layerPropAllClear();
    // meshClear();

    const url = './examples/' + name + '.yaml'
    let response = null;
    try {
        response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
    } catch (error) {
        showError(error);
    }

    // await layerPropAllSet(
    //     yamlToData(await response.text())
    // );

    // await allShow();
    // loaded();

    const text = await response.text();

    await vesselLoadOnFileRead(text)

};
window.vesselloadFromURL = vesselloadFromURL


async function vesselActualise() {
    const layers = await vesselPropGet("layers")
    if (!layers) {
        toggleHelp(true, true);

        await vesselloadFromURL("engine");

        // document.getElementById('appear-button-mandrel').click();
        // document.getElementById('appear-button-equidistanta').click();
    } else {
        await allShow();
    }
}
window.vesselActualise = vesselActualise

async function vesselOnLoad() {
    window.tapeThickness = 0.05
    window.tapeThicknessFirst = window.tapeThickness * 5
}
window.vesselOnLoad = vesselOnLoad
