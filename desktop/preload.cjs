'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('knightDesktop', {
  getServer: () => ipcRenderer.invoke('knight:get-server'),
  setServer: value => ipcRenderer.invoke('knight:set-server', value),
  closeSettings: () => ipcRenderer.invoke('knight:close-settings'),
});
