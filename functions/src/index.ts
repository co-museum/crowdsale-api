import * as functions from "firebase-functions";
import express from "express";
import {initializeApp} from "firebase-admin/app";
import getRouter from "./routers";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();
const app = express();
const db = getFirestore();
app.use("/", getRouter(db));

export const api = functions
    .region("asia-southeast1") // comma separated string to multiple regions
    .https.onRequest(app);
