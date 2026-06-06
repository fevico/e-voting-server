import mongoose, { Schema, Document } from "mongoose";

export interface IVote extends Document {
  contestant: mongoose.Types.ObjectId;
  election: mongoose.Types.ObjectId;
  method: "quick" | "email" | "sms" | "qr";
  voterId: string; // IP hash, email address, or phone number to verify uniqueness
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    contestant: {
      type: Schema.Types.ObjectId,
      ref: "Contestant",
      required: true,
    },
    election: {
      type: Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    method: {
      type: String,
      enum: ["quick", "email", "sms", "qr"],
      required: true,
    },
    voterId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Enforce unique voting: a voter (voterId) can only cast 1 vote per election
VoteSchema.index({ election: 1, voterId: 1 }, { unique: true });

export const Vote = mongoose.models.Vote || mongoose.model<IVote>("Vote", VoteSchema);
