import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import * as models from '../models/index.js';
import { privateFile } from './runtime.js';

export async function initializeDatabase(config) {
  await mongoose.connect(config.mongodbUrl, { dbName: 'committee', serverSelectionTimeoutMS: 10000 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') {
    await mongoose.disconnect();
    throw new Error('MongoDB transactions require Atlas or a replica set. Use an Atlas URL or enable a local replica set.');
  }
  // Create empty collections too; do not insert example financial records.
  for (const Model of Object.values(models)) {
    await Model.createCollection();
    await Model.init();
  }
  if (!await models.User.exists({ role: 'admin' })) {
    if (config.production) throw new Error('Initialize the administrator locally against this database before production deployment.');
    const credentials = JSON.parse(privateFile('admin-credentials.json', () => JSON.stringify({
      login: 'admin', password: randomBytes(18).toString('base64url')
    }, null, 2)));
    try {
      await models.User.create({ login: credentials.login, password: await bcrypt.hash(credentials.password, 12), role: 'admin', displayName: 'Bahadur Singh Adhikari', displayNameHi: 'बहादुर सिंह अधिकारी' });
    } catch (error) {
      // Two server instances may initialize simultaneously. Never replace an existing account.
      if (error.code !== 11000 || !await models.User.exists({ login: credentials.login, role: 'admin' })) throw error;
    }
  }
}

