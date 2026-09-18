import mongoose from "mongoose";
import dns from "dns";

// Fix for Windows / ISP DNS resolvers failing on MongoDB Atlas SRV lookups (querySrv ECONNREFUSED)
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
    console.warn('Custom DNS setServer warning:', err.message);
}

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.log(`error occur: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
