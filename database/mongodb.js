import mongoose from "mongoose";
import { DB_URI, NODE_ENV } from "../config/env.js";

if (!DB_URI) {
    throw new Error("Database connection string is not defined in environment variables inside .env<development/production>.local");
}

const connectToDatabase = async () => {
    try {
        await mongoose.connect(DB_URI, {
            serverSelectionTimeoutMS: 30000, // Increase timeout to 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });
        console.log(`Connected to MongoDB database in ${NODE_ENV} mode.`);
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
}

export default connectToDatabase;