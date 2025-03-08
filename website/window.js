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



//
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
        document.getElementById("mandrel-csvColumn").appendChild(document.getElementById("div-csvColumn"));
    } else if (tabId == "coil") {
        hideIt = true;
    } else if (tabId == "winding") {
        hideIt = true;
    } else if (tabId == "patterns") {
        contentId = "patterns-canvas-div";
        hideIt = true;
    } else if (tabId == "thickness" ) {
        hideIt = true;
        contentId = "mandrel-canvas-div";
        document.getElementById("thickness-csvColumn").appendChild(document.getElementById("div-csvColumn"));
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


// funcButton

function funcButtonInit(){
    document.querySelectorAll('.function-button').forEach(button => {
        button.addEventListener('click', (event) => {
            window.funcButtonFunction  = event.currentTarget.dataset.function;
            window.funcButtonParameter = event.currentTarget.dataset.parameter;
            window.funcButtonQuery     = event.currentTarget.dataset.query;
            
            if (window.funcButtonQuery){
                document.getElementById('modal-text').innerText = window.funcButtonQuery;
                document.getElementById('modal-overlay').style.display = 'block';
            } else {
                executeFunction();
            }
        });
    });
}

document.getElementById('questionYes'  ).addEventListener( 'click', () => { executeFunction(); });
document.getElementById('questionNo'   ).addEventListener( 'click', () => { closeModal(); });
document.getElementById('modal-overlay').addEventListener( 'click', () => { closeModal(); });
document.getElementById('modal'        ).addEventListener( 'click', (event) => { event.stopPropagation(); });

function executeFunction() {
    closeModal();
    if (typeof window[window.funcButtonFunction] === 'function') {
        window[window.funcButtonFunction](window.funcButtonParameter);
    } else {
        showError('Function ' + window.funcButtonFunction + ' is not found');
    }
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

function toggleHelp(toggled){
    const helpOverlay = document.getElementById("help-container");
    helpOverlay.style.display = !toggled ? "none" : "flex";
    document.getElementById("file-container"   ).style.display = toggled ? "none" : "flex";
    document.getElementById("actions-container").style.display = toggled ? "none" : "flex";
    if (toggled)
        document.getElementById("helpCloseButton").classList.add('active');
    else 
        document.getElementById("helpToggle").classList.remove('active');
}
window.toggleHelp = toggleHelp

function toggleEquidistanta(toggled){
    window.equidistantaShow = toggled
}
window.toggleEquidistanta = toggleEquidistanta


// Init

function inputFieldInit(){
    document.querySelectorAll(".inputField").forEach(input => {
        const id = input.id;
        input.addEventListener("input", () => setField(id, parseFloat(input.value)));

        const value = getField(id)

        if(value)
            input.value = value;
        else
            setField(id, parseFloat(input.value))
    });
}
window.inputFieldInit = inputFieldInit

function inputFieldSet(id, value) {
    const input = document.getElementById(id);
    if (input) {
        input.value = value;
        setField(id, value);
    }
}
window.inputFieldSet = inputFieldSet;

function toggleButtonInit(){
    document.querySelectorAll('.toggleButton').forEach(button => {
        button.addEventListener('click', (event) => {
            const button = event.currentTarget
            let active = button.classList.contains('active')

            active = !active
            if (active) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }

            const func = button.dataset.function;
            window[func](active);
        });

        const active = button.classList.contains('active')
        const func = button.dataset.function;
        window[func](active);
    });
}


// OnLoad

function windowOnLoad(){
    inputFieldInit();
    funcButtonInit();
    toggleButtonInit();
}

window.onload = function () {
    windowOnLoad();
    threeOnLoad();
    vesselOnLoad();
    cognitoOnLoad();
    patternsOnLoad();
    animateOnLoad();

    openTab(getField("page"))

    loaded();
};
