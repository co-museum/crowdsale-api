import * as functions from "firebase-functions";
import {Admin} from "./handlers/admin";
import express from "express";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

const app = express();
app.use(express.json());
initializeApp();

const db = getFirestore();
const admin = new Admin(db);

app.put("/admin/whitelist/:batch/:whitelist", admin.addWhitelist);
app.delete("/admin/whitelist/:batch/:whitelist", admin.removeWhitelist);
app.put("/admin/address/:batch/:whitelist", admin.addAddresses);
app.delete("/admin/address/:batch/:whitelist", admin.removeAddresses);

export const api = functions
    .region("asia-southeast1") // comma separated string to multiple regions
    .https.onRequest(app);
