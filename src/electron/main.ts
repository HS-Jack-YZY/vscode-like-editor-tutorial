import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 处理在 macOS 上创建新窗口的点击事件
process.env.DIST = path.join(__dirname, '../..');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, 'public');

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 在开发环境中加载 Vite 开发服务器
  if (!app.isPackaged && process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    // 打开开发者工具
    win.webContents.openDevTools();
  } else {
    // 在生产环境中加载打包后的文件
    win.loadFile(path.join(process.env.DIST!, 'index.html'));
  }

  // 窗口关闭时清理引用
  win.on('closed', () => {
    win = null;
  });
}

// 当 Electron 初始化完成时创建窗口
app.whenReady().then(createWindow);

// 当所有窗口关闭时退出（除了 macOS）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 在 macOS 上，当点击 dock 图标且没有其他窗口打开时，重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
