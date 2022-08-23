import {assertCollectionExists, validateAddresses} from "./utils";
import {Sale, Whitelist, Addresses, Batch} from "./types";
import {saleCollection, saleDoc} from "./constants";
import {Record, String, Static} from "runtypes";
import {Response, Request, NextFunction} from "express";
import {FieldPath, Firestore} from "firebase-admin/firestore";
import {union, difference} from "lodash";
import MerkleTree from "merkletreejs";
import {keccak256} from "ethers/lib/utils";

const Params = Record({
  batch: String,
  whitelist: String,
});
type Params = Static<typeof Params>

function getMerkleRoot(addresses: Addresses): string {
  const leaves = addresses.map((address) => keccak256(address));
  const tree = new MerkleTree(leaves, keccak256, {sort: true});
  const root = tree.getHexRoot();
  return root;
}

export class Admin {
  constructor(public db: Firestore) {
    // NOTE: make sure that `this` stays bound to the object when passed as a handler
    this.addWhitelist = this.addWhitelist.bind(this);
    this.removeWhitelist = this.removeWhitelist.bind(this);
    this.addAddresses = this.addAddresses.bind(this);
    this.removeAddresses = this.removeAddresses.bind(this);
    this.setSale = this.setSale.bind(this);
    this.getBatch = this.getBatch.bind(this);
    this.validateSale = this.validateSale.bind(this);
  }

  private async validateSale(sale: Sale) {
    if (sale.endTimestamp< sale.startTimestamp) {
      throw new Error( `sale ends (${sale.endTimestamp}) before sale start (${sale.startTimestamp})`);
    }
    await assertCollectionExists(this.db, sale.batch);
  }

  async addWhitelist(
      req: Request<Params, Whitelist | Error, Whitelist>,
      res: Response<Whitelist | Error>,
      next: NextFunction,
  ) {
    try {
      Params.check(req.params);
      Whitelist.check(req.body);

      const whitelist = req.body;
      validateAddresses(whitelist.addresses);
      const ref = this.db.collection(req.params.batch).doc(req.params.whitelist);
      await ref.set(whitelist);
      const updated = await ref.get();
      const updatedData = updated.data() as Whitelist;
      Whitelist.check(updatedData);
      res.json(updatedData);
    } catch (err) {
      next(err);
    }
  }

  async removeWhitelist(
      req: Request<Params, Params | Error>,
      res: Response<Params | Error>,
      next: NextFunction,
  ) {
    try {
      Params.check(req.params);
      const ref = this.db.collection(req.params.batch).doc(req.params.whitelist);
      await ref.delete();
      res.json(req.params);
    } catch (err) {
      next(err);
    }
  }

  async addAddresses(
      req: Request<Params, Addresses | Error, Addresses>,
      res: Response<Addresses | Error>,
      next: NextFunction,
  ) {
    try {
      Params.check(req.params);
      Addresses.check(req.body);
      validateAddresses(req.body);

      const ref = this.db.collection(req.params.batch).doc(req.params.whitelist);
      const old = await ref.get();
      const oldData = old.data() as Whitelist;
      Addresses.check(oldData.addresses);

      // HACK: the firestore arrayUnion is broken
      const whitelist = {addresses: union(oldData.addresses, req.body)};
      await ref.update(whitelist);
      const updated = await ref.get();
      const updatedData = updated.data() as Whitelist;
      Addresses.check(updatedData.addresses);
      res.json(updatedData.addresses);
    } catch (err) {
      next(err);
    }
  }

  async removeAddresses(
      req: Request<Params, Addresses | Error, Addresses>,
      res: Response<Addresses | Error>,
      next: NextFunction,
  ) {
    try {
      Params.check(req.params);
      Addresses.check(req.body);
      validateAddresses(req.body);

      const ref = this.db.collection(req.params.batch).doc(req.params.whitelist);
      const old = await ref.get();
      const oldData = old.data() as Whitelist;
      Addresses.check(oldData.addresses);

      // HACK: the firestore arrayRemove is broken
      const whitelist = {addresses: difference(oldData.addresses, req.body)};
      await ref.update(whitelist);
      const updated = await ref.get();
      const updatedData = updated.data() as Whitelist;
      Addresses.check(updatedData.addresses);
      res.json(updatedData.addresses);
    } catch (err) {
      next(err);
    }
  }

  async setSale(
      req: Request<unknown, Sale | Error, Sale>,
      res: Response<Sale | Error>,
      next: NextFunction,
  ) {
    try {
      Sale.check(req.body);
      await this.validateSale(req.body);

      const ref = this.db.collection(saleCollection).doc(saleDoc);
      await ref.set(req.body);
      const updated = await ref.get();
      const data = updated.data() as Sale;
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async getBatch(
      _: Request,
      res: Response<Batch | Error>,
      next: NextFunction,
  ) {
    try {
      const saleSnapshot = await this.db.collection(saleCollection).doc(saleDoc).get();
      const sale = saleSnapshot.data() as Sale;
      Sale.check(sale);

      const batch: Batch = {
        allocations: [],
        tierCodes: [],
        merkleRoots: [],
      };

      await this.db.collection(sale.batch)
          .orderBy(FieldPath.documentId())
          .get()
          .then((result) => {
            result.forEach((whitelistDoc) => {
              const whitelist = whitelistDoc.data() as Whitelist;
              Whitelist.check(whitelist);
              batch.allocations.push(whitelist.allocation);
              batch.tierCodes.push(whitelist.tierCode);
              batch.merkleRoots.push(getMerkleRoot(whitelist.addresses));
            });
          });

      res.json(batch);
    } catch (err) {
      next(err);
    }
  }
}
