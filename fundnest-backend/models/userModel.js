import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                'Please provide a valid email address',
            ],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        role: {
            type: String,
            enum: ['user', 'investor', 'founder', 'admin'],
            default: 'investor',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // Email verification
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: String,
        emailVerificationExpires: Date,
        // Password recovery
        passwordResetToken: String,
        passwordResetExpires: Date,
        // Account locking
        loginAttempts: {
            type: Number,
            default: 0,
            required: true,
        },
        lockUntil: Date,
        // Two-Factor Authentication
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        twoFactorSecret: String,
        twoFactorRecoveryCodes: {
            type: [String],
            default: [],
        },
        // KYC Readiness
        kycStatus: {
            type: String,
            enum: ['Pending', 'Verified', 'Rejected', 'Suspended'],
            default: 'Pending',
        },
        verificationStatus: {
            type: String,
            enum: ['Pending', 'Verified', 'Rejected', 'Suspended'],
            default: 'Pending',
        },
        accountStatus: {
            type: String,
            enum: ['Pending', 'Verified', 'Rejected', 'Suspended'],
            default: 'Pending',
        },
    },
    { timestamps: true }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.incLoginAttempts = async function () {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        this.loginAttempts = 1;
        this.lockUntil = undefined;
    } else {
        this.loginAttempts += 1;
        if (this.loginAttempts >= 5) {
            this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
        }
    }
    return this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
