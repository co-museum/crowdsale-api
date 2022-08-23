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

const bearerPrefix = "Bearer ";

function getBearerToken(authHeader: string): string {
  return authHeader.split("Bearer ")[1];
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.headers.authorization || !req.headers.authorization.startsWith(bearerPrefix)) {
    next(new createHttpError.Unauthorized("no bearer token"));
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const idToken = getBearerToken(req.headers.authorization!);
    await admin.auth().verifyIdToken(idToken);
    next();
  } catch (err) {
    next(createHttpError(createHttpError.Forbidden, err as Error));
  }
}
