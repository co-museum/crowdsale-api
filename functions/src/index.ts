import * as functions from "firebase-functions";
import express from "express";
import {initializeApp} from "firebase-admin/app";
import getRouter from "./routers";
import {getFirestore} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import {FirebaseFunctionsRateLimiterConfiguration} from "firebase-functions-rate-limiter";

initializeApp();

const app = express();
const db = getFirestore();
const auth = getAuth();
const rateLimitConfig: FirebaseFunctionsRateLimiterConfiguration = {
  maxCalls: 500,
  periodSeconds: 60,
};

app.set("trust proxy", true);
app.use("/", getRouter(db, auth, rateLimitConfig));

export const api = functions
    .region("asia-southeast1") // comma separated string to multiple regions
    .https.onRequest(app);
