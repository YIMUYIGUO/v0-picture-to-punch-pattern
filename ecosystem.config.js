module.exports = {
  apps: [
    {
      name: "punch-pattern-app", // 改为与脚本中一致的名称
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_file: ".env.production",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
}
