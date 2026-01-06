import mongoose from "mongoose";

export async function connectDB() {
    try {
        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            throw new Error("MONGO_URL must be defined");
        }

        await mongoose.connect(mongoUrl);
        console.log("✅ MongoDB connected successfully to database:", mongoose.connection.name);
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
}
