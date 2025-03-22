import mongoose from 'mongoose';

// TEMPORARY SOLUTION - REPLACE WITH ENV VAR LATER
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://intsenai:20fNK8j2r8MQhHD3@cluster0.34dwe.mongodb.net/?retryWrites=true&w=majority';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;