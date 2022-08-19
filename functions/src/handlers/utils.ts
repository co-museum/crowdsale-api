import * as logger from "firebase-functions/lib/logger";
import {Addresses, Error} from "./types";
import {Response} from "express";
import {ethers} from "ethers";
import {StatusCodes} from "http-status-codes";

export enum LogLevel {
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error",
}

interface LogMessage {
  handler: string
  error?: unknown
  body?: unknown
  params?: unknown
}

export function log(msg: LogMessage, lvl?: LogLevel) {
  if (lvl == undefined) {
    lvl = msg.error ? LogLevel.error : LogLevel.info;
  }
  logger[lvl](msg);
}

export function validateAddresses(handler: string, addresses: Addresses, res: Response<Error>) {
  addresses.map((address) => {
    if (!ethers.utils.isAddress(address)) {
      log({handler: handler, error: `${address} is not an address`});
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({error: `${address} is not an address`});
    }
  });
}

