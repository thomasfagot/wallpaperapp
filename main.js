/* global __dirname */

const electron = require('electron')
const {app, BrowserWindow} = electron
const userDataPath = (electron.app || electron.remote.app).getPath('userData')
const fs = require('fs')
let win

app.on('ready', () => {
  win = new BrowserWindow({
    resizable: true,
    maximizable: true
  })

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
