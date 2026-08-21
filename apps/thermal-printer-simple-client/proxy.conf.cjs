const servicePort = process.env.SERVICE_PORT;

if (!servicePort) {
  throw new Error('SERVICE_PORT must be set in the root .env file.');
}

module.exports = {
  '/api': {
    target: `http://localhost:${servicePort}`,
    secure: false,
    changeOrigin: true,
  },
};
