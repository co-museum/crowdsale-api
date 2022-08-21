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


export function validateSale(handler: string, startTimestamp: number, endTimestamp: number, res: Response<Error>) {
  if (endTimestamp < startTimestamp) {
    const err = new Error( `${endTimestamp} is before ${startTimestamp}`);
    log({handler: handler, error: err});
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(err);
  }
}


export function validateSaleBatch(collectionList: string[], handler: string, batch: string, res: Response<Error>) {
  if (collectionList.indexOf(batch) == -1) {
    const err = new Error(`${batch} does not exist`);
    log({handler: handler, error: err});
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(err);
  }
}
