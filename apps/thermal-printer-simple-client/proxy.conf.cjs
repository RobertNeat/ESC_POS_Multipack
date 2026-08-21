const servicePort = process.env.SERVICE_PORT ?? '3000';

module.exports = {
  '/api': {
    target: `http://localhost:${servicePort}`,
    secure: false,
    changeOrigin: true,
  },
};
