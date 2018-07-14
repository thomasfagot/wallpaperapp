const electron = require('electron')
const {app, BrowserWindow} = electron
let win
const path = require('path')
const userDataPath = (electron.app || electron.remote.app).getPath('userData')
var fs = require('fs')

app.on('ready', () => {
  win = new BrowserWindow({resizable: false, maximizable: false})
  //win.setMenu(null)
  win.maximize()
  win.isResizable(false)
  win.isMaximizable(false)
  win.loadURL(__dirname + '/index.html')
  if (!fs.existsSync(userDataPath + '/wallpapers')) {
    fs.mkdir(userDataPath + '/wallpapers')
  }
})

app.on('close', () => {
})

app.on('quit', () => {
  app.quit()
})
