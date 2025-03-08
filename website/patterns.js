// Table

function fibboRenderTable() {
    const patterns = getField("patterns");
    if(!patterns) return;

    const tableBody = document.querySelector("#data-table tbody");

    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }    

    patterns.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.Turns}</td>
            <td>${item.Coils}</td>
            <td>${item.Correction.toFixed(3)}</td>
        `;
        row.addEventListener("click", () => fibboSelectRow(index));
        row.dataset.index = index;
        row.classList.add("clickable-row");
        tableBody.appendChild(row);
    });

    fibboSelectRow(getField("fibboIndex"))
}
window.fibboRenderTable = fibboRenderTable;

function fibboSelectRow(index) {
    const tableBody = document.querySelector("#data-table tbody");
    const row = tableBody.querySelector(`tr[data-index='${index}']`);
    if (!row) return;

    setField("fibboIndex", index);

    const selected = tableBody.querySelector(".selected");
    if (selected) {
        selected.classList.remove("selected");
    }
    row.classList.add("selected");

    drawPattern();
}

function fibboGetSelectedValues() {
    const tableBody = document.querySelector("#data-table tbody");
    const patterns = getField("patterns");

    const selectedRow = document.querySelector("#data-table tbody .selected");

    if (!selectedRow) return { Turns: 0, Coils: 0 };

    const index = selectedRow.dataset.index;
    if (index === undefined || !patterns || !patterns[index]) return { Turns: 0, Coils: 0 };

    return {
        Turns: patterns[index].Turns,
        Coils: patterns[index].Coils
    };
}
window.fibboGetSelectedValues = fibboGetSelectedValues;


// Draw

function drawAxes() {
    const r = window.pRadius;

    pContext.strokeStyle = "black";
    pContext.lineWidth = 1;
    
    pContext.beginPath();
    pContext.moveTo(- pRadius, 0);
    pContext.lineTo(  pRadius, 0);
    pContext.stroke();
    
    pContext.beginPath();
    pContext.moveTo(0, -pRadius);
    pContext.lineTo(0,  pRadius);
    pContext.stroke();
    
    pContext.font = "8px Arial";
    pContext.fillStyle = "black";
    for (let i = -pRadius; i <= pRadius; i += 50) {
        if (i !== 0) {
            pContext.fillText(i, i,  15);
            pContext.fillText(i, 5, - i);
        }
    }
}

function drawRectangle(x, y, w, h, color) {
    pContext.fillStyle = color;
    pContext.fillRect(pCanvas.width / 2 + x, pCanvas.height / 2 - y, w, -h);
}

function drawDiamond(x, y, size, color) {
    pContext.fillStyle = color;
    pContext.beginPath();
    pContext.moveTo(pCanvas.width / 2 + x, pCanvas.height / 2 - (y - size));
    pContext.lineTo(pCanvas.width / 2 + (x + size), pCanvas.height / 2 - y);
    pContext.lineTo(pCanvas.width / 2 + x, pCanvas.height / 2 - (y + size));
    pContext.lineTo(pCanvas.width / 2 + (x - size), pCanvas.height / 2 - y);
    pContext.closePath();
    pContext.fill();
}

function resizePattern() {
    const parent = pCanvas.parentElement;
    pCanvas.width  = parent.offsetWidth ; //  * window.devicePixelRatio
    pCanvas.height = parent.offsetHeight;

    window.pRadius = Math.min(pCanvas.width, pCanvas.height) / 2;

    pContext.translate(pCanvas.width / 2, pCanvas.height / 2);

    drawPattern();
}
window.resizePattern = resizePattern;

function drawPattern_1() {
    pContext.clearRect(-pRadius, -pRadius, pCanvas.width, pCanvas.height);

    drawAxes();

    const vessel_data = getVesselData()
    if (vessel_data["Band"] == 0) return

    const rd = pRadius * 0.95;
    pContext.strokeStyle = "black";
    pContext.lineWidth = 1;
    pContext.beginPath();
    pContext.arc(0, 0, rd / 2., 0, 2 * Math.PI);
    pContext.stroke();

    const coil = coilGet("Initial");
    if (coil == undefined) return;
    let { x, r, fi, al } = coil;

    let ae = Math.PI * 0.5 - Math.max(...al)
    let re = Math.max(...r);
    re = pRadius * 0.75;
    let EL = 2.0 * Math.PI * re;
    let shk = vessel_data["Band"] / Math.cos(ae);
    let NVit = Math.floor((EL * Math.cos(ae)) / vessel_data["Band"]);
    shk = (EL * Math.cos(ae)) / NVit;

    let twk = 2.0 * Math.PI * vessel_data["Turns"] / vessel_data["Coils"];
    let shkr = shk / Math.cos(ae);
    let dsh = shkr / re;
    let ng = Math.floor((2 * Math.PI / dsh) + 0.5);
    shkr = (2 * Math.PI * re) / ng;

    let x00 = re * Math.cos(-shkr * 0.5 / re);
    let y00 = re * Math.sin(-shkr * 0.5 / re);
    let x01 = re * Math.cos(+shkr * 0.5 / re);
    let y01 = re * Math.sin(+shkr * 0.5 / re);

    let x10, y10, x11, y11

    for (let i = 0; i <= ng; i++) {
        let fii = i * twk;
        pContext.beginPath();
        pContext.arc(0, 0, re, fii, fii + 0.15);
        pContext.stroke();

        x10 = re * Math.cos(i * twk - shkr * 0.5 / re);
        y10 = re * Math.sin(i * twk - shkr * 0.5 / re);
        x11 = re * Math.cos(i * twk + shkr * 0.5 / re);
        y11 = re * Math.sin(i * twk + shkr * 0.5 / re);

        pContext.beginPath();
        pContext.moveTo(x00, y00);
        pContext.lineTo(x01, y01);
        pContext.lineTo(x11, y11);
        pContext.lineTo(x10, y10);
        pContext.closePath();

        // pContext.fillStyle = "rgba(255, 0, 0, 0.5)"; // alfa
        pContext.fillStyle = "#2973B2";
        pContext.fill();    

        // pContext.fillText(i, 1.2 * re * Math.cos(fii), 1.2 * re * Math.sin(fii));

        x00 = x10; y00 = y10; x01 = x11; y01 = y11;
    }
    // pContext.translate(-pCanvas.width / 2, -pCanvas.height / 2);

// drawRectangle(-100, 50, 80, 50, "blue");
// drawDiamond(100, -50, 40, "red");

}

function drawPattern() {
    // pContext.clearRect(-pRadius, -pRadius, pCanvas.width, pCanvas.height);

    let gradient = pContext.createLinearGradient(-pCanvas.width / 2, -pCanvas.height / 2, pCanvas.width, pCanvas.height);
    // gradient.addColorStop(0, "hsl(200, 80%, 60%)");  // Голубой
    // gradient.addColorStop(1, "hsl(340, 80%, 60%)");  // Розовый
    gradient.addColorStop(0, '#99E6B2'); // Верхний цвет
    gradient.addColorStop(1, '#2973B2'); // Нижний цвет
    
    pContext.fillStyle = gradient;
    pContext.fillRect(-pCanvas.width / 2, -pCanvas.height / 2, pCanvas.width, pCanvas.height);


    const vessel_data = getVesselData()
    // if (vessel_data["Band"] == 0) return

    const Coils = vessel_data["Coils"]
    const Turns = vessel_data["Turns"]
    const angleStep = Math.PI * 2 / Coils * Turns
    
    const cx = 0
    const cy = 0
    const radius = pRadius * 0.8

    const canvas = document.getElementById("patterns-canvas");
    const ctx    = canvas.getContext("2d");
    
    // points
    let points = [];
    const colorStep = 360 / Coils;
    for (let i = 0; i <= Coils; i++) {
        let angle = i * angleStep;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const c = i * colorStep
        points.push({ x, y, c });
    }
    
    ctx.lineWidth = 8;
    ctx.lineJoin = "round";
    
    // lines
    // for (let i = 0; i < points.length - 1; i++) {
    for (let i = points.length - 1; i > 0; i--) {
        let start = points[i    ];
        let end   = points[i - 1];

        const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        gradient.addColorStop(0, `hsl(${ start.c }, 50%, 50%)`);
        gradient.addColorStop(1, `hsl(${ end  .c }, 50%, 50%)`);
        
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";


    const innerRadius = radius + 24
    const outerRadius = radius + 32
    // Рисуем внешний и внутренний круги
    const segment = (Math.PI * 2) / Coils;
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0 + segment * 0.5, Math.PI * 2 + segment * 0.5);
    ctx.arc(cx, cy, outerRadius, Math.PI * 2 + segment * 0.5, 0 + segment * 0.5, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // triangles
    for (let i = 0; i < points.length - 1; i++) {
        let point = points[i    ];

        const size = 15;

        // triangle
        let dx = point.x - cx;
        let dy = point.y - cy;
        let length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;

        let tipX = point.x + dx * size * -0.5;
        let tipY = point.y + dy * size * -0.5;

        let perpX = -dy * size;
        let perpY =  dx * size;

        let baseX = point.x + dx * size * 1.5;
        let baseY = point.y + dy * size * 1.5;

        let leftX  = baseX + perpX;
        let leftY  = baseY + perpY;
        let rightX = baseX - perpX;
        let rightY = baseY - perpY;

        ctx.fillStyle = `hsl(${ point.c }, 50%, 50%)`;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(leftX, leftY);
        ctx.lineTo(rightX, rightY);
        ctx.closePath();
        ctx.fill();


        // number
        let textX = point.x + dx * size * 0.9;
        let textY = point.y + dy * size * 0.9;

        ctx.fillStyle = "white";
        ctx.font = `${10}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(i, textX, textY);


        let angle = (i + 0.5) * segment;
        let xOuter = cx + Math.cos(angle) * outerRadius;
        let yOuter = cy + Math.sin(angle) * outerRadius;
        let xInner = cx + Math.cos(angle) * innerRadius;
        let yInner = cy + Math.sin(angle) * innerRadius;

        ctx.beginPath();
        ctx.moveTo(xOuter, yOuter);
        ctx.lineTo(xInner, yInner);
        ctx.stroke();

    }

}
window.drawPattern = drawPattern


// function patternClear() {
//     window.pCanvas = document.getElementById("patterns-canvas");
//     window.pContext = window.pCanvas.getContext("2d");

//     pContext.clearRect(0, 0, pCanvas.width, pCanvas.height);
//     //pContext.translate(pCanvas.width / 2, pCanvas.height / 2);
    
//     drawAxes();
// }

function patternsOnLoad() {
    window.pCanvas = document.getElementById("patterns-canvas");
    window.pContext = window.pCanvas.getContext("2d");

    window.addEventListener("resize", resizePattern);
    resizePattern();
    
    fibboRenderTable();
}
window.patternsOnLoad = patternsOnLoad
