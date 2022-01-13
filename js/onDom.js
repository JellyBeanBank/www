document.addEventListener("DOMContentLoaded", function () {
    feather.replace();
    initCanvas();
    initSparkles();

    stateTagApp.$write('pause', false);

    initGameLoop();
});

window.addEventListener(
    'resize', function (){
    adjustCanvasSize();
});