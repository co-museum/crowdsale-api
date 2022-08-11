import functions from "firebase-functions";
import express from "express";

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

const app = express();

app.get("/", (_, res) => res.status(200).send("Hey there!"));

exports.app = functions
    .region("asia-southeast1") // comma separated string to multiple regions
    .https.onRequest(app);
