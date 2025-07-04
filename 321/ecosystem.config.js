module.exports = {
    apps: [
      {
        name: 'server-app',
        script: './server.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '512M',
        env: {
          NODE_ENV: 'production',
        },
      }
    ],
  };