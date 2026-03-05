const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('likesLocalDesktop', {
  platform: process.platform,
})
