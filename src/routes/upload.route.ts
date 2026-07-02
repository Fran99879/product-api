import { Router } from "express";
import { authRequired } from "../middlewares/validateToken.js";
import { requireRoles } from "../middlewares/role.middleware.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { deleteUploadSchema } from "../schemas/upload.js";
import {
  getUploadSignature,
  deleteUpload,
} from "../controllers/upload/upload.controller.js";

const uploadRouter = Router();

// Solo sellers/admin pueden pedir firma de subida (son los que crean productos).
uploadRouter.post(
  "/signature",
  authRequired,
  requireRoles("seller", "admin"),
  getUploadSignature
);

// Borrado de asset (limpieza de imágenes huérfanas de la sesión).
uploadRouter.delete(
  "/",
  authRequired,
  requireRoles("seller", "admin"),
  validateSchema(deleteUploadSchema),
  deleteUpload
);

export default uploadRouter;
