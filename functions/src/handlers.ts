import logger from "firebase-functions/lib/logger";
import {Record, Number, String, Array, Static} from "runtypes";
import {Request, Response} from "express";
import {getFirestore} from "firebase-admin/firestore";
import {StatusCodes} from "http-status-codes";
import {ethers} from "ethers";

const Whitelist = Record({
  tierCode: Number,
  allocation: Number,
  addresses: Array(String),
});
type Whitelist = Static<typeof Whitelist>

const AddWhitelistParams = Record({
  batch: String,
  whitelist: String,
});
type AddWhitelistParams = Static<typeof AddWhitelistParams>

/**
 * adds entire whitelist document to firestore
 * @param {Request} req the whitelist to add into specified batch under specified name
 * @param {Response} res the whitelist actually written to the db
 **/
export async function addWhitelist(
    req: Request<AddWhitelistParams>,
    res: Response
) {
  try {
    logger.error("posting whitelist:", req.body);
    AddWhitelistParams.check(req.params);
    Whitelist.check(req.body);
    const whitelist: Whitelist = req.body;

    whitelist.addresses.map((address) => {
      if (!ethers.utils.isAddress(address)) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).send(`${address} is not an address`);
      }
    });

    const db = getFirestore();
    const ref = db.collection(req.params.batch).doc(req.params.whitelist);
    await ref.set(req.body.whitelist);
    const document = await ref.get();
    res.status(StatusCodes.OK).json(document.data());
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err);
  }
}
