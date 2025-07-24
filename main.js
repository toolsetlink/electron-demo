const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // 打开开发者工具
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();

  // 初始化自动更新
  autoUpdater.autoDownload = false; // 禁用自动下载，手动控制
  autoUpdater.forceDevUpdateConfig = true; // 强制开发环境更新配置检查
  // autoUpdater.checkForUpdates();
  autoUpdater.updateConfigPath = path.join(__dirname, "dev-update.yml");

});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC通信：检查更新
ipcMain.handle('check-for-updates', async () => {
  try {
    console.log(app.getVersion());
    console.log(process.platform);
    console.log(process.arch);

    // const FeedURL = `${this.httpUrl}/update?${paramsQuery}`;
    const FeedURL = `https://api.upgrade.toolsetlink.com/v1/electron/upgrade?electronKey=kPUtUMDIjBhS48q5771pow&versionName=${app.getVersion()}&appointVersionName=&devModelKey=&devKey=&platform=${process.platform}&arch=${process.arch}`;
    autoUpdater.setFeedURL({
      url: FeedURL,
      provider: 'generic',
    });
    autoUpdater.requestHeaders = {
      'X-AccessKey': 'mui2W50H1j-OC4xD6PgQag',
    };

    const result = await autoUpdater.checkForUpdates();
    // 打印
    console.log(result);
    
    if (!result || !result.updateInfo) {
      return {
        error: "无法获取更新信息",
        currentVersion: app.getVersion()
      };
    } else if (result.updateInfo.version) {
      return {
        updateAvailable: true,
        currentVersion: app.getVersion(),
        newVersion: result.updateInfo.version
      };
    }
    return {
      updateAvailable: false,
      currentVersion: app.getVersion()
    };
  } catch (error) {
    return {
      error: error.message,
      currentVersion: app.getVersion()
    };
  }
});

// IPC通信：下载更新
ipcMain.handle('download-update', async () => {
  try {
    console.log(app.getVersion());
    console.log(process.platform);
    console.log(process.arch);
    
    const FeedURL = `https://api.upgrade.toolsetlink.com/v1/electron/upgrade?electronKey=kPUtUMDIjBhS48q5771pow&versionName=${app.getVersion()}&appointVersionName=&devModelKey=&devKey=&platform=${process.platform}&arch=${process.arch}`;
    autoUpdater.setFeedURL({
      url: FeedURL,
      provider: 'generic',
    });
    autoUpdater.requestHeaders = {
      'X-AccessKey': 'mui2W50H1j-OC4xD6PgQag',
    };
    const result = await autoUpdater.checkForUpdates();

    // 打印
    console.log(result);

    autoUpdater.setFeedURL({
      url: result.updateInfo.url,
      provider: 'generic',
    });
    
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC通信：安装更新
ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

// 自动更新事件监听
autoUpdater.on('update-available', (info) => {
  mainWindow.webContents.send('update-available', info);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send('update-downloaded', info);
});

autoUpdater.on('error', (error) => {
  mainWindow.webContents.send('update-error', error.message);
});