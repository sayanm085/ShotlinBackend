const admin = require("firebase-admin");
const serviceAccountKey = require("./serviceAccountKey.js");

// Load Firebase service account key (Replace with your actual credentials)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

module.exports = admin;
