import express, {Router} from "express";
import {Auth} from "firebase-admin/auth";
import {Firestore} from "firebase-admin/firestore";
import {errorMiddleware, logMiddleware} from "../middleware";
import getAdminRouter from "./admin";
import getClientRouter from "./client";
import {FirebaseFunctionsRateLimiterConfiguration} from "firebase-functions-rate-limiter";

// NOTE: db and auth are injectable to enable mocking
export default function getRouter(
    db: Firestore,
    auth: Auth,
    clientRateLimitConfig: FirebaseFunctionsRateLimiterConfiguration,
): Router {
  const router = express.Router();

  router.use(express.json());
  router.use(logMiddleware);

  router.use("/admin", getAdminRouter(db, auth));
  router.use("/client", getClientRouter(db, clientRateLimitConfig));

  router.use(errorMiddleware);

  return router;
}
