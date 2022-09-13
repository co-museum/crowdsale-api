import express, {Router} from "express";
import {Firestore} from "firebase-admin/firestore";
import {Client} from "../controllers/client";
import {FirebaseFunctionsRateLimiterConfiguration} from "firebase-functions-rate-limiter";

export default function getClientRouter(
    db: Firestore,
    rateLimitConfig: FirebaseFunctionsRateLimiterConfiguration
): Router {
  const clientRouter = express.Router();
  const client = new Client(db, rateLimitConfig);

  // clientRouter.use(client.ipRateLimitMiddlware);
  clientRouter.get("/proof/:address", client.getProof);
  clientRouter.get("/sale", client.getSale);

  return clientRouter;
}
