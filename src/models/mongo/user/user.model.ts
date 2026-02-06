import type { UserModel } from '../../UserModel.js'
import type { User } from '../../../types/user.js'
import { UserMongo } from './user.js'

function mapMongoUser(doc: any): User {
  return {
    id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    password: doc.password,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const MongoUserModel: UserModel = {
  async findByEmail({ email }) {
    const user = await UserMongo.findOne({ email })
    if (!user) return null
    return mapMongoUser(user)
  },

  async findById({ id }) {
    const user = await UserMongo.findById(id)
    if (!user) return null
    return mapMongoUser(user)
  },

  async create({ input }) {
    const user = new UserMongo(input)
    await user.save()
    return mapMongoUser(user)
  },

  async updateRole({ id, role }) {
    const user = await UserMongo.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    )
    if (!user) return null
    return mapMongoUser(user)
  },

  async getAll() {
    const users = await UserMongo.find()
    return users.map(mapMongoUser)
  }
}
