window.theCognito = {};
window.theVessel = {};
window.theLayer = {};

// local - obsolete

function storageLocalSet_Obsolete(table, id, value){
    localStorage.setItem(table + "_" + id, JSON.stringify(value));
}

function storageLocalGet_Obsolete(table, id){
    let value = localStorage.getItem(table + "_" + id);
    if (value && value != undefined){
        try {
            value = JSON.parse(value);
        } catch (error) {
            value = undefined;
        }
    }
    return value;
}

async function storageLocalRemove_Obsolete(table, id){
    localStorage.removeItem(table + "_" + id);
}


// cognito

async function cognitoPropAllGet() {
    const entries = await db.cognito.toArray();
    for (const entry of entries) {
        theCognito[entry.id] = entry.value;
    }
}

async function cognitoPropSet(id, value){
    // console.log("cognitoPropSet", id, value)
    theCognito[id] = value;

    await db.cognito.put({ id, value });
}
window.cognitoPropSet = cognitoPropSet

async function cognitoPropGet(id) {
    // const entry = await db.cognito.get(id);
    // return entry?.value;

    if (Object.keys(theCognito).length === 0) {
        cognitoPropAllGet()
    }

    return theCognito[id];
}
window.cognitoPropGet = cognitoPropGet

async function cognitoPropRemove(id) {
    await db.cognito.delete(id);
}
window.cognitoPropRemove = cognitoPropRemove


// vessellAll

const vesselPropAllClear = async (vessel) => {
    theVessel = {};
    await db.vessel.clear();
}
window.vesselPropAllClear = vesselPropAllClear

const vesselPropAllSet = async (vessel) => {
    await vesselPropAllClear();

    for (const [key, value] of Object.entries(vessel)) {
        await vesselPropSet(key, value)
    }
};
window.vesselPropAllSet = vesselPropAllSet

async function vesselPropAllGet() {
    const entries = await db.vessel.toArray();
    for (const entry of entries) {
        theVessel[entry.id] = entry.value;
    }
}

async function vesselPropAllGetProp(field) {
    const records = await db.layers.where("id").equals(field).toArray();

    const result = {};
    for (const r of records) {
        result[r.layer] = r.data;
    }

    return result;
}
window.vesselPropAllGetProp = vesselPropAllGetProp


// vessel

async function vesselPropSet(id, value){
    // console.log("vesselPropSet", id, value)
    theVessel[id] = value;

    await db.vessel.put({ id, value });
}
window.vesselPropSet = vesselPropSet

async function vesselPropGet(id) {
    // const entry = await db.vessel.get(id);
    // return entry?.value;

    if (Object.keys(theVessel).length === 0) {
        vesselPropAllGet()
    }

    return theVessel[id];
}
window.vesselPropGet = vesselPropGet

async function vesselPropRemove(id) {
    await db.vessel.delete(id);
}
window.vesselPropRemove = vesselPropRemove


// layerPropAll

const layersAllClear = async (vessel) => {
    theLayer = {};
    await db.layers.clear();
}
window.layersAllClear = layersAllClear

const layerPropAllSet = async (layer, layerID = null) => {
    await layerPropAllClear(layerID);

    for (const [key, value] of Object.entries(layer)) {
        await layerPropSet(key, value, layerID)
    }
};
window.layerPropAllSet = layerPropAllSet

const layerPropAllRead = async (layerId) => {
    const records = layerId ? await db.layers.where("layer").equals(layerId).toArray() : []

    const layer = {};
    for (const record of records) {
        layer[record.id] = record.data
    }

    return layer
}
window.layerPropAllRead = layerPropAllRead

const layerPropAllGet = async () => {
    const layerId = await layerIdGet()
    theLayer = await layerPropAllRead(layerId)
};
window.layerPropAllGet = layerPropAllGet

const layerPropAllClear = async (layerToClear = null) => {
    const curLayer = await layerIdGet()

    if (!layerToClear) {
        if (!curLayer) {
            console.log("layerPropAllClear: no current layer")
            return
        }
        layerToClear = curLayer
    }

    if (layerToClear == curLayer) {
        theLayer = {};
    }

    await db.layers.where("layer").equals(layerToClear).delete();
};
window.layerPropAllClear = layerPropAllClear


