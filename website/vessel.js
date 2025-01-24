window.vessel = {};


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
            return response.data;
        })
        .catch((error) => {
            console.error('Error calling Lambda:', error);
        });
}


// Mandrel

const mandrelLoadInput = document.getElementById('mandrelLoadInput');
document.getElementById('mandrelLoad').addEventListener(
    'click', () => { mandrelLoadInput.click(); }
);
mandrelLoadInput.addEventListener(
    'change', function (event) { mandrelLoadOnClick(event) }
);
function mandrelLoadOnClick(event) {
    const file = event.target.files[0];
    if (!file) return 

    const reader = new FileReader();
    reader.onload = mandrelLoadOnFileLoad;
    reader.readAsText(file);
}

function mandrelLoadOnFileLoad(event) {
    loading();
    const csvText = event.target.result;

    loading();

    mandrelFromCSV(csvText);
    mandrelDraw();

    loaded();
};

function mandrelFromCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");

    if (headers.length < 2) {
        throw new Error("CSV must have at least two columns");
    }

    const r = []; const x = [];
    for (let i = 1; i < lines.length; i++) {
        const [rValue, xValue] = lines[i].split(",");
        r.push(Number(rValue.trim()));
        x.push(Number(xValue.trim()));
    }

    vessel["mandrel"] = { r, x }
}

function mandrelDraw() {
    addMesh(mandrelRender(), true);
}

function mandrelRender() {
    const { r, x } = vessel["mandrel"];

    const resolution = 100;
    const indices = [];
    const points = [];

    for (let i = 0; i < r.length; i++) {
        const theta = Array.from({ length: resolution }, (_, j) => (2 * Math.PI * j) / resolution);
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
        for (let j = 0; j < indices[i].length - 1; j++) {
            const p1 = indices[i][j];
            const p2 = indices[i][j + 1];
            const p3 = indices[i + 1][j];
            const p4 = indices[i + 1][j + 1];
            faces.push(p1, p4, p2);
            faces.push(p1, p3, p4);
        }
    }

    return [points, faces]
}


// Line coil

document.getElementById('coilDraw').addEventListener(
    'click', () => { coilDrawOnClick(); }
);

function coilDrawOnClick() {
    loading();

    coilFromMandrel()
        .then(() => {
            coilDraw()
            loaded();
        })
        .catch(error => {
            console.error("Error in coilDrawOnClick:", error);
        });
}

function coilDraw() {
    addLineSegments(coilRender());
}

function coilFromMandrel() {
    const { r, x } = vessel["mandrel"];
    const valueX = document.getElementById('value-x');
    const Pole = parseFloat(valueX.textContent)//.toFixed(2)

    return lambdaCall("vitok", [x, r, Pole, 10.])
        .then(([x, r, fi, alfa]) => {
            vessel["coil"] = { x, r, fi, alfa };
        })
        .catch(error => {
            console.error("Error in coilFromMandrel:", error);
        });
}

function coilRender() {
    const { x, r, fi, alfa } = vessel["coil"];

    const vertices = [];
    const indices = [];

    for (let i = 0; i < x.length; i++) {
        const pfi = fi[i];
        const px = x[i];
        const py = r[i] * Math.sin(pfi);
        const pz = r[i] * Math.cos(pfi);

        vertices.push(px, py, pz);

        if (i > 0) {
            indices.push(i - 1);
            indices.push(i);
        }
    }

    return [vertices, indices];
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
            console.error("Error in DrawTapeN:", error);
        });
}

function tapeFromCoil() {
    const { x, r, fi, alfa } = vessel["coil"];
    return lambdaCall("gltfCoil", ["TapeN", x, r, fi, alfa, 10., 10.])
        .then(gltf => {
            vessel["tape"] = gltf;
        })
        .catch(error => {
            console.error("Error in tapeFromCoil:", error);
        });
}

function tapeDraw() {
    const gltf = vessel["tape"];
    addMesh([gltf.verticesArray, gltf.indicesArray], false, 0xffff00);
}

// ALL

// vesselSave

function downloadYamlFile(data, fileName) {
    // Конвертируем объект в YAML
    const yamlString = jsyaml.dump(data);

    // Создаем Blob для скачивания
    const blob = new Blob([yamlString], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);

    // Создаем временную ссылку
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Убираем ссылку
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.getElementById('vesselSave').addEventListener(
    'click', () => {
        downloadYamlFile(vessel, "vessel.yaml");
    }
);


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
    vessel = loadFromYaml(event.target.result);

    mandrelDraw();
    coilDraw();
    tapeDraw();
}

function loadFromYaml(yamlString){
    let parsedData = null;
    try {
        parsedData = jsyaml.load(yamlString);
    } catch (error) {
        console.error("Error parsing YAML file:", error);
    }
    return parsedData;
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
        console.error('Error loading YAML file:', error);
    }

    vessel = loadFromYaml(await response.text());
}

function vesselloadFromURL(name) {
    loadFromYamlURL('./examples/' + name + '.yaml').then(() => {
        mandrelDraw();
        coilDraw();
        tapeDraw();
    })
};


// Clear
document.getElementById('clear').addEventListener(
    'click', () => {
        vessel = {};
        clearScene();
    }
);


window.onload = function () {
    vesselloadFromURL("Example1");
};
