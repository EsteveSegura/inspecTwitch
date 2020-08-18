const { ipcRenderer } = require('electron');

$("#tab-monitor").hide()

ipcRenderer.send('setup', { require: true })

let actualUser = ""

let ctx = document.getElementById('myChart').getContext('2d');
let chart = new Chart(ctx, {
    type: 'line',

    data: {
        labels: [],
        datasets: []
    },

    options: {
        bezierCurve: false,
        animation: {
            duration: 0
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
});

$("#save-data").click(function (e) {
    e.preventDefault()
    ipcRenderer.send('save', { save: true })
});

setTimeout(() => {
    
}, 3000);

$("#submit-data").click(function (e) {
    e.preventDefault();
    if(!$("#channel").val() && !$("#tokenirc").val() && !$("#clientid").val() && !$("#clientsecret").val() && !$("#namebot").val() ){
        alert("Necesitas poner datos")
    }else{
        startMonitor()
        ipcRenderer.send('setConfig', {
            TOKEN_IRC: $("#tokenirc").val(),
            CLIENT_ID: $("#clientid").val(),
            CLIENT_SECRET: $("#clientsecret").val(),
            BOT_NAME: $("#namebot").val(),
            target: $("#channel").val(),
        })
    }
});

setInterval(() => {
    ipcRenderer.send('checkActualUser', true)
    ipcRenderer.send('views', 'ping')
}, 3000);

ipcRenderer.on('checkActualUser', (event, arg) => {
    actualUser = arg
})


let labs = []
ipcRenderer.on('views', (event, arg) => {
    console.log(arg)
    labs = []
    if (arg[0].apiData.chatters.broadcaster[0] == actualUser) {
        for (let i = 0; i < arg.length; i++) {
            labs.push(i)
        }
        chart.data.labels = labs
        chart.data.datasets[0] = {
            label: 'real Viewers',
            borderColor: 'rgb(0,0,255)',
            data: arg.map((data) => data.apiViews)
        }
        chart.data.datasets[1] = {
            label: 'Unidentified views',
            borderColor: 'rgb(255,0,0)',
            data: arg.map((data) => Math.abs(parseInt(data.browserViews) - parseInt(data.apiViews)))
        }
        chart.data.datasets[2] = {
            label: 'Total ',
            borderColor: 'rgb(0,255,0)',
            data: arg.map((data) => parseInt(data.browserViews))
        }
        chart.update();
        console.log(arg[arg.length - 1].ratioApiBrowser)
        let actualusers = (arg[arg.length - 1].ratioApiBrowser).toFixed(2) * 100 
        let actualunidentified = 100 - parseFloat(actualusers)
        $('#actual-real-users').text(`${actualusers} %`)
        $('#actual-unidentified-users').text(`${actualunidentified < 0 ? '0' : actualunidentified} %`)
    } else {
        labs = []
    }
})


ipcRenderer.on('chat', (event, arg) => {
    console.log(arg)
    $('#ratio-message-min').text((arg.length / labs.length).toFixed(2))
})

ipcRenderer.on('setup', (event, arg) => {
    $("#tokenirc").val(arg.TOKEN_IRC)
    $("#clientid").val(arg.CLIENT_ID)
    $("#clientsecret").val(arg.CLIENT_SECRET)
    $("#namebot").val(arg.BOT_NAME)
    $("#channel").val(arg.target)
})

function startMonitor() {
    $("#tab-monitor").show()
    $("#tab-login").hide()
    ipcRenderer.send('swapAppStatus', true)
}
