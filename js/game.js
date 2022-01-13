// https://www.zapsplat.com/?s=zap
var audio = {
    launchNumber: new Audio('/media/launchNumber.mp3'),
    fireWeapon: new Audio('/media/fireWeapon.mp3'),
    explosion: new Audio('/media/explosion.mp3'),
};

audio.fireWeapon.volume = 0.3;
audio.fireWeapon.playbackRate = 1.5;

//https://speckyboy.com/explosions-in-web-design/
var canvas, target, ctx, lt, draw, points = [];

function initCanvas() {
    canvas = document.getElementById("board");
    ctx = canvas.getContext("2d");

    //set canvas size
    adjustCanvasSize();

    //control box events
    var props = document.querySelectorAll("#controlBox input");
    props.forEach(prp => {
        prp.onchange = buidLighter;
    })
    buidLighter();
    window.requestAnimationFrame(Animate);
}

function adjustCanvasSize() {
    var size = {
        width: document.getElementById('lightningBoard').offsetWidth,
        height: document.getElementById('lightningBoard').offsetHeight
    };
    canvas.width = size.width;
    canvas.height = size.height;

    //Lighning sources
    points.splice(0, points.length);
    points.push(new Vector(size.width, size.height, size.width, size.height));
    points.push(new Vector(0, size.height, 0, size.height));
}

function buidLighter() {
    var opt = {};
    var props = document.querySelectorAll("#controlBox input");
    //Build lighning config
    props.forEach(prp => {
        var setter = prp.dataset.opt;
        opt[setter] = prp.value;
    })
    lt = new Lightning(opt);
}

function setProp(config, prop) {
    config[prop] = document.getElementById(prop).value;
}

function Animate() {
    //Clear board
    ctx.shadowBlur = 0;
    ctx.shadowColor = null;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (draw) {
        points.forEach(p => {
            lt.Cast(ctx, p, target);
        });
    }

    setTimeout(() => {
        this.Animate();
    }, 60);
}

function getCoordsForUuid(uuid) {
    let element = document.getElementById(uuid);
    let canvas = document.getElementById('board');

    if (element == undefined) {
        return false;
    }

    let position = {
        uuid,
        x: element.offsetLeft + (element.offsetWidth / 2),
        y: element.offsetTop + element.offsetHeight - canvas.offsetTop,
    };

    return position;
}

function abortWeapon(partialBroadcastable) {
    switch (partialBroadcastable.event) {
        case 'input.mismatch':

            stateTagApp.alert({
                title: 'INPUT MISMATCH',
                html: '<span style="font-size: 2em;">-'
                    .concat(partialBroadcastable.diff)
                    .concat('</span>')
                    .concat(' <span class="token coin small spin continuous"></span>'),
                timer: 2000,
                timerProgressBar: true,
                didOpen: () => {
                    stateTagApp.Vue.swal.showLoading();
                },
                willClose: () => {
                }
            }).then((result) => {
                if (result.dismiss === stateTagApp.Vue.swal.DismissReason.timer) {
                    stateTagApp.commands.recordMismatch(partialBroadcastable.diff);
                }
            });

            break;
    }
}

function fireWeapon(staMessage) {
    let leftInput = stateTagApp.storage.getters.tally();
    let rightInput = stateTagApp.$read('numberPad') * 1;

    if (leftInput != rightInput) {
        abortWeapon({
            event: 'input.mismatch',
            diff: Math.abs((leftInput - rightInput))
        });
        return;
    }

    if (staMessage.uuids.length == 0) {
        abortWeapon({event: 'input.incorrect'});
        return;
    }

    let uuids = staMessage.uuids;

    let i = 0,
        speed = 500,
        intervalId = setInterval(() => {
            let position = getCoordsForUuid(uuids[i]);

            if (Boolean(position)) {
                draw = true;
                target = new Vector(0, 0, position.x, position.y);

                let uuid = ''.concat(uuids[i]);
                var element = document.getElementById(uuid);
                let targets = stateTagApp.$read('targets');
                let number = targets[uuid];
                delete targets[uuid];

                audio.fireWeapon.play();

                setTimeout(() => {
                    try {
                        stateTagApp.commands.recordHit(number);
                        var element = document.getElementById(uuid);

                        addSparkles(Math.random() * 500 + 200 | 0, element.offsetLeft, element.offsetTop, 1);

                        audio.explosion.play();

                        element.remove();
                        draw = false;
                    } catch (e) {
                        console.log('too slow');
                    }
                }, Math.round(speed * 0.75));
            }

            i++;
            if (typeof uuids[i] == 'undefined') {
                clearInterval(intervalId);
            }
        }, speed);

}

