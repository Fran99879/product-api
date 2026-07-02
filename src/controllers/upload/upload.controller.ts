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

/**
 * Borra un asset de Cloudinary por `public_id`. Se usa para limpiar imágenes
 * huérfanas de la sesión (el seller subió una imagen y la reemplazó/quitó antes
 * de guardar el producto). Guard: solo permite borrar dentro de nuestro folder,
 * así una firma robada no puede destruir assets ajenos de la cuenta.
 */
export const deleteUpload = async (req: Request, res: Response) => {
  const { publicId } = req.body as { publicId: string };

  if (!publicId.startsWith(`${CLOUDINARY_FOLDER}/`)) {
    return res.status(403).json({ message: "public_id fuera del folder permitido" });
  }

  const result = await cloudinary.uploader.destroy(publicId);

  // Cloudinary devuelve "ok" o "not found"; ambos dejan el storage sin el asset.
  if (result.result !== "ok" && result.result !== "not found") {
    return res.status(502).json({ message: "No se pudo borrar la imagen" });
  }

  return res.json({ result: result.result });
};
