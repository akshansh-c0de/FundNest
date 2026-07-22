const validateEnv = () => {
    const required = ['MONGO_URI', 'JWT_SECRET'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    if (process.env.JWT_SECRET.length < 32) {
        console.warn('Warning: JWT_SECRET should be at least 32 characters for production use');
    }
};

export default validateEnv;
