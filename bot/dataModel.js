import mongoose from "mongoose";

const Schema = mongoose.Schema;

const LinkUsed = new Schema({
  id: String,
  nonce: String,
  used: Boolean,
  discordUid: String,
  createdAt: { type: Date, expires: '1h', default: Date.now }
});

// Compile model from schema
const LinkUsedModel = mongoose.model("LinkUsed", LinkUsed);

const Wallets = new Schema({
  addresses: [{ type: String, unique: true, lowercase: true }],
  discordUid: String,
});

const WalletsModel = mongoose.model("Wallets", Wallets);

export { LinkUsedModel, WalletsModel };
