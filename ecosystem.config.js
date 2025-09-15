module.exports = {
  apps: [
    {
      script: 'app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
      env: {
        name: 'loopstyle-backend-dev-v1',
        NODE_ENV: 'development',
      },
      env_staging: {
        name: 'loopstyle-backend-staging-v1',
        NODE_ENV: 'staging',
      },
      env_production: {
        name: 'loopstyle-backend-prod-v1',
        NODE_ENV: 'production',
      },
    },
  ],
};
