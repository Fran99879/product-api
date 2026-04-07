import type { Request, Response } from 'express'
import type { UserModel } from '../../models/user.model.js'
import { validateChangeUserRoleParams, validateChangeUserRoleBody } from '../../schemas/user.js'
import { assertUser } from '../../utils/assertUser.js'

export const createUserController = (userModel: UserModel) => {
  const updateUserRole = async (req: Request, res: Response) => {
    assertUser(req)

    // ✅ validar params
    const paramsResult = validateChangeUserRoleParams(req.params)
    if (!paramsResult.success) {
      return res.status(400).json({ errors: paramsResult.error.issues })
    }

    // ✅ validar body
    const bodyResult = validateChangeUserRoleBody(req.body)
    if (!bodyResult.success) {
      return res.status(400).json({ errors: bodyResult.error.issues })
    }

    const { id } = paramsResult.data
    const { role } = bodyResult.data

    const updatedUser = await userModel.updateRole({ id, role })

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
    })
  }

  return { updateUserRole }
}
