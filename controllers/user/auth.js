import User from '../../models/mongo/user/user.js'
import bcrypt from 'bcryptjs'
import { createAccessToken } from '../../utils/jwt.js'

export const register = async (req, res) => {
  const { email, password, username } = req.body

  try {
    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = new User({
      username,
      email,
      password: passwordHash
    })

    const userSave = await newUser.save()
    const token = await createAccessToken({ id: userSave._id })

    res.cookie("token", token)
    res.json({
      id: userSave._id,
      username: userSave.username,
      email: userSave.email,
      createdAt: userSave.createdAt,
      updatedAt: userSave.updatedAt
    })
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body

  try {
    const userFound = await User.findOne({ email })

    if (!userFound) return res.status(400).json({ message: "User not found" })

    const isMatch = await bcrypt.compare(password, userFound.password)

    if (!isMatch) return res.status(400).json({ message: "Incorrect password" })

    const token = await createAccessToken({
      id: userFound._id,
      role: userFound.role
    })

    res.cookie("token", token)
    res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
      createdAt: userFound.createdAt,
      updatedAt: userFound.updatedAt
    })
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
}

export const logout = (req, res) => {
  res.cookie('token', "", {
    expires: new Date(0),
  })
  return res.status(200).json({ message: "closed session" })
}

export const profile = async (req, res) => {
  const userFound = await User.findById(req.user.id)
  if (!userFound) return res.status(400).json({ message: "User not found" })

  return res.json({
    id: userFound._id,
    username: userFound.username,
    email: userFound.email,
    createdAt: userFound.createdAt,
    updatedAt: userFound.updatedAt
  })
}