// layer property

const layerPropSet = async (key, value, layerId = null) => {
    // console.log("layerPropSet", layerId, key, value)
    let curLayerId = await layerIdGet()

    if (!layerId) {
        if (!curLayerId) {
            console.log("layerPropSet: no current layer")
            return
        }
        layerId = curLayerId
    }

    await db.layers.put({
        layer: layerId,
        id: key,
        data: value,
    });

    if(layerId == curLayerId)
        theLayer[key] = value;
};
window.layerPropSet = layerPropSet;

const layerPropGet = async (key) => {
    if (Object.keys(theLayer).length === 0) {
        await layerPropAllGet()
    }
    return theLayer[key];
};
window.layerPropGet = layerPropGet


// layers

async function layerAdd(){
    // console.log("layerAdd", index)

    let layerMax = await vesselPropGet("layerMax") ?? -1
    layerMax = layerMax + 1
    await vesselPropSet("layerMax", layerMax)

    const layerId = "layer" + layerMax

    const layers = await vesselPropGet("layers") ?? []
    layers.push(layerId)
    await vesselPropSet("layers", layers)

    return layerId
}
window.layerAdd = layerAdd;

async function layerAddNew(){
    let layerId = await layerAdd();

    await layerIdSet(layerId)
    await layerPropAllGet()

    const layers = await vesselPropGet("layers")
    await layerPropSet("LayerName", "layer " + layers.length)
    await layerPropSet("LayerNumber", layers.length)

    await layerPropSet("windingMode", "first")
    await layerPropSet("mandrelShow", true)
    await layerPropSet("tapeShow", true)
    await layerPropSet("machine", "RPN")
}
window.layerAddNew = layerAddNew;

async function layerDelete(layerToDelete){
    // console.log("layerDelete", layerToDelete)

    const layers = await vesselPropGet("layers") ?? []
    let curLayer = await layerIdGet()

    let index = layers.indexOf(layerToDelete);
    if (index == -1) return curLayer

    await layerPropAllClear(layerToDelete)

    layers.splice(index, 1)
    await vesselPropSet("layers", layers)
    
    if (layerToDelete == curLayer) {
        if (index > layers.length - 1) {
            index = index - 1
        }
        if (index >= 0) {
            curLayer = layers[index]
        } else {
            curLayer = undefined
        }
        return curLayer
    }
}
window.layerDelete = layerDelete;

async function layerIdSet(layerIdValue){
    // console.log("layerIdSet", layerIdValue)
    await vesselPropSet("layerId", layerIdValue)
}
window.layerIdSet = layerIdSet;

async function layerIdGet(){
    const layerIdValue = await vesselPropGet("layerId")
    // console.log("layerIdGet", layerIdValue)
    return layerIdValue
}
window.layerIdGet = layerIdGet;

async function layerAddIfNotExist(){
    let layerId = await layerIdGet()
    if (!layerId) {
        layerId = await layerAdd()
        await layerIdSet(layerId);
    }
}
window.layerAddIfNotExist = layerAddIfNotExist;


//

async function storageOnLoad() {
    let needRecreate = false;
    try {
        const SCHEMA_VERSION = "cognito:id,|layers:[layer+id],id,layer|vessel:id,";
        const dbTmp = new Dexie("WinderCAM");
        await dbTmp.open();
        const meta = dbTmp.tables.map(t => `${t.name}:${t.schema.primKey.src},${t.schema.indexes.map(i=>i.src).join(",")}`);
        const current = meta.join("|");
        if (current !== SCHEMA_VERSION) {
            needRecreate = true;
        }
        await dbTmp.close();
    } catch(e) {
        needRecreate = true;
    }

    if (needRecreate) {
        await Dexie.delete("WinderCAM");
        console.log("Dexie WinderCAM database recreated");
    }

    window.db = new Dexie("WinderCAM");

    window.db.version(1).stores({
        cognito: "&id",
        vessel: "&id",
        layers: "[layer+id], layer, id",
    });
}
window.storageOnLoad = storageOnLoad
