import mongoose from "mongoose";

export const connectMongoDB  = async () => {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
        console.error("❌ MONGO_URI is missing in .env");
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("🚀 MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1);
    }
};
