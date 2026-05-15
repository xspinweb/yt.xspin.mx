module.exports = {
  apps: [
    {
      name: "yt-xspin-frontend",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "yt-xspin-backend",
      cwd: "./backend",
      script: "dist/src/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    }
  ]
};
