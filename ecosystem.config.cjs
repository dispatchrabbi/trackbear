module.exports = {
  apps : [{
    name : "trackbear",
    interpreter: "node",
    interpreter_args: "--import ./ts-node-loader.js",
    script : "./main.ts",
    env: {
      NODE_ENV: 'production',
    },
  }]
};
