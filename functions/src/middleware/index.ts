import {Request, Response, NextFunction} from "express";
import * as functions from "firebase-functions";
import createHttpError from "http-errors";
import admin from "firebase-admin";

export function logMiddleware(req: Request, _: Response, next: NextFunction) {
  functions.logger.log({path: req.path, req: req.body});
  next();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: Error, req: Request, res: Response, _: NextFunction) {
  functions.logger.error({err: err, path: req.path, req: req.body});
  if (createHttpError.isHttpError(err)) {
    res.status(err.statusCode).json(err);
  } else {
    res.status(500).json(err);
  }
}

export async function validateFirebaseIdToken(req: Request, res: Response, next: NextFunction) {
  if ((!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) &&
        !(req.cookies && req.cookies.__session)) {
    res.status(403).send("Unauthorized");
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else if (req.cookies) {
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send("Unauthorized");
    return;
  }

  try {
    await admin.auth().verifyIdToken(idToken);
    next();
    return;
  } catch (error) {
    res.status(403).send("Unauthorized: Error while verifying Firebase ID token");
    return;
  }
}


