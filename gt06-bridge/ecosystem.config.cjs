// pm2 process definition: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'gt06-bridge',
      script: 'bridge.js',
      env: { NODE_ENV: 'production' },
      restart_delay: 3000,
      max_restarts: 50,
    },
  ],
};