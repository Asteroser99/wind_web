let animateSlider = document.getElementById("animateSlider");
animateSlider.addEventListener("input", () => window.angle = parseFloat(animateSlider.value));

const animateButton = document.getElementById("animateButton");
animateButton.addEventListener("click", () => {
    window.animateAuto = !window.animateAuto;
    animateButton.classList.toggle("active", window.animateAuto);
});


function animateOnLoad(){
    window.animateAuto = false;
    window.angle = 0;

    // window.angle += 0.01;
    // animateSlider.value = window.angle;
    // if (window.animateAuto) {
    //     requestAnimationFrame(animateOnLoad);
    // }
    
}
window.animateOnLoad = animateOnLoad
