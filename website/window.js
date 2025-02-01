function changeImage(id, filename) {
    const imgElement = document.getElementById(id);
    if (imgElement && imgElement.tagName === "IMG") {
        imgElement.src = filename;
    }
}

function loading(){
    changeImage("logo", "logo.gif")
}
window.loading = loading
  
function loaded(){
    changeImage("logo", "logo.png")
}
window.loaded = loaded


export function openTab(event, tabId) {
    let hideIt = false;
    const activeTab = document.querySelector('.tab-content.active');
    const activeTabs = document.querySelector('.tabs-content.active');
    if (activeTab.id == tabId && activeTabs) {
        hideIt = true
    }

    const tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach(link => link.classList.remove('active'));

    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');

    let contentId = "scene-canvas-div";
    if (tabId == "tab-mandrel") {
        contentId = "mandrel-canvas-div";
    } else if (tabId == "tab-patterns") {
        contentId = "patterns-canvas-div";
    } else if (tabId == "tab-info") {
        hideIt = true;
        contentId = "info-canvas-div";
    }

    document.getElementById("tabs-content").classList.remove('active');
    if (!hideIt) {
        document.getElementById("tabs-content").classList.add('active');
    }

    const staticContents = document.querySelectorAll('.static-content');
    staticContents.forEach(tab => tab.classList.remove('active'));
    if (contentId != "") {
        document.getElementById(contentId).classList.add('active');
    }
    if (contentId == "scene-canvas-div") {
        resizeScene();
    }
}
window.openTab = openTab;


// Modal

// const valueX = document.getElementById('value-x');
// const valueY = document.getElementById('value-y');
// const valueZ = document.getElementById('value-z');

// const inputX = document.getElementById('input-x');
// const inputY = document.getElementById('input-y');
// const inputZ = document.getElementById('input-z');

// const modal = document.getElementById('edit-modal');
// const overlay = document.getElementById('modal-overlay');

// const editButton = document.getElementById('edit-button');
// editButton.addEventListener('click', () => {
//     inputX.value = valueX.textContent;
//     inputY.value = valueY.textContent;
//     inputZ.value = valueZ.textContent;

//     modal.style.display = 'block';
//     overlay.style.display = 'block';
// });

// const saveButton = document.getElementById('save-button');
// saveButton.addEventListener('click', () => {
//     valueX.textContent = inputX.value;
//     valueY.textContent = inputY.value;
//     valueZ.textContent = inputZ.value;

//     modal.style.display = 'none';
//     overlay.style.display = 'none';
// });

// const cancelButton = document.getElementById('cancel-button');
// cancelButton.addEventListener('click', () => {
//     modal.style.display = 'none';
//     overlay.style.display = 'none';
// });

// overlay.addEventListener('click', () => {
//     modal.style.display = 'none';
//     overlay.style.display = 'none';
// });


// Errors

function showError(error) {
    let errorContainer = document.getElementById("error-container");
    if (!errorContainer) {
        errorContainer = document.createElement("div");
        errorContainer.id = "error-container";
        errorContainer.style.position = "fixed";
        errorContainer.style.bottom = "10px";
        errorContainer.style.right = "15px";  // Отступ 5px от правого края
        errorContainer.style.background = "rgba(255, 0, 0, 0.8)";
        errorContainer.style.color = "white";
        errorContainer.style.padding = "15px";
        errorContainer.style.borderRadius = "5px";
        errorContainer.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
        // errorContainer.style.width = "auto"; // Автоширина под текст
        // errorContainer.style.maxWidth = "70%"; // Ограничение максимальной ширины
        errorContainer.style.width = "40%";
        errorContainer.style.textAlign = "left";
            
        let closeButton = document.createElement("span");
        closeButton.innerHTML = "&times;";
        closeButton.style.cursor = "pointer";
        closeButton.style.float = "right";
        closeButton.style.fontSize = "16px";
        closeButton.style.marginLeft = "10px";
        closeButton.onclick = function () {
            errorContainer.remove();
        };

        let ul = document.createElement("ul");
        ul.id = "error-list";
        ul.style.margin = "0";
        ul.style.padding = "0";
        ul.style.listStyleType = "none";

        errorContainer.appendChild(closeButton);
        errorContainer.appendChild(ul);
        document.body.appendChild(errorContainer);
    }

    console.log("Error displayed : [")
    console.error(error);
    console.log("]")

    let message;
    if (typeof error === "string")
        message = error;
    else if (error.code === "ERR_NETWORK" && error.name === "AxiosError"
        // && error.response && error.response.status === 401
    ) {
        message = "Session expired or network error<br>Try to relogin";
    } else if (error.code === "ERR_BAD_RESPONSE" && error.name === "AxiosError"
        && error.response && error.response.status === 500
        && error.response.data
    ) {
        message = error.response.data.replaceAll("\n", "<br>");
    } else if (error.message && error.message === "Empty lambdaCall result") {
        return;
    } else if (error.message) {
        message = "err: " + error.message;
    } else {
        message = error;
    }

    let errorList = document.getElementById("error-list");
    let li = document.createElement("li");
    li.innerHTML = "<small>&#9654;</small> " + message;
    errorList.appendChild(li);
}
window.showError = showError;


// OnLoad

function inputValue(id, val = null, isInt = false){
    const el = document.getElementById(id);

    if (val != null){
        el.value = val;
    }

    if(isInt)
        val = parseInt(el.value)
    else
        val = parseFloat(el.value)
    
    return val;
}
window.inputValue = inputValue


window.onload = function () {
    // const colNumEl = document.getElementById('csv-column');
    // colNumEl.value = 1;
    inputValue('csv-column', 1);

    vesselOnLoad();
    cognitoOnLoad();
    fibboRenderTable();

    loaded();
};
