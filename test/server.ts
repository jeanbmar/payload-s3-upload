import path from 'node:path';
import process from 'node:process';
import express from 'express';
import payload from 'payload';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;
let app;
let server;

const start = async () => {
  mongod = await MongoMemoryServer.create();
  process.env.PAYLOAD_CONFIG_PATH = path.join(__dirname, 'payload.config.ts');
  app = express();
  await payload.init({
    secret: 's3-upload',
    mongoURL: mongod.getUri(),
    express: app,
  });
  server = app.listen(3000, () => {
    console.log('test server started');
  });
};

const stop = async () => {
  await mongod.stop();
  server.close();
  console.log('test server stopped');
  process.exit(0);
};

export { start, stop };
