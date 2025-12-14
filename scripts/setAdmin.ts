import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { adminAuth } from "../src/lib/firebase-admin";

const uids = [
    "3caCGndkANMMQsyzKmTmvrjKEs82",
    "WleLDKIkFneu6TAf8Kvl1QWbj213",
    "O7qcBqGl4EaVvbGLYN777J4KEMR2"
];

async function run() {
    console.log("PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);

    for (const uid of uids) {
        try {
            await adminAuth.setCustomUserClaims(uid, { admin: true });
            console.log(`✅ Admin claim verildi: ${uid}`);
        } catch (error) {
            console.error(`❌ Hata (${uid}):`, error);
        }
    }

    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
