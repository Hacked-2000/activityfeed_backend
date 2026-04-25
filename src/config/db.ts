import mongoose from "mongoose";

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected:", mongoose.connection.host);
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}

export default connectDB;
