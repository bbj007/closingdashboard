const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  generateDashboard: (payload) => ipcRenderer.invoke('dashboard:generate', payload),
  sendEmail: (payload) => ipcRenderer.invoke('email:send', payload)
});
