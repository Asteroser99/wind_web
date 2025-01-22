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
  
export function openTab(event, tabId) {
    let hideIt = false;
    const activeTab  = document.querySelector('.tab-content.active');
    const activeTabs = document.querySelector('.tabs-content.active');
    if (activeTab.id == tabId && activeTabs) {
        hideIt = true
    }
    if(tabId == "tab4"){
        hideIt = true
    }

    const tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach(link => link.classList.remove('active'));

    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');

    let contentId = "static-2d"
    if (tabId == "tab3"){
        contentId = "static-3d"
    } else if  (tabId == "tab4"){
        contentId = "static-text"
    }

    document.getElementById("tabs-content").classList.remove('active');
    if(!hideIt){
        document.getElementById("tabs-content").classList.add('active');
    }
    
    const staticContents = document.querySelectorAll('.static-content');
    staticContents.forEach(tab => tab.classList.remove('active'));
    if (contentId != "") {
        document.getElementById(contentId).classList.add('active');
    }
}
window.openTab = openTab;
