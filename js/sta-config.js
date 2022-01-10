const stateTagApp = {
    namespace: 'sof',
    disk: [localStorage, sessionStorage][0],
    cacheTimeout: 1 * 60 * 1000,
    log: console.log,
    format: {
        date: 'Y-MM-DD',
    },

    api: {
        production: "https://data.StateTagApps.com",
        development: "https://data.StateTagApps.com"
    },

    //optional
    socket: {
        production: "https://timesocket.io:3030",
        development: "https://timesocket.io:3030"
    },

    nebula: {
        production: "https://json-data.io:8080",
        development: "http://json-data.io:8181"
    }
}