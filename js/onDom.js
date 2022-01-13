document.addEventListener("DOMContentLoaded", function () {
    feather.replace();
    initCanvas();
    initSparkles();


    initGameLoop();
});

window.addEventListener(
    'resize', function (){
    adjustCanvasSize();
});