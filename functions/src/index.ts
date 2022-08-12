import * as functions from "firebase-functions";
import * as handlers from "./handlers";
import express from "express";
import {initializeApp} from "firebase-admin/app";

const app = express();
app.use(express.json());
initializeApp();

app.put("/admin/whitelist/:batch/:whitelist", handlers.addWhitelist);
// app.patch("/admin/whitelist/:batch/:whitelist", handlers.addWhitelist);

export const api = functions
    .region("asia-southeast1") // comma separated string to multiple regions
    .https.onRequest(app);
