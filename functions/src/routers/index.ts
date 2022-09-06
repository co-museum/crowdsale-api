import express, {Router, Request, Response, NextFunction} from "express";
import {Auth} from "firebase-admin/auth";
import {Firestore} from "firebase-admin/firestore";
import getAdminRouter from "./admin";
import getClientRouter from "./client";
import * as functions from "firebase-functions";
import createHttpError from "http-errors";
import {StatusCodes} from "http-status-codes";

function logMiddleware(req: Request, _: Response, next: NextFunction) {
  functions.logger.log({path: req.path, req: req.body});
  next();
}

function corsMiddleware(_: Request, res: Response, next: NextFunction) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorMiddleware(err: Error, req: Request, res: Response, _: NextFunction) {
  functions.logger.error({err: err, path: req.path, req: req.body});
  if (createHttpError.isHttpError(err)) {
    res.status(err.statusCode).json(err);
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
  }
}

// NOTE: db and auth are injectable to enable mocking
export default function getRouter(db: Firestore, auth: Auth): Router {
  const router = express.Router();

  router.use(express.json());
  router.use(logMiddleware);
  router.use(corsMiddleware);

  router.use("/admin", getAdminRouter(db, auth));
  router.use("/client", getClientRouter(db));

  router.use(errorMiddleware);

  return router;
}
