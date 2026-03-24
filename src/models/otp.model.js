import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
    {
    email: { 
        type: String, 
        required: true, 
        lowercase: true, 
        unique: true 
    },
    otpHash: { 
            type: String, 
            required: true },
    expiresAt: { 
        type: Date, 
        required: true },
    //so lan nhap sai otp max5
    attempts: {
        type: Number,
        default: 0,
    },
    isUsed: {
        type: Boolean,
        default: false,
    },
    },
    { timestamps: true },
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model("Otp", OtpSchema);

export default Otp;
