import { contextBridge, ipcRenderer } from 'electron';

// 通过 contextBridge 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 平台信息
  platform: process.platform,

  // 可以在这里添加更多的 IPC 通信方法
  // 例如：文件系统操作、原生菜单等
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },

  // 示例：接收来自主进程的消息
  onMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('message', (_event, message) => callback(message));
  },

  // 示例：发送消息到主进程
  sendMessage: (message: string) => {
    ipcRenderer.send('message', message);
  },
});
