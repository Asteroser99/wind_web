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


window.onload = function () {
    vesselOnLoad();
    cognitoOnLoad();
    loaded();
};
