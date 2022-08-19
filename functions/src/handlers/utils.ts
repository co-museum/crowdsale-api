import * as logger from "firebase-functions/lib/logger";
import {Addresses} from "./types";
import {Response} from "express";
import {ethers} from "ethers";
import {StatusCodes} from "http-status-codes";

export enum LogLevel {
  Debug = "debug",
  Info = "info",
  Warn = "warn",
  Error = "error",
}

interface LogMessage {
  handler: string
  error?: unknown
  body?: unknown
  params?: unknown
}

export function log(msg: LogMessage, lvl?: LogLevel) {
  if (lvl == undefined) {
    lvl = msg.error ? LogLevel.Error : LogLevel.Info;
  }
  logger[lvl](msg);
}

export function validateAddresses(handler: string, addresses: Addresses, res: Response<Error>) {
  addresses.map((address) => {
    if (!ethers.utils.isAddress(address)) {
      const err = new Error( `${address} is not an address`);
      log({handler: handler, error: err});
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(err);
    }
  });
}

