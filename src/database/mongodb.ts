import mongoose from 'mongoose'

export async function connectMongo () {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('connection error')
    console.error(error)
    process.exit(1)
  }
}
