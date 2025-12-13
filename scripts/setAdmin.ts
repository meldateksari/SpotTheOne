import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { adminAuth } from "../src/lib/firebase-admin";

const uid = "3caCGndkANMMQsyzKmTmvrjKEs82";


async function run() {
    console.log("PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);

    await adminAuth.setCustomUserClaims(uid, { admin: true });
    console.log("✅ Admin claim verildi");
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
