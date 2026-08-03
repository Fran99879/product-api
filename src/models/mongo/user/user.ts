import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      // Requerida solo para cuentas locales; las de Google no tienen contraseña.
      required: function (this: { provider?: string }) {
        return this.provider !== 'google'
      },
    },
    // Proveedor de autenticación: 'local' (email + contraseña) o 'google' (OAuth).
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    // ID del usuario en el proveedor externo (el `sub` de Google). Solo OAuth.
    providerId: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'seller', 'admin'],
      default: 'user',
    },
    // Reset de contraseña (F11.7). `select:false` → nunca salen en queries
    // normales. Se guarda el HASH del token, no el token en claro.
    resetPasswordTokenHash: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    // Verificación de email (F11.7). Mismo criterio: hash + `select:false`.
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationTokenHash: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    // Mercado Pago (F-pagos): Access Token del vendedor para cobrar en su cuenta.
    // `select:false` → nunca sale en queries normales; se pide explícito solo al cobrar.
    mpAccessToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
)

// Único por proveedor externo (sparse: solo cuentas OAuth lo tienen).
userSchema.index({ providerId: 1 }, { unique: true, sparse: true })

export const UserMongo = mongoose.model('User', userSchema)
