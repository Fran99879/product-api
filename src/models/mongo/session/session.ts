import mongoose from "mongoose";

/**
 * Sesión de refresh token (F11.7). Guardamos el HASH del token (nunca el crudo).
 * Permite rotación (invalidar el viejo al refrescar) y revocar sesiones.
 */
const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index: Mongo borra la sesión automáticamente cuando pasa expiresAt.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionMongo = mongoose.model("Session", sessionSchema);
