import {Request, Response, NextFunction} from "express";
import * as functions from "firebase-functions";
import createHttpError from "http-errors";

export function logMiddleware(req: Request, res: Response, next: NextFunction) {
  functions.logger.log({req: req, res: res});
  next();
}

export function httpErrorMiddleware(err: unknown, req: Request, res: Response, next: NextFunction) {
  functions.logger.error({err: err, req: req, res: res});
  if (createHttpError.isHttpError(err)) {
    res.status(err.statusCode).send(err);
  }
  // fallback to default error handler
  next(err);
}
