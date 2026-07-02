import rateLimit from 'express-rate-limit'

// En tests (vitest setea NODE_ENV=test) no limitamos: los beforeEach
// registran usuarios en cada test y pisarían el límite.
const isTestEnv = () => process.env.NODE_ENV === 'test'

// Limitador global: aplica a toda la API.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
})

// Limitador estricto para endpoints de autenticación (login/register).
// Frena fuerza bruta de credenciales.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
  message: {
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
})
