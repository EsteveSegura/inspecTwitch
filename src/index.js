const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    icon:path.join(__dirname, './build/icon.png')
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, './app/index.html'));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
  mainWindow.setMenu(null)
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


const tmi = require('tmi.js');
const _ = require('lodash')


const utils = require('./bot/utils/utils');
const dataToCsv = require('./bot/utils/dataToCsv');

const handleFile = require('./bot/utils/handleFiles');
const browserActions = require('./bot/scrapingActions/browserActions');
const apiActions = require('./bot/scrapingActions/apiActions');
const configReader = require('./bot/utils/config');


let messagesOnMemory = []
let viewsOnMemory = []

let twitchUserTarget = require('./bot/config.json').target.toLowerCase();
let lastStatus = false;
let appStatus = false;

const client = new tmi.Client({
  options: { debug: false },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    username: require('./bot/config.json').BOT_NAME,
    password: require('./bot/config.json').TOKEN_IRC
  },
  channels: [`${twitchUserTarget}`]
});

client.connect();

client.on('message', (channel, tags, message, self) => {
  if (self) return;
  let actualDate = new Date()
  let channelMsg = channel.substr(1)
  messagesOnMemory.push({ "channel": channelMsg, "username": tags.username, "message": message, "timeStamp": actualDate });
});

async function getActualPeople(userTwitch) {
  try {
    let browserViews = await browserActions.takeScreenshotAndGetCounter(userTwitch, false)
    let apiViews = await apiActions.getApiData(userTwitch)
    console.log(`views totales : ${browserViews} - views reales :${apiViews.data.chatter_count}`)

    return {
      'browserViews': browserViews,
      'apiViews': apiViews.data.chatter_count,
      'ratioApiBrowser': utils.getRatioApiViewsBrowserViews(apiViews.data.chatter_count, browserViews),
      'apiData': apiViews.data
    }
  } catch (error) {
    console.log('fail, but we keep online')
  }
}

function getLastStatus() {
  return lastStatus
}

function setStatus(status) {
  lastStatus = status;
}

async function scanUser() {
  let statusUser = await apiActions.streamerIsOnline(twitchUserTarget);


  if (!getLastStatus()) {
    setStatus(false)
  }

  if (statusUser && !getLastStatus()) {
    viewsOnMemory = []
    messagesOnMemory = []
    let data = await getActualPeople(twitchUserTarget)
    viewsOnMemory.push(data)
    setStatus(true)
  }

  if (statusUser && getLastStatus()) {
    let data = await getActualPeople(twitchUserTarget)
    viewsOnMemory.push(data)
  }

  if (!statusUser && getLastStatus()) {
    await saveLogs()
  }
}

/*
(async () => {
  await scanUser()
})()
*/

setInterval(async () => {
  if(appStatus){
    await scanUser()
  }
}, 1000 * 60);

ipcMain.on('swapAppStatus', async (event, arg) => {
  appStatus = true;
})

ipcMain.on('setup', async (event, arg) => {
  if (arg.require) {
    let configSaved = configReader.readCfg()
    //console.log(configSaved)
    event.reply('setup', configSaved)
  }
})

ipcMain.on('checkActualUser', async (event, arg) => {
  try {
    event.reply('checkActualUser', client.channels[0].substr(1))
  } catch (error) {
    console.log(error)
  }
})

//await saveLogs()
ipcMain.on('save', async (event, arg) => {
  await saveLogs()
})

ipcMain.on('views', async (event, arg) => {
  //console.log("pidiendo datos")
  event.reply('views', viewsOnMemory)
  event.reply('chat', messagesOnMemory)
  try {
    if (`#${viewsOnMemory[0].apiData.chatters.broadcaster[0]}` != client.channels[0]) {
      viewsOnMemory.shift()
    }
  } catch (error) {

  }
})

ipcMain.on('setConfig', async (event, arg) => {
  try {
    twitchUserTarget = arg.target.toLowerCase()
    client.opts.identity.username = arg.BOT_NAME
    client.opts.identity.password = arg.TOKEN_IRC
    viewsOnMemory = []
    messagesOnMemory = []
    await handleFile.writeJsonFile(path.join(__dirname, './bot/config.json'), arg)
    client.part(`${client.opts.channels[0]}`)
    await client.join(`#${arg.target.toLowerCase()}`)

    event.reply('setConfig', arg)
    //app.relaunch()
  } catch (error) {
    //console.log(error)
  }
})



async function saveLogs() {
  console.log("SaveFiles")
  let actualDate = new Date().getTime();
  let viewsToCsv = dataToCsv.convertViewsToCSV(viewsOnMemory)
  let chatSave = await handleFile.writeJsonFile(path.join(__dirname, `./bot/data/chat_${twitchUserTarget}_${actualDate}.json`), messagesOnMemory);
  let viewsSave = await handleFile.writeJsonFile(path.join(__dirname, `./bot/data/viewers_${twitchUserTarget}_${actualDate}.json`), viewsOnMemory);
  let viewsCsv = await handleFile.writeCsvFile(path.join(__dirname, `./bot/data/viewers_${twitchUserTarget}_${actualDate}.csv`), viewsToCsv);
  viewsOnMemory = []
  messagesOnMemory = []
  setStatus(false)
}