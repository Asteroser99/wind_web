// import Dexie from 'dexie';
const db = new Dexie("WinderCAM");

// storage

function storageTableGet(tableName) {
  if (!db[tableName]) {
    throw new Error(`Table "${tableName}" is not defined in Dexie schema.`);
  }
  return db[tableName];
}

function storageSetLocal(table, id, value){
    localStorage.setItem(table + "_" + id, JSON.stringify(value));
}
async function storageSet(table, id, value){
    const tbl = storageTableGet(table);
    await tbl.put({ id, value });
}
window.storageSet = storageSet

function storageGetLocal(table, id){
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
async function storageGet(table, id) {
    const tbl = storageTableGet(table);
    const entry = await tbl.get(id);
    return entry?.value;
}
window.storageGet = storageGet

async function storageRemoveLocal(table, id){
    localStorage.removeItem(table + "_" + id);
}
async function storageRemove(table, id) {
  const tbl = storageTableGet(table);
  await tbl.delete(id);
}
window.storageRemove = storageRemove


// fields

const fieldAsyncStorageSet = async (key, value) => {
    const keys = await storageGet('vessel', 'keys') || [];

    if (!keys.includes(key)) {
        keys.push(key);
    }
    await storageSet('vessel', 'keys', keys);

    await storageSet('vessel', `${key}`, value);
};
window.fieldAsyncStorageSet = fieldAsyncStorageSet;

const fieldSet = async (key, value) => {
    vessel[key] = value;

    try {
        const result = await fieldAsyncStorageSet(key, value);
    } catch (error) {
        showError(error);
    }
};
window.fieldSet = fieldSet

const fieldGet = async (key) => {
    if (Object.keys(vessel).length === 0) {
        const keys = await storageGet('vessel', 'keys') || [];
        for (const storedKey of keys) {
            let value = await storageGet("vessel", `${storedKey}`);
            vessel[storedKey] = value;
        }
    }
    return vessel[key];
};
window.fieldGet = await fieldGet

const fieldAllClear = async () => {
    const keys = await storageGet('vessel', 'keys') || [];

    keys.forEach((key) => {
        storageRemove("vessel", `${key}`);
    });

    storageRemove('vessel', 'keys');

    // storageСlear();
    vessel = {};
};
window.fieldAllClear = fieldAllClear

const fieldAllSet = async (newVessel) => {
    await fieldAllClear();

    vessel = newVessel;

    for (const [key, value] of Object.entries(newVessel)) {
        await fieldAsyncStorageSet(key, value)
    }

    await inputFieldInit();
    await modeButtonInit();
};
window.fieldAllSet = fieldAllSet

const fieldAllUpdateFromStorage = async () => {
    const keys = await storageGet('vessel', 'keys') || [];

    for (const key of keys) {
        vessel[key] = await storageGet("vessel", `${key}`);
    }
};
window.fieldAllUpdateFromStorage = fieldAllUpdateFromStorage


async function storageOnLoad() {
    db.version(1).stores({
        cognito: "&id",
        vessel: "&id",
    });
}
window.storageOnLoad = storageOnLoad
