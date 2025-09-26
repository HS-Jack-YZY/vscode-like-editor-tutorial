import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 测试文件匹配模式
    include: ["**/*.test.{js,ts}", "**/*.spec.{js,ts}", "**/test/**/*.{js,ts}"],
    exclude: ["node_modules", "dist"],
    
    // 环境配置
    environment: "node",
    
    // 覆盖率配置
    coverage: {
      provider: "v8",
      include: ["src/**/*.{js,ts}"],
      exclude: ["src/**/*.test.{js,ts}", "src/**/*.spec.{js,ts}"],
      reporter: ["text", "json", "html"],
      reportOnFailure: true,
    },
    
    // 监听模式配置
    watch: false,
    
    // 全局设置
    globals: false,
    
    // 报告配置
    reporter: ["verbose", "json", "html"],
  },
});