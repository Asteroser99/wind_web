// let animateSlider = document.getElementById("animateSlider");
// animateSlider.addEventListener("input", () => window.animateAngle = parseFloat(animateSlider.value));

const animateButton = document.getElementById("animateButton");
animateButton.addEventListener("click", () => {
    window.animateAuto = !window.animateAuto;
    animateButton.classList.toggle("active", window.animateAuto);
});

document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        event.preventDefault(); // Чтобы страница не прокручивалась
        animateButton.click();
    }
});


function animateOnLoad(){
    window.animateAuto = false;
    window.animateAngle = 0;

    const buttons = document.querySelectorAll(".mode-button");
    buttons.forEach(button => {
        button.addEventListener("click", () => {
            buttons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            setField("windingMode", button.getAttribute("data-mode"));
            coilDraws();
        });
    });

    // window.animateAngle += 0.01;
    // animateSlider.value = window.animateAngle;
    // if (window.animateAuto) {
    //     requestAnimationFrame(animateOnLoad);
    // }
    
}
window.animateOnLoad = animateOnLoad
