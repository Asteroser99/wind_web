function changeImage(id, filename) {
    const imgElement = document.getElementById(id);
    if (imgElement && imgElement.tagName === "IMG") {
        imgElement.src = "./img/" + filename;
    }
}
window.changeImage = changeImage

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
        // save initial position
        if (!fileElement.dataset.originalParent) {
            fileElement.dataset.originalParent = fileElement.parentElement.id;
        }
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



export async function openTab(tabId) {
    if (!tabId) tabId = "vessel";
    await storageSet("page", tabId);

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
    else if (error.code === "ERR_NETWORK" && error.name === "AxiosError") {
        message = "Please sign in";
    } else if (error.code === "ERR_BAD_REQUEST" && error.name === "AxiosError"
        && error.response && error.response.status === 401
    ) {
        message = "Please subscribe to use the calculation functions";
    } else if (error.name === "AxiosError"
        && error.response && error.response.status != 200
        && error.response.data
    ) {
        message = error.response.data.replaceAll("\n", "<br>");
    } else if (error.message && error.message === "Lambda call failed") {
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
        button.onclick = (event) => {
            window.funcButtonFunction  = event.currentTarget.dataset.function;
            window.funcButtonParameter = event.currentTarget.dataset.parameter;
            window.funcButtonQuery     = event.currentTarget.dataset.query;
            
            if (window.funcButtonQuery){
                document.getElementById('modal-text').innerHTML = window.funcButtonQuery;
                document.getElementById('modal-overlay').style.display = 'block';
                
                const needsAnswer = window.funcButtonFunction != undefined;
                document.getElementById('questionYes'  ).style.display =  needsAnswer ? 'block' : 'none';
                document.getElementById('questionNo'   ).style.display =  needsAnswer ? 'block' : 'none';
                document.getElementById('questionOk'   ).style.display = !needsAnswer ? 'block' : 'none';
                // console.log(document.getElementById('questionOk').style.display)

                funcButtonInit();
            } else {
                executeFunction();
            }
        };
    });
}
window.funcButtonInit = funcButtonInit;

document.getElementById('questionYes'  ).addEventListener( 'click', () => { closeModal(); executeFunction(); });
document.getElementById('questionNo'   ).addEventListener( 'click', () => { closeModal(); });
document.getElementById('questionOk'   ).addEventListener( 'click', () => { closeModal(); });
document.getElementById('modal-overlay').addEventListener( 'click', () => { closeModal(); });
document.getElementById('modal-text'   ).addEventListener( 'click', (event) => { event.stopPropagation(); });
document.getElementById('modal'        ).addEventListener( 'click', (event) => { event.stopPropagation(); });

