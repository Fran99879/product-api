import type { Request, Response } from "express";
import { cloudinary, CLOUDINARY_FOLDER } from "../../config/cloudinary.js";

/**
 * Devuelve una firma para que el frontend suba la imagen DIRECTO a Cloudinary
 * (signed direct upload). El api_secret nunca sale del backend: acá solo se
 * firman los params que el cliente enviará (timestamp + folder).
 */
export const getUploadSignature = (_req: Request, res: Response) => {
  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: CLOUDINARY_FOLDER },
    cloudinary.config().api_secret as string
  );

  return res.json({
    signature,
    timestamp,
    folder: CLOUDINARY_FOLDER,
    apiKey: cloudinary.config().api_key,
    cloudName: cloudinary.config().cloud_name,
  });
};
