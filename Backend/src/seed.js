import mongoose from 'mongoose';
import {getConfig} from './config/runtime.js';
import {initializeDatabase} from './config/database.js';
try {
  await initializeDatabase(getConfig());
  console.log('Collections, indexes and administrator account are ready. First administrator credentials are in Backend/.runtime/admin-credentials.json when generated.');
} catch {
  console.error('Database initialization failed. Check MONGODB_URL, MongoDB permissions and replica-set support.');
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
