import express, {Router} from "express";
import {Firestore} from "firebase-admin/firestore";
import {errorMiddleware, logMiddleware} from "../middleware";
import getAdminRouter from "./admin";
import getClientRouter from "./client";


export default function getRouter(db: Firestore): Router {
  const router = express.Router();

  router.use(express.json());
  router.use(logMiddleware);

  router.use("/admin", getAdminRouter(db));
  router.use("/client", getClientRouter(db));

  router.use(errorMiddleware);

  return router;
}
