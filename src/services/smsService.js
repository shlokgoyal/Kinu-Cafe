const env = require('../config/env');

async function devSend(phone, code) {
  // eslint-disable-next-line no-console
  console.log(`[OTP] phone=${phone} code=${code} (dev driver — do NOT use in production)`);
}

async function twilioSend(_phone, _code) {
  throw new Error(
    'Twilio driver not implemented. Install `twilio` and wire TWILIO_* env vars in src/services/smsService.js'
  );
}

async function msg91Send(_phone, _code) {
  throw new Error(
    'MSG91 driver not implemented. Wire MSG91_AUTH_KEY + MSG91_TEMPLATE_ID in src/services/smsService.js'
  );
}

async function sendOtp(phone, code) {
  switch (env.sms.provider) {
    case 'twilio':
      return twilioSend(phone, code);
    case 'msg91':
      return msg91Send(phone, code);
    case 'dev':
    default:
      return devSend(phone, code);
  }
}

module.exports = { sendOtp };
