const mongoose = require("mongoose");

const providerKeySchema = new mongoose.Schema(
  {
    encryptedKey: { type: String, default: "" },
    updatedAt: { type: Date, default: null },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    providerKeys: {
      openai: { type: providerKeySchema, default: () => ({}) },
      gemini: { type: providerKeySchema, default: () => ({}) },
      claude: { type: providerKeySchema, default: () => ({}) },
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
