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
    // const FeedURL = `https://api.upgrade.toolsetlink.com/v1/electron/upgrade?electronKey=kPUtUMDIjBhS48q5771pow&versionName=${app.getVersion()}&appointVersionName=&devModelKey=&devKey=&platform=${process.platform}&arch=${process.arch}`;
    const FeedURL = `http://0.0.0.0:8888/v1/electron/upgrade?electronKey=kPUtUMDIjBhS48q5771pow&versionName=${app.getVersion()}&appointVersionName=&devModelKey=&devKey=&platform=${process.platform}&arch=${process.arch}`;
    
    autoUpdater.setFeedURL({
      url: FeedURL,
      provider: 'generic',
    });
    autoUpdater.requestHeaders = {
      'X-AccessKey': 'mui2W50H1j-OC4xD6PgQag',
    };

    const result = await autoUpdater.checkForUpdates();
    // 打印
    console.log("result: ",result);
     

    if (!result || !result.updateInfo) {
      return {
        error: "无法获取更新信息",
        currentVersion: app.getVersion()
      };
    } else if (result.updateInfo.version == app.getVersion()) {
      return {
        updateAvailable: false,
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

    // const FeedURL = `https://api.upgrade.toolsetlink.com/v1/electron/upgrade?electronKey=kPUtUMDIjBhS48q5771pow&versionName=${app.getVersion()}&appointVersionName=&devModelKey=&devKey=&platform=${process.platform}&arch=${process.arch}`;
    const FeedURL = `http://0.0.0.0:8888/v1/electron/upgrade?electronKey=kPUtUMDIjBhS48q5771pow&versionName=${app.getVersion()}&appointVersionName=&devModelKey=&devKey=&platform=${process.platform}&arch=${process.arch}`;

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
    
    // 重新注册下载进度事件监听器
    // autoUpdater.removeAllListeners('download-progress');
    // autoUpdater.on('download-progress', (progressObj) => {
    //   try {
    //     const totalSize = progressObj.total || currentUpdateInfo?.size || 0;
    //     const calculatedPercent = totalSize > 0 
    //       ? Math.round((progressObj.transferred / totalSize) * 100)
    //       : (progressObj.percent || 0);

    //     console.log('[DEBUG] 计算后进度:', calculatedPercent, 'transferred:', progressObj.transferred, 'total:', totalSize);

    //     if (mainWindow && mainWindow.webContents) {
    //       mainWindow.webContents.send('download-progress', {
    //         percent: calculatedPercent,
    //         transferred: progressObj.transferred,
    //         total: totalSize
    //       });
    //     } else {
    //       console.log('[DEBUG] mainWindow不可用，无法发送进度更新');
    //     }
    //   } catch (error) {
    //     console.error('[ERROR] 下载进度事件处理失败:', error);
    //   }
    // });
    
    console.log('[流程] 下载更新开始，URL:', result.updateInfo.url);
    
    try {
      console.error('[DEBUG] 进入 try');

      // 验证URL可访问性
      const https = require('https');
      https.get(result.updateInfo.url, (res) => {
        res.destroy();
      }).on('error', (e) => {
        console.error('[DEBUG] URL请求错误:', e);
      });

      await autoUpdater.downloadUpdate();
      console.log('[流程] 下载更新完成');
    } catch (e) {
      console.error('[流程] 下载更新失败:', e);
      console.error('[DEBUG] 错误堆栈:', e.stack);
      throw e;
    }
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

// 添加下载进度事件监听
autoUpdater.on('download-progress', (progressObj) => {
  mainWindow.webContents.send('download-progress', {
    percent: progressObj.percent,
    transferred: progressObj.transferred,
    total: progressObj.total
  });
});

autoUpdater.on('error', (error) => {
  mainWindow.webContents.send('update-error', error.message);
});