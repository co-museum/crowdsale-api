import express, {Router} from "express";
import {Auth} from "firebase-admin/auth";
import {Firestore} from "firebase-admin/firestore";
import {Admin} from "../controllers/admin";

export default function getAdminRouter(db: Firestore, auth: Auth): Router {
  const adminRouter = express.Router();
  const whitelistRouter = express.Router();
  const addressRouter = express.Router();
  const admin = new Admin(db, auth);

  whitelistRouter.put("/:batch/:whitelist", admin.addWhitelist);
  whitelistRouter.delete("/:batch/:whitelist", admin.removeWhitelist);
  addressRouter.put("/:batch/:whitelist", admin.addAddresses);
  addressRouter.delete("/:batch/:whitelist", admin.removeAddresses);

  adminRouter.use(admin.authMiddleware);
  adminRouter.use("/whitelist", whitelistRouter);
  adminRouter.use("/address", addressRouter);
  adminRouter.put("/sale", admin.setSale);
  adminRouter.get("/batch", admin.getBatch);

  return adminRouter;
}
