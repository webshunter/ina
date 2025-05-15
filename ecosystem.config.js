module.exports = {
  apps: [
    {
      name: 'main-app',
      script: 'index.js',
      watch: true,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'deploy-webhook',
      script: 'deploy.js',
      watch: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}; 