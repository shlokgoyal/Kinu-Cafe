const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');

function generateQrToken() {
  return uuidv4();
}

function buildQrUrl(qrToken) {
  return `${env.frontendUrl.replace(/\/$/, '')}/order?t=${qrToken}`;
}

module.exports = { generateQrToken, buildQrUrl };
