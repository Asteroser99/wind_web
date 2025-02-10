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
        row.addEventListener("click", () => fibboSelectRow(index));
        row.dataset.index = index;
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
    pCanvas.width  = parent.offsetWidth; //  * window.devicePixelRatio
    pCanvas.height = parent.offsetHeight;

    window.pRadius = Math.min(pCanvas.width, pCanvas.height) / 2;

    pContext.translate(pRadius, pRadius);

    drawPattern();
}
window.resizePattern = resizePattern;

function drawPattern() {
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

    const coil = getField("coil");
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
