import { z } from 'zod'

export const changeUserRoleParamsSchema = z.object({
  id: z.string().min(1, 'User id is required'),
})

export const changeUserRoleBodySchema = z.object({
  role: z.enum(['user', 'seller', 'admin']),
})

export const validateChangeUserRoleParams = (input: unknown) =>
  changeUserRoleParamsSchema.safeParse(input)

export const validateChangeUserRoleBody = (input: unknown) =>
  changeUserRoleBodySchema.safeParse(input)
