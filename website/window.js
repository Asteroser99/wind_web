// function loadJS(module, OnLoad = null){
//     const script = document.createElement('script');
//     script.src = module;
//     script.type = 'text/javascript';
//     script.async = false;

//     if(OnLoad){
//         script.onload = () => {
//             OnLoad()
//         };
//     }

//     script.onerror = () => {
//         console.error('Error loading ' + module);
//     };

//     document.head.appendChild(script);
// }
// window.loadJS = loadJS;

function loading(){
    document.getElementById('progress-container').style.display = '';
}
window.loading = loading
  
function loaded(){
    document.getElementById('progress-container').style.display = 'none';
}
window.loaded = loaded
  
loading()

  
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

    let contentId = "static-3d";
    if (tabId == "tab1" || tabId == "tab2") {
        contentId = "static-2d";
    } else if (tabId == "tab4") {
        hideIt = true;
        contentId = "static-text";
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
    if (contentId == "static-3d") {
        resizeScene();
    }
}
window.openTab = openTab;




const valueX = document.getElementById('value-x');
const valueY = document.getElementById('value-y');
const valueZ = document.getElementById('value-z');

const inputX = document.getElementById('input-x');
const inputY = document.getElementById('input-y');
const inputZ = document.getElementById('input-z');

const modal = document.getElementById('edit-modal');
const overlay = document.getElementById('modal-overlay');

const editButton = document.getElementById('edit-button');
editButton.addEventListener('click', () => {
    inputX.value = valueX.textContent;
    inputY.value = valueY.textContent;
    inputZ.value = valueZ.textContent;

    modal.style.display = 'block';
    overlay.style.display = 'block';
});

const saveButton = document.getElementById('save-button');
saveButton.addEventListener('click', () => {
    valueX.textContent = inputX.value;
    valueY.textContent = inputY.value;
    valueZ.textContent = inputZ.value;
    
    modal.style.display = 'none';
    overlay.style.display = 'none';
});

const cancelButton = document.getElementById('cancel-button');
cancelButton.addEventListener('click', () => {
    modal.style.display = 'none';
    overlay.style.display = 'none';
});

overlay.addEventListener('click', () => {
    modal.style.display = 'none';
    overlay.style.display = 'none';
});

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
