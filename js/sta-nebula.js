function initGlobalNebulaWatchers(uuidv4, _) {
    let nebulaId = stateTagApp.$read('sta.nebulaId');
    if(_.isUndefined(nebulaId)){
        nebulaId = uuidv4().replaceAll('-','');
        console.log(nebulaId);
        stateTagApp.$write('sta.nebulaId', nebulaId);
    }

    stateTagApp.$onNebula('remoteCommand', function (command){

        if(!_.isEmpty(command)
            && !_.isUndefined(stateTagApp.commands[command])){
            stateTagApp.commands[command]();
            stateTagApp.$nebula('remoteCommand', '');
            stateTagApp.log(command.concat(' executed and deleted.'))
        }
    });
}