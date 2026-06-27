module.exports = {
  apps: [
    {
      name: 'aura-studio-api',
      cwd: '/var/www/aura-studio/backend',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      log_file: '/var/log/aura-studio/combined.log',
      out_file: '/var/log/aura-studio/out.log',
      error_file: '/var/log/aura-studio/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s',
      kill_timeout: 5000,
      listen_timeout: 5000,
    },
  ],
};
