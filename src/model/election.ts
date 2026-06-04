import mongoose, { Schema, Document } from "mongoose";

export interface IElection extends Document {
  title: string;
  description?: string;
  status: "upcoming" | "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const ElectionSchema = new Schema<IElection>(
  {
    title: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

export const Election = mongoose.models.Election || mongoose.model<IElection>("Election", ElectionSchema);
