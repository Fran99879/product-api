import { z } from "zod";

export const deleteUploadSchema = z.object({
  publicId: z.string().trim().min(1, "publicId requerido"),
});