function launchNumber(number) {
    let uuid = stateTagApp.uuid();
    let speed = stateTagApp.$read('speed');
    let size = ''.concat(number).length;
    size = ''.concat(size)
        .concat('.')
        .concat(Math.round(number));

    let div = document.createElement("div", "");
    let color = Math.floor(Math.random() * 5)
    div.className = 'target c'.concat(color)
        .concat(' speed').concat(speed);
    div.style.fontSize = ''.concat(size)
        .concat('vw');

    let start = 5, end = 70;
    let position = Math.floor(Math.random() * (end - start) + start);
    div.style.left = ''.concat(position).concat('%');

    div.appendChild(document.createTextNode(number.toLocaleString('en')));
    audio.launchNumber.play();

    //track element
    div.setAttribute('id', uuid);
    div.setAttribute('data-number', number);

    document.body.appendChild(div);
    let targets = stateTagApp.$read('targets');
    targets[uuid] = number;

    //try to destroy & lose points
    setTimeout(() => {
        var element = document.getElementById(uuid);
        if (element !== undefined) {
            try {
                delete targets[uuid];
                element.remove();
                stateTagApp.commands.recordMiss(number);
            } catch (e) {
            }
        }
    }, 1000 * speed);

}

function queNumbers() {
    let level = stateTagApp.commands.getLevel();

    do {
        let number = Math.round(Math.random() * (level.range.max - level.range.min) + level.range.min);
        setTimeout(()=>{
            launchNumber(number);

        }, 200);
    } while (--level.targets);
}

function removeTargets(staMessage){
    let targets = stateTagApp.$read('targets');

    for(let id in targets){
        let element = document.getElementById(id);
        element.remove();
        delete targets[id];
    }
}

function survivedGame(staMessage) {
    removeTargets();

    stateTagApp.commands.prepareNextLevel();

    stateTagApp.alert({
        title: 'EPIC WIN!!',
        html: "<span style='font-size: 2em;'>"
            .concat("You've banked ")
            .concat(staMessage.coins)
            .concat('</span>')
            .concat(' <span class="token coin small spin continuous"></span>'),
        didClose: function () {
            newGame({});
        }
    });
}

function pauseGame(staMessage) {
    removeTargets();

    stateTagApp.alert({
        title: 'PAUSED',
        html: "<p>Currently falling targets will not be deducted." +
            "<br/>The next targets are paused." +
            "</p>",
        confirmButtonText: 'Continue Playing',
        didClose: function () {
            stateTagApp.$write('pause', false);
        }
    });
}

function lostGame(staMessage) {
    removeTargets();

    stateTagApp.alert({
        title: 'GAME OVER',
        html: '<span style="font-size: 2em;">0 '
            .concat('</span>')
            .concat(' <span class="token coin small spin continuous"></span>')
    });

}

function newGame(staMessage) {

    stateTagApp.alert({
        title: 'Be Ready!',
        html: 'Starting in <b></b> milliseconds.',
        timer: 4000,
        timerProgressBar: true,
        didOpen: () => {
            stateTagApp.Vue.swal.showLoading()
            const b = stateTagApp.Vue.swal.getHtmlContainer().querySelector('b')
            timerInterval = setInterval(() => {
                b.textContent = stateTagApp.Vue.swal.getTimerLeft()
            }, 100)
        },
        willClose: () => {
            clearInterval(timerInterval)
        }
    }).then((result) => {
        if (result.dismiss === stateTagApp.Vue.swal.DismissReason.timer) {
            let duration = stateTagApp.$read('duration');
            stateTagApp.$write('timer', duration * 60);
            stateTagApp.$write('pause', false);
        }
    })
}

//tick game loop
function initGameLoop(){
    setInterval(() => {
        let paused = stateTagApp.$read('pause');
        let timer = stateTagApp.$read('timer');
        let targets = stateTagApp.$read('targets');

        if (!paused && timer) {
            timer--;
            stateTagApp.$write('timer', timer - 1);

            if (!timer) {
                stateTagApp.$write('paused', true);
                return;
            }

            if (_.isEmpty(targets)) {
                queNumbers();
            }
        }
    }, 1000);

}
