import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import User from '../../models/mongo/user/user.js'
import { createAccessToken } from '../../utils/jwt.js'
import { validateRegister, validateLogin } from '../../schemas/auth.js'
import type { AuthenticatedRequest } from '../../types/request.js'

export const register = async (req: Request, res: Response) => {
  const result = validateRegister(req.body)

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.issues
    })
  }

  const { email, password, username} = result.data

  try {
    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = new User({
      username,
      email,
      password: passwordHash,
      role: 'user'
    })

    const userSaved = await newUser.save()

    const token = await createAccessToken({
      id: userSaved._id.toString(),
      role: userSaved.role
    })

    res.cookie('token', token, { httpOnly: true })

    res.status(201).json({
      id: userSaved._id.toString(),
      username: userSaved.username,
      email: userSaved.email,
      role: userSaved.role,
      createdAt: userSaved.createdAt
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error registering user' })
  }
}

export const login = async (req: Request, res: Response) => {
  const result = validateLogin(req.body)

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.issues
    })
  }

  const { email, password } = result.data

  try {
    const userFound = await User.findOne({ email })

    if (!userFound) {
      return res.status(400).json({ message: 'User not found' })
    }

    const isMatch = await bcrypt.compare(password, userFound.password)

    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' })
    }

    const token = await createAccessToken({
      id: userFound._id.toString(),
      role: userFound.role
    })

    res.cookie('token', token, { httpOnly: true })

    res.json({
      id: userFound._id.toString(),
      username: userFound.username,
      email: userFound.email,
      role: userFound.role
    })
  } catch {
    return res.status(500).json({ message: 'Login error' })
  }
}

export const logout = (_req: Request, res: Response) => {
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true
  })

  return res.json({ message: 'Session closed' })
}

export const profile = async (req: AuthenticatedRequest, res: Response) => {
  const userFound = await User.findById(req.user.id)

  if (!userFound) {
    return res.status(404).json({ message: 'User not found' })
  }

  res.json({
    id: userFound._id.toString(),
    username: userFound.username,
    email: userFound.email,
    role: userFound.role,
    createdAt: userFound.createdAt
  })
}
