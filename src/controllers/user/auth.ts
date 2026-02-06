import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { createAccessToken } from '../../utils/jwt.js'
import { validateRegister, validateLogin } from '../../schemas/auth.js'
import type { UserModel } from '../../models/UserModel.js'

export const createAuthController = (userModel: UserModel) => {

  const register = async (req: Request, res: Response) => {
    const result = validateRegister(req.body)

    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues })
    }

    const { email, password, username } = result.data

    try {
      
      const passwordHash = await bcrypt.hash(password, 10)

      const userSaved = await userModel.create({
        input: {
          username,
          email,
          password: passwordHash,
          role: 'user'
        }
      })

      const token = await createAccessToken({
        id: userSaved.id,
        role: userSaved.role
      })

      res.cookie('token', token, { httpOnly: true })

      res.status(201).json({
        id: userSaved.id,
        username: userSaved.username,
        email: userSaved.email,
        role: userSaved.role,
        createdAt: userSaved.createdAt
      })

    } catch {
      return res.status(500).json({ message: 'Error registering user' })
    }
  }

  const login = async (req: Request, res: Response) => {
    const result = validateLogin(req.body)

    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues })
    }

    const { email, password } = result.data

    try {
      const userFound = await userModel.findByEmail({ email })

      if (!userFound) {
        return res.status(400).json({ message: 'User not found' })
      }

      const isMatch = await bcrypt.compare(password, userFound.password)

      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password' })
      }

      const token = await createAccessToken({
        id: userFound.id,
        role: userFound.role
      })

      res.cookie('token', token, { httpOnly: true })

      res.json({
        id: userFound.id,
        username: userFound.username,
        email: userFound.email,
        role: userFound.role
      })

    } catch {
      return res.status(500).json({ message: 'Login error' })
    }
  }

  const logout = (_req: Request, res: Response) => {
    res.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true
    })

    return res.json({ message: 'Session closed' })
  }

  const profile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const userFound = await userModel.findById({ id: req.user.id })

  if (!userFound) {
    return res.status(404).json({ message: 'User not found' })
  }

  res.json({
    id: userFound.id,
    username: userFound.username,
    email: userFound.email,
    role: userFound.role,
    createdAt: userFound.createdAt
  })
}


  return { register, login, logout, profile }
}
