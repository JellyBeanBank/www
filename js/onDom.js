document.addEventListener("DOMContentLoaded", function () {
    feather.replace();
    initCanvas();
    initSparkles();

    stateTagApp.$write('pause', false);
});

window.addEventListener(
    'resize', function (){
    adjustCanvasSize();
});

