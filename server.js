const app = require('./src/app');
const env = require('./src/config/env');
const { connectDb } = require('./src/config/db');
const seedAdmin = require('./src/seed/seedAdmin');

async function bootstrap() {
  try {
    await connectDb();
    await seedAdmin();
    app.listen(env.port, () => {
      console.log(`[server] Kinu's Cafe API listening on http://localhost:${env.port}`);
      console.log(`[server] env=${env.nodeEnv}  sms=${env.sms.provider}`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err);
    process.exit(1);
  }
}

bootstrap();
