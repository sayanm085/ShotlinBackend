// Firebase Admin SDK service account key
// Loaded from the path specified in FIREBASE_SERVICE_ACCOUNT_PATH environment variable.
// Download your service account JSON from the Firebase console and set the path in your .env file.

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set. See .env.demo for reference.');
}

const resolvedPath = path.resolve(serviceAccountPath);

if (!fs.existsSync(resolvedPath)) {
  throw new Error(`Firebase service account file not found at: ${resolvedPath}`);
}

const serviceAccountKey = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));

export default serviceAccountKey;
