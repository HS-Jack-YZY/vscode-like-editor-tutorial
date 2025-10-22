import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // 主进程入口文件
        entry: "src/electron/main.ts",
      },
      preload: {
        // 预加载脚本
        input: "src/electron/preload.ts",
      },
      // 可选：使用 Node.js API 进行渲染进程
      renderer: process.env.NODE_ENV === "test" ? undefined : {},
    }),
  ],
  root: ".",
  build: {
    outDir: "dist",
  },
});