function executeFunction() {
    if (!window.funcButtonFunction) {
        
    } else if (typeof window[window.funcButtonFunction] === 'function') {
        window[window.funcButtonFunction](window.funcButtonParameter);
    } else {
        showError('Function ' + window.funcButtonFunction + ' is not found');
    }
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

function toggleHelp(toggle, interactive){
    if (!interactive) return;

    const helpOverlay = document.getElementById("help-container");
    helpOverlay.style.display = !toggle ? "none" : "flex";

    document.getElementById("file-container"   ).style.display = toggle ? "none" : "flex";
    document.getElementById("actions-container").style.display = toggle ? "none" : "flex";
    document.getElementById("animateControls"  ).style.display = toggle ? "none" : "flex";

    document.querySelectorAll('.toggle-help').forEach(el => {
        if (toggle) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });    
}
window.toggleHelp = toggleHelp

async function toggleEquidistanta(toggled, interactive){
    window.equidistantaShow = toggled

    if (interactive) await animateVisibilities();
}
window.toggleEquidistanta = toggleEquidistanta

async function toggleMandrel(toggled, interactive){
    window.mandrelShow = toggled;
    if (interactive) await animateVisibilities();
}
window.toggleMandrel = toggleMandrel

async function toggleLine(toggled, interactive){
    window.lineShow = toggled;
    if (interactive) await animateVisibilities();
}
window.toggleLine = toggleLine

async function toggleTape(toggled, interactive){
    window.tapeShow = toggled;
    if (interactive) await animateVisibilities();
}
window.toggleTape = toggleTape


// inputField

async function inputFieldSet(owner, id, value){
    if (owner == "vessel") {
        await storageSet(id, value);
    } else if (owner == "layer") {
        await fieldSet(id, value);
    }
}
window.inputFieldSet = inputFieldSet

async function inputFieldGet(owner, id){
    if (owner == "vessel") {
        return await storageGet(id);
    } else if (owner == "layer") {
        return await fieldGet(id);
    }
}

async function inputFieldInit(){

    function inputGetValue(input){
        let val = input.value;
        if (input.type === "number") {
            val = parseFloat(val);
        } else if (input.type === "checkbox") {
            val = input.checked;
        } else {
            val = input.value;
        }
        return val;
    }

    const inputs = document.querySelectorAll(".inputField");
    for (const input of inputs) {
        const id = input.id;
    
        input.onkeydown = (event) => {
            if (event.key === " ") {
                event.stopPropagation();
            }
        };
        
        const owner = input.dataset.owner;
        const listener = input.type === "checkbox" ? "click" : "input";
        if (listener === "input")
            input.oninput  = inputOnChange;
        else 
            input.onchange = inputOnChange;
        ;
        // input.addEventListener(listener, async () => {
        //     const value = inputGetValue(input);
        //     // console.log("field set", id, await fieldGet(id), "->", value);
        //     await inputFieldSet(owner, id, value);
        // });
    
        async function inputOnChange(event){
            const value = inputGetValue(input);
            // console.log("field set", id, await fieldGet(id), "->", value);
            await inputFieldSet(owner, id, value);
            if (id == "LayerName") await layersRenderTable();
        }

        const storedValue = await inputFieldGet(owner, id);
    
        if (storedValue !== undefined && storedValue !== null) {
            // console.log("val to form", id, inputValue(input), "->", storedValue);
            if (input.type === "checkbox") {
                input.checked = storedValue;
            } else {
                input.value = storedValue;
            }
        } else {
            const initialValue = inputGetValue(input);
            // console.log("form to val", id, storedValue, initialValue);
            await inputFieldSet(owner, id, initialValue);
        }
    };

    // const input = document.querySelector("#LayerName");
    // input.oninput = async (event) => {
    //     await inputOnChange(event);
    //     await layersRenderTable();
    // };
}
window.inputFieldInit = inputFieldInit

async function inputFieldValue(id, value) {
    const input = document.getElementById(id);
    if (input) {
        input.value = value;
        await fieldSet(id, value);
    }
}
window.inputFieldValue = inputFieldValue;

function InitGoToWork(){
    const button = document.getElementById("begin-to-work-button");
    button.onclick = (event) => {
        handleToggleButtonClick(event.currentTarget);
    };
    button.classList.add('active');

    funcButtonInit();
}

function handleToggleButtonClick(button) {
    let active = button.classList.contains('active');

    active = !active;

    if (active) {
        button.classList.add('active');
    } else {
        button.classList.remove('active');
    }

    const func  = button.dataset.function;
    // const param = button.dataset.parameter;
    if (typeof window[func] === 'function') {
        window[func](active, true);
    }
}

function toggleButtonInit(){
    document.querySelectorAll('.toggle-button').forEach(button => {
        button.onclick = (event) => {
        // button.addEventListener('click', (event) => {
            handleToggleButtonClick(event.currentTarget);
        };

        const active = button.classList.contains('active')
        const func = button.dataset.function;
        window[func](active, false);
    });
}

function loadContent(path, id, runAfter = undefined){
    fetch("txt/" + path + ".html")
        .then(response => response.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
            if (typeof runAfter === 'function') {
                runAfter();
            }
        })
        .catch(error => console.error("loading error:", error));
}
window.loadContent = loadContent


// OnLoad

async function windowOnLoad(){
    loadContent("impressum", "impressum-text");
    loadContent("vessel"   , "help-vessel", InitGoToWork);
    loadContent("mandrel"  , "help-mandrel");
    loadContent("coil"     , "help-coil");
    loadContent("patterns" , "help-patterns");
    loadContent("winding"  , "help-winding");
    loadContent("thickness", "help-thickness");

    funcButtonInit();
    toggleButtonInit();
}

window.onload = async function () {
    await storageOnLoad();
    await windowOnLoad();
    await threeOnLoad();
    await vesselOnLoad();
    await cognitoOnLoad();

    await openTab(await storageGet("page"))
    await vesselActualise()

    await patternsOnLoad();
    await animateOnLoad();
    
    loaded();
};
