// Electron API 类型定义
export type ElectronAPI = {
  platform: NodeJS.Platform;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  onMessage: (callback: (message: string) => void) => void;
  sendMessage: (message: string) => void;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
