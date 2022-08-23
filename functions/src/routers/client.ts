import express, {Router} from "express";
import {Firestore} from "firebase-admin/firestore";
import {Client} from "../controllers/client";

export default function getClientRouter(db: Firestore): Router {
  const clientRouter = express.Router();
  const client = new Client(db);

  clientRouter.get("/proof/:address", client.getProof);
  clientRouter.get("/sale", client.getSale);

  return clientRouter;
}
