import mongoose from 'mongoose'

export async function connectMongo () {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) throw new Error('MONGO_URI is not defined')
  
  try {
    await mongoose.connect(mongoUri)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('connection error')
    console.error(error)
    process.exit(1)
  }
}
