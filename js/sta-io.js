stateTagApp["commands"] = {
    prepareNextLevel: function (){
        let coins = stateTagApp.$read('coins');
        let bank = stateTagApp.$read('bank');
        let level = stateTagApp.$read('level');

        bank += coins;
        level++;

        stateTagApp.$write('bank', bank);
        stateTagApp.$write('coins', 0);
        stateTagApp.$write('level', level);
    },

    showBank: function (){
        stateTagApp.alert({
            title: 'Longterm Savings',
            html: ' <span class="token coin small spin continuous"></span>'
                .concat('<br/>')
                .concat(stateTagApp.$read('bank'))
        })
    },

    setEventContext: function (context) {
        stateTagApp.$write('sta.context', context);
        return stateTagApp.$read('sta.context');
    },

    getEventContext: function () {
        return stateTagApp.$read('sta.context');
    },

    getLevel: function () {
        let level = stateTagApp.$read('level');
        level = 'levels.'.concat(level);

        return {...stateTagApp.$read(level)};
    },

    clear: function () {
        stateTagApp.$execute('resetState')
    },

    reset: function () {
        stateTagApp.$execute('resetApp')
    },

    recordMismatch: function (diff){
        let coins = stateTagApp.$read('coins');
        coins -= diff;
        stateTagApp.$write('coins', coins);
        stateTagApp.$write('events', 'recorded.miss');
    },

    recordMiss: function (number) {
        if(stateTagApp.$read('pause')){
            return;
        }

        let coins = stateTagApp.$read('coins');
        coins -= number;
        stateTagApp.$write('coins', coins);
        stateTagApp.$write('events', 'recorded.miss');
    },

    recordHit: function (number) {
        let coins = stateTagApp.$read('coins');
        coins += number;
        stateTagApp.$write('coins', coins);
        stateTagApp.$write('events', 'recorded.hit');
    },

    findNumbersForNumber: function (number) {
        try {
            let numbers = Object.values(stateTagApp.$read('targets'));
            this.hackSubsetSum(numbers, number);
        } catch (e) {
            //success
            return JSON.parse(e);
        }
        return [];
    },

    findUuidsForNumbers(numbers) {
        let uuids = [];
        let targets = {...stateTagApp.$read('targets')};
        for (let n of numbers) {
            let uuid = Object.keys(targets).find(k => targets[k] === n);
            uuids.push(uuid);
            delete targets[uuid];
        }

        return uuids;
    },

    hackSubsetSum: function (numbers, target, partial = [], sum = 0) {
        if (sum < target) {
            numbers.forEach(
                (num, i) => {
                    this.hackSubsetSum(numbers.slice(i + 1), target, partial.concat([num]), sum + num);
                }
            );
        } else if (sum == target) {
            //console.log('sum(%s) = %s', partial.join(), target);
            //return partial;
            throw JSON.stringify(partial);
        }
    },

    fire: function (number) {

        number = number || stateTagApp.$read('sta.numberpad') * 1 || 0;

        let numbers = this.findNumbersForNumber(number);
        let uuids = this.findUuidsForNumbers(numbers);

        stateTagApp.$broadcast({
            type: 'game',
            from: 'fire',
            event: 'weapon.fire',
            uuids
        });
    }
};

function receiveStateTagAppBroadcast(message) {
    let staMessage;
    try {
        staMessage = JSON.parse(message.data);
    } catch (e) {
        return;
    }
    if (_.isUndefined(staMessage.app) || staMessage.app != 'stateTagApp'.concat(':').concat(stateTagApp.namespace)) {
        return;
    }
    if (stateTagApp.env == 'development') {
        stateTagApp.log(staMessage);
    }

    /**
     * HANDLERS: You can respond to stateTagApp events here.
     */
    let eventHandlerFunctionName = parseEventToFunctionName(staMessage.event);

    try {
        window[eventHandlerFunctionName](staMessage);
    } catch (e) {
        if (stateTagApp.env == 'development') {
            console.log(e);
            console.log('===== STA: ', staMessage.event, ' =======');
            console.log('NO HANlDER FOUND', staMessage);
        }
    }
}

function parseEventToFunctionName(event) {
    if (_.includes(event, '.')) {
        let parts = event.split('.');
        parts[0] = _.capitalize(parts[0]);

        return parts
            .reverse()
            .join('');
    }

    return event;
}

stateTagApp["$broadcast"] = function (data) {
    let desired = ['app', 'type', 'from', 'event'];
    let required = [];

    data['app'] = 'stateTagApp'.concat(':').concat(stateTagApp.namespace);

    if (!_.isNull(stateTagApp.$read('sta.context'))) {
        data['context'] = stateTagApp.$read('sta.context');
    }

    staValidateStaEvent(data, desired, console.log);
    if (staValidateStaEvent(data, required, function (msg) {
        alert(msg);
    })) {
        window.parent.postMessage(JSON.stringify(data), '*');
    }

    stateTagApp.$write('events', data.event);
}

function staValidateStaEvent(data, spec, onFailCallback) {

    for (let r of spec) {
        if (_.isEmpty(data[r]) && !_.isNumber(data[r])) {
            let msg = 'Missing staMessage element: '
                .concat(r)
                .concat(' in ')
                .concat(JSON.stringify(data));

            if (_.isFunction(onFailCallback)) {
                onFailCallback(msg);
            }

            return false;
        }
    }

    return true;
}

function staBindEvent(element, eventName, eventHandler) {
    if (element.addEventListener) {
        element.addEventListener(eventName, eventHandler, false);
    } else if (element.attachEvent) {
        element.attachEvent("on" + eventName, eventHandler);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    staBindEvent(window, "message", receiveStateTagAppBroadcast);
});