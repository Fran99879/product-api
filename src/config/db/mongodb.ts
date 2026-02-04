import mongoose from 'mongoose'
import { ENV } from '../env.js'

export async function connectMongo () {
  try {
    await mongoose.connect(ENV.MONGO_URI)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('connection error')
    console.error(error)
    process.exit(1)
  }
}
