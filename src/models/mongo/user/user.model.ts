import mongoose from 'mongoose'
import { UserMongo } from './user.js'

import type { UserModel } from '../../user.model.js'
import type { User } from '../../../types/user.js'

const mapDocToUser = (doc: any): User => ({
  id: doc._id.toString(),
  username: doc.username,
  email: doc.email,
  password: doc.password,
  role: doc.role,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

export const MongoUserModel: UserModel = {
  async findByEmail ({ email }) {
    const doc = await UserMongo.findOne({ email })
    return doc ? mapDocToUser(doc) : null
  },

  async findById ({ id }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    const doc = await UserMongo.findById(id)
    return doc ? mapDocToUser(doc) : null
  },

  async create ({ input }) {
    const doc = await UserMongo.create(input)
    return mapDocToUser(doc)
  },

  async updateRole ({ id, role }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null

    const doc = await UserMongo.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    )

    return doc ? mapDocToUser(doc) : null
  },

  async getAll () {
    const docs = await UserMongo.find()
    return docs.map(mapDocToUser)
  }
}
