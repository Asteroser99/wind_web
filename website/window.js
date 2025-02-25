function changeImage(id, filename) {
    const imgElement = document.getElementById(id);
    if (imgElement && imgElement.tagName === "IMG") {
        imgElement.src = "./img/" + filename;
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

function moveButtons(prefix, tabId) {
    const fileContainer = document.getElementById(prefix + "-container");
    const files = Array.from(fileContainer.children);

    files.forEach(file => {
        const originalParentId = file.dataset.originalParent;
        if (originalParentId) {
            const originalParent = document.getElementById(originalParentId);
            if (originalParent) {
                originalParent.appendChild(file);
            }
        }
    });

    const fileId = `${prefix}-${tabId}`;
    const fileElement = document.getElementById(fileId);

    if (fileElement) {
        // Сохраняем исходное местоположение
        if (!fileElement.dataset.originalParent) {
            fileElement.dataset.originalParent = fileElement.parentElement.id;
        }
        
        // Перемещаем элемент
        fileContainer.appendChild(fileElement);
    }
}

export function openTab(tabId) {
    if (!tabId) return;
    setField("page", tabId);

    let hideIt = false;
    const activeTab  = document.querySelector('.tab-content.active' );
    const activeTabs = document.querySelector('.tabs-content.active');

    if (activeTab && activeTab.id == "tab-" + tabId && activeTabs) hideIt = true;

    document.getElementById("button-vessel").classList.remove("active");
    document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    document.getElementById("button-" + tabId).classList.add('active');
    document.getElementById("tab-"    + tabId).classList.add('active');

    let contentId = "scene-canvas-div";
    if        (tabId == "vessel" ) {
        hideIt = true;
    } else if (tabId == "mandrel" ) {
        hideIt = true;
        contentId = "mandrel-canvas-div";
    } else if (tabId == "coil") {
        hideIt = true;
    } else if (tabId == "winding") {
        hideIt = true;
    } else if (tabId == "patterns") {
        contentId = "patterns-canvas-div";
        hideIt = true;
    // } else if (tabId == "info"    ) {
    //     hideIt = true;
    //     contentId = "info-canvas-div";
    }
    
    document.getElementById("tabs-content").classList.toggle('active', !hideIt);

    document.querySelectorAll('.static-content').forEach(tab => tab.classList.remove('active'));

    if (contentId != "") {
        document.getElementById(contentId).classList.add('active');
    }


    moveButtons("file"   , tabId);
    moveButtons("actions", tabId);
    moveButtons("help"   , tabId);


    // thumbnail
    const thumbnail = document.getElementById("scene-thumbnail-container");
    if (contentId == "scene-canvas-div") {
        thumbnail.style.display = "none";
        document.getElementById("scene-canvas-div").appendChild(document.getElementById("scene-canvas"));
    } else {
        thumbnail.style.display = "block";
        thumbnail.appendChild(document.getElementById("scene-canvas"));
    }

    if (contentId == "patterns-canvas-div") resizePattern();

    resizeScene();
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
            
        let closeButton = document.createElement("span");
        closeButton.innerHTML = "&times;";
        closeButton.id = "error-close-button";
        closeButton.onclick = function () {
            errorContainer.remove();
        };

        let ul = document.createElement("ul");
        ul.id = "error-list";

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
    } else if (error.name === "AxiosError" // error.code === "ERR_BAD_RESPONSE" && 
        && error.response && error.response.status != 200
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

function windowOnLoad(){
    // const colNumEl = document.getElementById('csv-column');
    // colNumEl.value = 1;
    inputValue('csv-column', 1);


    const helpOverlay = document.getElementById("help-container");
    helpOverlay.style.display = "none"
    function toggleHelp() {
        const helpIsOpen = helpOverlay.style.display === "flex"
        helpOverlay.style.display = helpIsOpen ? "none" : "flex";
        document.getElementById("file-container"   ).style.display = helpIsOpen ? "flex" : "none";
        document.getElementById("actions-container").style.display = helpIsOpen ? "flex" : "none";
    }

    const toggleButton = document.getElementById("toggle-help");
    toggleButton.addEventListener("click", toggleHelp);

    const closeButton = document.getElementById("close-help");
    closeButton.addEventListener("click", toggleHelp);

}


window.onload = function () {
    windowOnLoad();
    vesselOnLoad();
    cognitoOnLoad();
    patternsOnLoad();
    animateOnLoad();

    openTab(getField("page"))

    loaded();
};
