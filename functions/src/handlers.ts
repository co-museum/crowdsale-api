import * as logger from "firebase-functions/lib/logger";
import {Record, Number, String, Array, Static} from "runtypes";
import {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";
import {union} from "lodash";
import {StatusCodes} from "http-status-codes";
import {ethers} from "ethers";

const handlerNames = {
  addWhitelist: "addWhitelist",
  removeWhitelist: "removeWhitelist",
  addAddresses: "addAddresses",
  removeAddresses: "removeAddresses",
};

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
 * @param {string[]} addresses  addresses to validate
 * @param {Response} res response object
 */
function validateAddresses(addresses: string[], res: Response) {
  addresses.map((address) => {
    if (!ethers.utils.isAddress(address)) {
      logger.error({
        handler: handlerNames.addWhitelist,
        error: `${address} is not an address`,
      });
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({error: `${address} is not an address`});
    }
  });
}

/**
 * adds entire whitelist document to firestore
 * @param {Request<Params>} req the whitelist to add into specified batch under specified name
 * @param {Response<Whitelist>} res the whitelist actually written to the db
 **/
export async function addWhitelist(
    req: Request<Params>,
    res: Response
) {
  try {
    logger.log({
      handler: handlerNames.addWhitelist,
      params: req.params,
      body: req.body,
    });
    Params.check(req.params);
    Whitelist.check(req.body);
    const whitelist: Whitelist = req.body;
    validateAddresses(whitelist.addresses, res);

    const db = getFirestore();
    const ref = db.collection(req.params.batch).doc(req.params.whitelist);
    await ref.set(whitelist);
    const document = await ref.get();
    res.status(StatusCodes.OK).json(document.data());
  } catch (err) {
    logger.error({
      handler: handlerNames.addWhitelist,
      error: err,
    });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: err});
  }
}

/**
 * remove entire whitelist document from
 * @param {Request<Params>} req the whitelist to add into specified batch under specified name
 * @param {Response} res params echoed back if OK
 **/
export async function removeWhitelist(
    req: Request<Params>,
    res: Response
) {
  try {
    logger.log({
      handler: handlerNames.removeWhitelist,
      params: req.params,
    });
    Params.check(req.params);

    const db = getFirestore();
    const ref = db.collection(req.params.batch).doc(req.params.whitelist);
    await ref.delete();
    res.status(StatusCodes.OK).json(req.params);
  } catch (err) {
    logger.error({
      handler: handlerNames.removeWhitelist,
      error: err,
    });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: err});
  }
}

/**
 * adds addresses in body to specified whitelist
 * @param {Request<Params>} req
 * @param {Response} res the current whitelist in db if OK
 **/
export async function addAddresses(
    req: Request<Params>,
    res: Response,
) {
  try {
    logger.log({
      handler: handlerNames.addAddresses,
      params: req.params,
      body: req.body,
    });
    Params.check(req.params);
    logger.log("params ok");
    Addresses.check(req.body);
    validateAddresses(req.body, res);

    const db = getFirestore();
    const ref = db.collection(req.params.batch).doc(req.params.whitelist);
    const old = await ref.get() as unknown as Whitelist;
    // HACK: the firestore arrayUnion and arrayRemove are broken
    const whitelist = {addresses: union(old.addresses, req.body)};
    logger.log("whitelist", whitelist);
    await ref.update(whitelist);
    logger.log("update ok");
    await ref.update(whitelist);
    const updated = await ref.get();
    res.status(StatusCodes.OK).json(updated.data());
  } catch (err) {
    logger.error({
      handler: handlerNames.addWhitelist,
      error: err,
    });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: err});
  }
}

/**
 * remove addresses in body to specified whitelist
 * @param {Request<Params>} req
 * @param {Response} res the current whitelist in db if OK
 **/
export async function removeAddresses(
    req: Request<Params>,
    res: Response,
) {
  try {
    logger.log({
      handler: handlerNames.removeAddresses,
      params: req.params,
      body: req.body,
    });
    Params.check(req.params);
    Addresses.check(req.body);

    const db = getFirestore();
    const ref = db.collection(req.params.batch).doc(req.params.whitelist);
    const document = await ref.get();
    res.status(StatusCodes.OK).json(document.data());
  } catch (err) {
    logger.error({
      handler: handlerNames.removeAddresses,
      error: err,
    });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: err});
  }
}
