import * as functions from "firebase-functions";
import * as adminHandlers from "./handlers/admin";
import express from "express";
import {initializeApp} from "firebase-admin/app";

const app = express();
app.use(express.json());
initializeApp();

app.put("/admin/whitelist/:batch/:whitelist", adminHandlers.addWhitelist);
app.delete("/admin/whitelist/:batch/:whitelist", adminHandlers.removeWhitelist);
app.put("/admin/address/:batch/:whitelist", adminHandlers.addAddresses);
app.delete("/admin/address/:batch/:whitelist", adminHandlers.removeAddresses);

export const api = functions
    .region("asia-southeast1") // comma separated string to multiple regions
    .https.onRequest(app);
