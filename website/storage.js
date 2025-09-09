window.theVessel = {};
window.theLayer = {};
const db = new Dexie("WinderCAM");

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


// storageAll

async function storageAllGet() {
    const entries = await db.vessel.toArray();
    for (const entry of entries) {
        theVessel[entry.id] = entry.value;
    }
}

async function storageAllGetField(field) {
    const records = await db.layers.where("id").equals(field).toArray();

    const result = {};
    for (const r of records) {
        result[r.layer] = r.data;
    }

    return result;
}
window.storageAllGetField = storageAllGetField


// storage

async function storageSet(id, value){
    // console.log("storageSet", id, value)
    theVessel[id] = value;

    await db.vessel.put({ id, value });
}
window.storageSet = storageSet

async function storageGet(id) {
    // const entry = await db.vessel.get(id);
    // return entry?.value;

    if (Object.keys(theVessel).length === 0) {
        storageAllGet()
    }

    return theVessel[id];
}
window.storageGet = storageGet

async function storageRemove(id) {
    await db.vessel.delete(id);
}
window.storageRemove = storageRemove


// fieldAll

const fieldAllSet = async (newLayer) => {
    await fieldAllClear();

    for (const [key, value] of Object.entries(newLayer)) {
        await fieldSet(key, value)
    }
};
window.fieldAllSet = fieldAllSet

const fieldAllGet = async () => {
    const curLayerId = await layerIdGet()
    if (!curLayerId) {
        console.log("fieldAllGet: no current layer")
        return
    }

    const records = await db.layers.where("layer").equals(curLayerId).toArray()

    theLayer = {};
    for (const record of records) {
        theLayer[record.id] = record.data
    }
};
window.fieldAllGet = fieldAllGet

const fieldAllClear = async (layerToClear = null) => {
    const curLayer = await layerIdGet()

    if (!layerToClear) {
        layerToClear = curLayer
        if (!layerToClear) {
            return
        }
    }

    if (layerToClear == curLayer) {
        theLayer = {};
    }

    await db.layers.where("layer").equals(layerToClear).delete();
};
window.fieldAllClear = fieldAllClear


// fields

const fieldSet = async (key, value) => {
    let curLayerId = await layerIdGet()

    // console.log("fieldSet", curLayerId, key, value)

    if (!curLayerId) {
        console.log("fieldSet: no current layer")
        return
    }

    theLayer[key] = value;

    await db.layers.put({
        layer: curLayerId,
        id: key,
        data: value,
    });
};
window.fieldSet = fieldSet;

const fieldGet = async (key) => {
    if (Object.keys(theLayer).length === 0) {
        await fieldAllGet()
    }
    return theLayer[key];
};
window.fieldGet = fieldGet


// layers

async function layerAdd(){
    // console.log("layerAdd", index)

    let layerMax = await storageGet("layerMax") ?? -1
    layerMax = layerMax + 1
    await storageSet("layerMax", layerMax)

    const curLayerId = "layer" + layerMax

    const layers = await storageGet("layers") ?? []
    layers.push(curLayerId)
    await storageSet("layers", layers)

    return curLayerId
}
window.layerAdd = layerAdd;

async function layerDelete(layerToDelete){
    // console.log("layerDelete", layerToDelete)

    const layers = await storageGet("layers") ?? []
    let curLayer = await layerIdGet()

    let index = layers.indexOf(layerToDelete);
    if (index == -1) return curLayer

    await fieldAllClear(layerToDelete)

    layers.splice(index, 1)
    await storageSet("layers", layers)
    
    if (layerToDelete == curLayer) {
        if (layers.length - 1 > index) {
            index = index - 1
        }
        if (index >= 0) {
            curLayer = layers[index]
        } else {
            curLayer = undefined
        }
        await layerIdSet(curLayer)
        return curLayer
    }
}
window.layerDelete = layerDelete;

async function layerIdSet(layerIdValue){
    // console.log("layerIdSet", layerIdValue)
    await storageSet("layerId", layerIdValue)
}
window.layerIdSet = layerIdSet;

async function layerIdGet(){
    const layerIdValue = await storageGet("layerId")
    // console.log("layerIdGet", layerIdValue)
    return layerIdValue
}
window.layerIdGet = layerIdGet;

async function layerAddIfNotExist(){
    let curLayerId = await layerIdGet()
    if (!curLayerId) {
        curLayerId = await layerAdd()
        await layerIdSet(curLayerId);
    }
}
window.layerAddIfNotExist = layerAddIfNotExist;


//

async function storageOnLoad() {
    db.version(1).stores({
        vessel: "&id",
        layers: "[layer+id], layer, id",
    });
}
window.storageOnLoad = storageOnLoad
