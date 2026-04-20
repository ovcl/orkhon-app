// Firebase Admin SDK Configuration for Server-Side Operations
const admin = require('firebase-admin');

let app;

if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
        }
    } catch (error) {
        console.error('Firebase admin initialization error:', error.message);
    }
}

const db = admin.apps.length ? admin.firestore() : null;
const storage = admin.apps.length ? admin.storage() : null;

module.exports = { admin, db, storage };

