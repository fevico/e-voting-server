import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  target: string; // email address or phone number
  otp: string; // 6-digit code
  contestant: mongoose.Types.ObjectId;
  election: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    target: {
      type: String,
      required: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
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
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index to automatically delete expired OTPs from the collection at the expiresAt date
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
