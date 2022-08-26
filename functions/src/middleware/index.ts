import {Request, Response, NextFunction} from "express";
import * as functions from "firebase-functions";
import createHttpError from "http-errors";
import {StatusCodes} from "http-status-codes";

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
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
  }
}
