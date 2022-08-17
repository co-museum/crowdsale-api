import * as logger from "firebase-functions/lib/logger";
import {Record, Number, String, Array, Static} from "runtypes";
import {Request, Response} from "express";
import {Firestore} from "firebase-admin/firestore";
import {union, difference} from "lodash";
import {StatusCodes} from "http-status-codes";
import {ethers} from "ethers";

enum Handler {
  AddWhitelist = "addWhitelist",
  RemoveWhitelist = "removeWhitelist",
  AddAddresses = "addAddresses",
  RemoveAddresses = "removeAddresses",
}

/**
 * Log request parameters relevant to this module
 * @param {Handler} handler function
 * @param {Params} params from url
 * @param {any} body of request
 */
function logRequest(handler: Handler, params: Params, body: unknown) {
  logger.log({
    handler: handler,
    params: params,
    body: body,
  });
}

/**
 * @param {Handler} handler function
 * @param {any} err to log - no matter the type
 * @param {Response} res to write to
 */
function handleError(handler: Handler, err: unknown, res: Response) {
  logger.error({
    handler: handler,
    error: err,
  });
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: err});
}

const Whitelist = Record({
  tierCode: Number,
  allocation: Number,
  addresses: Array(String),
});
type Whitelist = Static<typeof Whitelist>

const Addresses = Array(String);

type Addresses = Static<typeof Addresses>

const Params = Record({
  batch: String,
  whitelist: String,
});

type Params = Static<typeof Params>

/**
 * utility to check whether an array of addresses is valid and report the error in result
 * @param {Handler} handler the validation was done in
 * @param {string[]} addresses addresses to validate
 * @param {Response} res response object
 */
function validateAddresses(handler: Handler, addresses: string[], res: Response) {
  addresses.map((address) => {
    if (!ethers.utils.isAddress(address)) {
      logger.error({
        handler: handler,
        error: `${address} is not an address`,
      });
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({error: `${address} is not an address`});
    }
  });
}

/**
 * Admin handler class
 */
export class Admin {
  db: Firestore;
  /**
   * Dependency injection point
   * @param {Firestore} db firestore instance
   */
  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * adds entire whitelist document to firestore
   * @param {Request<Params>} req the whitelist to add into specified batch under specified name
   * @param {Response<Whitelist>} res the whitelist actually written to the db
   **/
  async addWhitelist(
      req: Request<Params>,
      res: Response
  ) {
    try {
      logRequest(Handler.AddWhitelist, req.params, req.body);
      Params.check(req.params);
      Whitelist.check(req.body);
      const whitelist: Whitelist = req.body;
      validateAddresses(Handler.AddWhitelist, whitelist.addresses, res);

      const ref = this.db.collection(req.params.batch).doc(req.params.whitelist);
      await ref.set(whitelist);
      const document = await ref.get();
      res.status(StatusCodes.OK).json(document.data());
    } catch (err) {
      handleError(Handler.AddWhitelist, err, res);
    }
  }

  /**
   * remove entire whitelist document from
   * @param {Request<Params>} req the whitelist to add into specified batch under specified name
   * @param {Response} res params echoed back if OK
   **/
  async removeWhitelist(
      req: Request<Params>,
      res: Response
  ) {
    try {
      logRequest(Handler.RemoveWhitelist, req.params, req.body);
      Params.check(req.params);

      const ref = this.db.collection(req.params.batch).doc(req.params.whitelist);
      await ref.delete();
      res.status(StatusCodes.OK).json(req.params);
    } catch (err) {
      handleError(Handler.RemoveWhitelist, err, res);
    }
  }

  /**
   * adds addresses in body to specified whitelist
   * @param {Request<Params>} req
   * @param {Response} res the current whitelist in db if OK
   **/
  async addAddresses(
      req: Request<Params>,
      res: Response,
  ) {
    try {
      logRequest(Handler.AddAddresses, req.params, req.body);
      Params.check(req.params);
      Addresses.check(req.body);
      validateAddresses(Handler.AddAddresses, req.body, res);
      logger.log("addresses ok");
      logger.log("db", {foo: this.db});

      const ref = this.db.collection(req.params.batch).doc(req.params.whitelist);
      logger.log("ref ok");
      const old = await (await ref.get()).data() as Whitelist;
      logger.log("old ok");
      // HACK: the firestore arrayUnion and arrayRemove are broken
      const whitelist = {addresses: union(old.addresses, req.body)};
      logger.log("union ok");
      await ref.update(whitelist);
      logger.log("update ok");
      const updated = await ref.get();
      res.status(StatusCodes.OK).json(updated.data());
    } catch (err) {
      handleError(Handler.AddAddresses, err, res);
    }
  }

  /**
   * removes addresses in body from specified whitelist
   * @param {Request<Params>} req
   * @param {Response} res the current whitelist in db if OK
   **/
  async removeAddresses(
      req: Request<Params>,
      res: Response,
  ) {
    try {
      logRequest(Handler.RemoveAddresses, req.params, req.body);
      Params.check(req.params);
      Addresses.check(req.body);
      validateAddresses(Handler.RemoveAddresses, req.body, res);

      const ref = this.db.collection(req.params.batch).doc(req.params.whitelist);
      const old = await (await ref.get()).data() as Whitelist;
      // HACK: the firestore arrayUnion and arrayRemove are broken
      const whitelist = {addresses: difference(old.addresses, req.body)};
      await ref.update(whitelist);
      const updated = await ref.get();
      res.status(StatusCodes.OK).json(updated.data());
    } catch (err) {
      handleError(Handler.RemoveAddresses, err, res);
    }
  }
}
