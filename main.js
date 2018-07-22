const electron = require('electron')
const {app, BrowserWindow} = electron
let win
const userDataPath = (electron.app || electron.remote.app).getPath('userData')
let fs = require('fs')

app.on('ready', () => {
  win = new BrowserWindow({resizable: true, maximizable: true})
  //win.setMenu(null)
  win.maximize()
  win.loadURL(__dirname + '/index.html')
  if (!fs.existsSync(userDataPath + '/wallpapers')) {
    fs.mkdir(userDataPath + '/wallpapers')
  }
})

app.on('quit', () => {
  app.quit()
})
