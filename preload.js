const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露安全的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取当前版本
  getCurrentVersion: () => ipcRenderer.invoke('get-current-version'),
  // 检查更新
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  // 下载更新
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  // 安装更新
  installUpdate: () => ipcRenderer.send('install-update'),
  // 监听更新事件
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (event, error) => callback(error))
});