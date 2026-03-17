import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, //không trả pass khi query
    },
    phoneNumber: {
      type: String,
      default: "",
      trim: true,
      match: [/^\+?[0-9]\d{1,14}$/, "Please enter a valid phone number"],
    },
    displayName: {
      type: String,
      default: "",
      trim: true,
    },
    fullName: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    birthday: {
      type: Date,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastOnlineAt: {
      type: Date,
      default: null,
    },
    followerCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

//hash password trước khi save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Text index for search by username, displayName, fullName
userSchema.index(
  { username: "text", displayName: "text", fullName: "text" },
  { weights: { username: 10, displayName: 5, fullName: 3 } }
);

const User = mongoose.model("User", userSchema);

export default User;
