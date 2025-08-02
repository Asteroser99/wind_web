const db = new Dexie("WinderCAM");


// local

function storageLocalSet(table, id, value){
    localStorage.setItem(table + "_" + id, JSON.stringify(value));
}

function storageLocalGet(table, id){
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

async function storageLocalRemove(table, id){
    localStorage.removeItem(table + "_" + id);
}


// storage

function storageTableGet(tableName) {
    if (!db[tableName]) {
        throw new Error(`Table "${tableName}" is not defined in Dexie schema.`);
    }
    return db[tableName];
}

async function storageSet(table, id, value){
    const tbl = storageTableGet(table);
    await tbl.put({ id, value });
}
window.storageSet = storageSet

async function storageGet(table, id) {
    const tbl = storageTableGet(table);
    const entry = await tbl.get(id);
    return entry?.value;
}
window.storageGet = storageGet

async function storageRemove(table, id) {
  const tbl = storageTableGet(table);
  await tbl.delete(id);
}
window.storageRemove = storageRemove


// fields

const fieldSet = async (key, value) => {
    vessel[key] = value;
    await db.layers.put({
        layer: "layer",
        id: key,
        data: value
    });
};
window.fieldSet = fieldSet;

const fieldGet = async (key) => {
    if (Object.keys(vessel).length === 0) {
        fieldAllGet()
    }
    return vessel[key];
};
window.fieldGet = await fieldGet


// fieldAll

const fieldAllSet = async (newLayer) => {
    await fieldAllClear();

    for (const [key, value] of Object.entries(newLayer)) {
        await fieldSet(key, value)
    }
};
window.fieldAllSet = fieldAllSet

const fieldAllGet = async () => {
    const records = await db.layers.where("layer").equals("layer").toArray()
    for (const record of records) {
        vessel[record.id] = record.data
    }
};
window.fieldAllGet = fieldAllGet

const fieldAllClear = async () => {
    vessel = {};
    await db.layers.where("layer").equals("layer").delete();
};
window.fieldAllClear = fieldAllClear


//

async function storageOnLoad() {
    db.version(1).stores({
        vessel: "&id",
        cognito: "&id",
        layers: "[layer+id], layer, id",
    });
}
window.storageOnLoad = storageOnLoad
