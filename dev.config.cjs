module.exports = {
  apps : [{
    name : "trackbear",
    interpreter: "node",
    interpreter_args: "--import ./ts-node-loader.js",
    script : "./main.ts",
    wait_ready: true,
    env: {
      NODE_ENV: 'development',
    },
  }]
};
