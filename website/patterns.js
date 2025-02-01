// Table

function fibboRenderTable() {
    const fibbo = getField("fibbo");
    if(!fibbo) return;

    const tableBody = document.querySelector("#data-table tbody");
    
    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }    

    fibbo.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.Turns}</td>
            <td>${item.Coils}</td>
            <td>${item.Correction.toFixed(3)}</td>
        `;
        row.addEventListener("click", () => fibboSelectRow(row, index));
        tableBody.appendChild(row);
    });
}
window.fibboRenderTable = fibboRenderTable;

function fibboSelectRow(row, index) {
    const selected = document.querySelector("#data-table tbody .selected");
    if (selected) {
        selected.classList.remove("selected");
    }
    row.classList.add("selected");
    row.dataset.index = index;
}

function fibboGetSelectedValues() {
    const tableBody = document.querySelector("#data-table tbody");
    const fibbo = getField("fibbo");

    const selectedRow = document.querySelector("#data-table tbody .selected");

    if (!selectedRow) return { Turns: 0, Coils: 0 };

    const index = selectedRow.dataset.index;
    if (index === undefined || !fibbo || !fibbo[index]) return { Turns: 0, Coils: 0 };

    return {
        Turns: fibbo[index].Turns,
        Coils: fibbo[index].Coils
    };
}
window.fibboGetSelectedValues = fibboGetSelectedValues;


// Draw

function drawAxes() {
    const canvas = window.patterns_canvas;
    const ctx = window.patterns_canvas_ctx;

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    
    // Ось X
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Ось Y
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    
    // Метки на осях
    ctx.font = "14px Arial";
    ctx.fillStyle = "black";
    for (let i = -200; i <= 200; i += 50) {
        if (i !== 0) {
            ctx.fillText(i, canvas.width / 2 + i, canvas.height / 2 + 15);
            ctx.fillText(i, canvas.width / 2 + 5, canvas.height / 2 - i);
        }
    }
}

function drawRectangle(x, y, w, h, color) {
    const canvas = window.patterns_canvas;
    const ctx = window.patterns_canvas_ctx;

    ctx.fillStyle = color;
    ctx.fillRect(canvas.width / 2 + x, canvas.height / 2 - y, w, -h);
}

function drawDiamond(x, y, size, color) {
    const canvas = window.patterns_canvas;
    const ctx = window.patterns_canvas_ctx;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 + x, canvas.height / 2 - (y - size));
    ctx.lineTo(canvas.width / 2 + (x + size), canvas.height / 2 - y);
    ctx.lineTo(canvas.width / 2 + x, canvas.height / 2 - (y + size));
    ctx.lineTo(canvas.width / 2 + (x - size), canvas.height / 2 - y);
    ctx.closePath();
    ctx.fill();
}

document.getElementById('DrawPatterns').addEventListener(
    'click', () => { drawPattern(); }
);

function drawPattern() {
    const ctx = window.patterns_canvas_ctx;
    const vessel_data = getVesselData()

    const coil = getField("coil");
    if (coil == undefined) return;
    let { x, r, fi, al } = coil;

    console.log(vessel_data);
    console.log(coil);

    let ae = Math.min(Math.PI * 0.5 - Math.min(...al));
    let re = Math.max(...r);
    let EL = 2.0 * Math.PI * re;
    let shk = vessel_data["Band"] / Math.cos(ae);
    let NVit = Math.floor((EL * Math.cos(ae)) / vessel_data["Band"]);
    shk = (EL * Math.cos(ae)) / NVit;

    let twk = 2.0 * Math.PI * vessel_data["Turns"] / vessel_data["Coils"];
    let aek = Math.min(Math.PI * 0.5 - Math.min(...al));
    let shkr = shk / Math.cos(aek);
    let dsh = shkr / re;
    let ng = Math.floor((2 * Math.PI / dsh) + 0.5);
    shkr = (2 * Math.PI * re) / ng;

    console.log(ae, re, EL, shk, NVit, twk, aek, shkr, dsh, ng);

    for (let i = 0; i <= ng; i++) {
        let fii = i * twk;
        ctx.beginPath();
        ctx.arc(0, 0, re, fii, fii + 0.05);
        ctx.stroke();
        ctx.fillText(i, 1.2 * re * Math.cos(fii), 1.2 * re * Math.sin(fii));
    }
    // ctx.translate(-canvas.width / 2, -canvas.height / 2);

// drawRectangle(-100, 50, 80, 50, "blue");
// drawDiamond(100, -50, 40, "red");

}
window.drawPattern = drawPattern

function patternClear() {
    window.patterns_canvas = document.getElementById("patterns-canvas");
    window.patterns_canvas_ctx = window.patterns_canvas.getContext("2d");

    const canvas = window.patterns_canvas;
    const ctx = window.patterns_canvas_ctx;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //ctx.translate(canvas.width / 2, canvas.height / 2);
    
    drawAxes();
}

patternClear()

// drawPattern(coil, Band, Turns, Coils);
