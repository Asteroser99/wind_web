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

function mandrelRender(rr, xx) {
    const resolution = 100;
    const indices = [];
    const points = [];

    for (let i = 0; i < rr.length; i++) {
        const theta = Array.from({ length: resolution }, (_, j) => (2 * Math.PI * j) / resolution);
        const row = [];

        for (const fii of theta) {
            const x = xx[i];
            const y = rr[i] * Math.sin(fii);
            const z = rr[i] * Math.cos(fii);

            points.push(x, y, z);
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

function DrawMandrel() {
    loading();

    const { r, x } = vessel["mandrel"];

    addMesh(mandrelRender(r, x), true);

    loaded();
}
window.DrawMandrel = DrawMandrel


const loadMandrelInput = document.getElementById('loadMandrelInput');
loadMandrelInput.addEventListener(
    'change', function (event) { loadCSVDrawMandrel(event) }
);
document.getElementById('loadMandrel').addEventListener(
    'click', () => { loadMandrelInput.click(); }
);

function loadCSVDrawMandrel(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            loading();
            const csvText = e.target.result;
            parseCSVToMandrel(csvText);
            DrawMandrel();
        };
        reader.readAsText(file);
    }
}

function parseCSVToMandrel(csvText) {
    loading();
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

    loaded();
    return { r, x };
}


// Line coil

document.getElementById('DrawCoil').addEventListener(
    'click', () => { DrawCoil(); }
);

function CalcCoil() {
    const { r, x } = vessel["mandrel"];
    const valueX = document.getElementById('value-x');
    const Pole = parseFloat(valueX.textContent)//.toFixed(2)

    return lambdaCall("vitok", [x, r, Pole, 10.])
        .then(res => {
            console.log("CalcCoil:", res);
            const [cx, cr, cfi, calfa] = res;
            return [cx, cr, cfi, calfa];
        })
        .catch(error => {
            console.error("Error in CalcCoil:", error);
        });
}

function coilRender(fi, xx, rr) {
    const vertices = [];
    const indices = [];

    for (let i = 0; i < xx.length; i++) {
        const fii = fi[i];
        const x = xx[i];
        const y = rr[i] * Math.sin(fii);
        const z = rr[i] * Math.cos(fii);

        vertices.push(x, y, z);

        if (i > 0) {
            indices.push(i - 1);
            indices.push(i);
        }
    }

    return [vertices, indices];
}

function DrawCoil() {
    loading();
    CalcCoil()
        .then(([cx, cr, cfi, calfa]) => {
            vessel["coil"] = { cx, cr, cfi, calfa };
            const mesh = line(coilRender(cfi, cx, cr));
            loaded();
        })
        .catch(error => {
            console.error("Error in DrawCoil:", error);
        });
}


// Tape coil

document.getElementById('DrawTapeN').addEventListener(
    'click', () => { DrawTapeN(); }
);

function sceneTapeN() {
    const { cx, cr, cfi, calfa } = vessel["coil"];
    return lambdaCall("gltfCoil", ["TapeN", cx, cr, cfi, calfa, 10., 10.])
        .then(gltf => {
            console.log("sceneTapeN:", gltf);
            return gltf;
        })
        .catch(error => {
            console.error("Error in sceneTapeN:", error);
        });
}

function DrawTapeN() {
    loading();
    sceneTapeN()
        .then(gltf => {
            addMesh([gltf.verticesArray, gltf.indicesArray], false, 0xffff00);
            loaded();
        })
        .catch(error => {
            console.error("Error in DrawTapeN:", error);
        });
}


// ALL

// saveVessel

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

document.getElementById('saveVessel').addEventListener(
    'click', () => {
        downloadYamlFile(vessel, "vessel.yaml");
    }
);


// loadVessel

const loadVesselInput = document.getElementById('loadVesselInput');
loadVesselInput.addEventListener(
    'change', function (event) { loadVessel(event) }
);
document.getElementById('loadVessel').addEventListener(
    'click', () => { loadVesselInput.click(); }
);

function loadVessel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        let parsedData = null;
        try {
            const yamlString = e.target.result;
            parsedData = jsyaml.load(yamlString);
        } catch (error) {
            console.error("Error parsing YAML file:", error);
        }

        vessel = parsedData;

        DrawMandrel();

};

    reader.readAsText(file);
};
