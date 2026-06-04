import mongoose, { Schema, Document } from "mongoose";

export interface IContestant extends Document {
  name: string;
  tag: string;
  bio: string;
  votes: number;
  image: {
    url: string;
    id: string;
  };
  election: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContestantSchema = new Schema<IContestant>(
  {
    name: { type: String, required: true, trim: true },
    tag: { type: String, required: true, trim: true },
    bio: { type: String, required: true, trim: true },
    votes: { type: Number, default: 0 },
    image: {
      url: { type: String, required: true },
      id: { type: String, required: true },
    },
    election: {
      type: Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
  },
  { timestamps: true }
);

export const Contestant = mongoose.models.Contestant || mongoose.model<IContestant>("Contestant", ContestantSchema);
