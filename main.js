require = require("esm")(module/*, options*/)
module.exports = require("./main.js")
const { app, BrowserWindow, ipcMain } = require('electron')
const express = require('express')
const ad4m = require('@perspect3vism/ad4m-executor')

const fs = require('fs')
const path = require('path')

const worldLinkLanguageHash = 'QmchPr6NgxFUrrETHrd49DSRdfFMdn6A5sw2JSXhujy4gS'
let bootstrapFixtures = {
  worldPerspective: JSON.parse(fs.readFileSync('./bootstrap/world.perspective.json')),
  worldLinkLanguageHash,
  worldLinkLinguageBundle:  fs.readFileSync(path.join('./bootstrap/', worldLinkLanguageHash, 'bundle.js')),
  worldLinkLinguageMeta: JSON.parse(fs.readFileSync(path.join('./bootstrap/', worldLinkLanguageHash, 'meta.json'))),
}

app.whenReady().then(() => {
  ad4m
  .init({
    appDataPath: app.getPath("appData"),
    resourcePath: __dirname,
    appDefaultLangPath: "./src/languages",
    ad4mBootstrapLanguages: {
      agents: "agent-profiles",
      languages: "languages",
      perspectives: "shared-perspectives"
    },
    ad4mBootstrapFixtures: {
      languages: [{
        address: bootstrapFixtures.worldLinkLanguageHash,
        meta: bootstrapFixtures.worldLinkLinguageMeta,
        bundle: bootstrapFixtures.worldLinkLinguageBundle
      }],
      perspectives: [{
        address: '__world',
        expression: bootstrapFixtures.worldPerspective
      }]
    },
    appBuiltInLangs: [
      "social-context",
      "note-ipfs"
    ],
    mocks: false
  })
  .then((ad4mCore) => {
    console.log(
      "\x1b[36m%s\x1b[0m",
      "Starting account creation splash screen"
    );

    const splash = createSplash()
    ad4mCore.waitForAgent().then(async () => {
      console.log(
        "\x1b[36m%s\x1b[0m",
        "Agent has been init'd. Controllers now starting init..."
      );
      ad4mCore.initControllers();
      console.log("\x1b[32m", "Controllers init complete!");

      console.log(
        "\x1b[36m%s\x1b[0m",
        "Initializing languages..."
      );
      await ad4mCore.initLanguages()
      console.log("\x1b[32m", "All languages initialized!");


      createWindow()
      splash.close()
    });
  });

})

function createSplash () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    minimizable: false,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
  })

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/public/splash.html`)

  // Open the DevTools.
  //win.webContents.openDevTools()

  return win
}

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  })

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/public/index.html`)

  // Open the DevTools.
  win.webContents.openDevTools()

  return win
}

function serveUI() {
  const expressApp = express()
  expressApp.use(express.static(`${__dirname}/public`))
  expressApp.listen(9090)
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

serveUI()