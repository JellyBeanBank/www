stateTagApp['state'] = {
    sta: {}, //required & reserved

    bank: 0,
    coins: 0,
    bank: 0,

    speed: 30, //seconds min: 5
    duration: 1, //minutes min: 1
    pause: true,
    timer: 0,
    events: null,

    targets: {},
    level: 1,
    levels: [
        {/* ZERO HACK*/},
        {obfuscate: false, targets: 1, range: {min: 1, max: 10 - 1}},
        {obfuscate: false, targets: 1, range: {min: 10, max: 100 - 1}},
        {obfuscate: false, targets: 1, range: {min: 100, max: 100000 - 1}},

        {obfuscate: true, targets: 1, range: {min: 1, max: 10 - 1}},
        {obfuscate: true, targets: 1, range: {min: 10, max: 100 - 1}},
        {obfuscate: true, targets: 1, range: {min: 100, max: 100000 - 1}},

        {obfuscate: true, targets: 2, range: {min: 1, max: 10 - 1}},
        {obfuscate: true, targets: 2, range: {min: 10, max: 100 - 1}},
        {obfuscate: true, targets: 2, range: {min: 100, max: 100000 - 1}},
    ],

    abacus: {
        upper: [],
        bar: 0,
        lower: []
    },

    numberPad: '',

    prefs: {
        abacus: {
            upperRod: [0],
            lowerRod: [0, 1, 2, 3]
        }
    },

    rolex: null
};

function initGlobalStateWatchers(stateObserver) {
    // stateObserver.watch(
    //     function (state) {
    //         return state.event;
    //     },
    //     function (fresh, stale) {
    //         if(_.isNull(fresh)){
    //             return;
    //         }
    //
    //         switch (fresh){
    //             case 'weapon.fire':
    //                 break;
    //         }
    //
    //         stateTagApp.$write('event', null);
    //     }
    // );

    stateObserver.watch(
        function (state) {
            return state.timer;
        },
        function (fresh, stale) {
            if(stateTagApp.$read('coins') == 0){
                return;
            }

            if (fresh == 0) {

                stateTagApp.$broadcast({
                    type: 'game',
                    from: 'state.timer',
                    event: 'game.survived',
                    coins: stateTagApp.$read('coins')
                });

                stateTagApp.$broadcast({
                    type: 'game',
                    from: 'state.timer',
                    event: 'game.end'
                });
            }
        }
    );

    stateObserver.watch(
        function (state) {
            return state.pause;
        },
        function (fresh, stale) {
            // if(stateTagApp.$read('coins') == 0){
            //     return;
            // }

            let timer = stateTagApp.$read('timer');

            if (fresh == false) {
                if (timer == 0) {
                    stateTagApp.$broadcast({
                        type: 'game',
                        from: 'state.timer',
                        event: 'game.new'
                    });
                }
            } else {
                if (timer != 0) {
                    stateTagApp.$broadcast({
                        type: 'game',
                        from: 'state.timer',
                        event: 'game.pause'
                    });
                }
            }


        }
    );

    stateObserver.watch(
        function (state) {
            return state.coins;
        },
        function (fresh, stale) {
            if(stateTagApp.$read('timer') == 0){
                return;
            }

            if (fresh < 0) {
                stateTagApp.$write('coins', 0);
                stateTagApp.$write('timer', 0);
                stateTagApp.$write('pause', true);

                stateTagApp.$broadcast({
                    type: 'game',
                    from: 'state.coins',
                    event: 'game.lost'
                });

            }
        }
    );

}