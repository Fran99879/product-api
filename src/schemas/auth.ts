import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string().min(1, 'Username is required'),

  email: z.string().min(1, 'Email is required').email('Email is not valid'),

  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const validateRegister = (input: unknown) => {
  return registerSchema.safeParse(input)
}

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),

  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const validateLogin = (input: unknown) => {
  return loginSchema.safeParse(input)
}

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>

export const validateForgotPassword = (input: unknown) =>
  forgotPasswordSchema.safeParse(input)

export const validateResetPassword = (input: unknown) =>
  resetPasswordSchema.safeParse(input)

export const validateVerifyEmail = (input: unknown) =>
  verifyEmailSchema.safeParse(input)
