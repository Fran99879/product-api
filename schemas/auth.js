import { z } from 'zod'

export const registerSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required'),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Email is not valid'),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
})

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email'),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
})
