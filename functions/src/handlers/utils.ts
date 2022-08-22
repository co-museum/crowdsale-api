import {Addresses} from "./types";
import {ethers} from "ethers";
import {FieldPath, Firestore} from "firebase-admin/firestore";
import createHttpError from "http-errors";

export function validateAddresses(addresses: Addresses) {
  addresses.map((address) => {
    if (!ethers.utils.isAddress(address)) {
      throw new createHttpError.BadRequest(`${address} is not an address`);
    }
  });
}

export async function assertCollectionExists(db: Firestore, collection: string) {
  const docs = await db.collection(collection).select(FieldPath.documentId()).limit(1).get();
  if (docs.docs.length == 0) {
    throw new createHttpError.NotFound(`${collection} does not exist`);
  }
}
