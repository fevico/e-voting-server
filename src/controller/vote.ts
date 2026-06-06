import { RequestHandler } from "express";
import { Vote } from "@/model/vote";
import { Otp } from "@/model/otp";
import { Contestant } from "@/model/contestant";
import { Election } from "@/model/election";
import { sendEmail } from "@/utils/email";
import { emitVoteUpdate } from "@/utils/socket";
import mongoose from "mongoose";

// Helper to get client IP
const getClientIp = (req: any): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (forwarded as string).split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown-ip";
};

export const castQuickVote: RequestHandler = async (req, res) => {
  try {
    const { contestantId, electionId } = req.body as { contestantId: string; electionId: string };

    if (!contestantId || !electionId) {
      res.status(400).json({ error: "contestantId and electionId are required" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(contestantId) || !mongoose.Types.ObjectId.isValid(electionId)) {
      res.status(400).json({ error: "Invalid contestantId or electionId format" });
      return;
    }

    const voterId = getClientIp(req);

    // Verify contestant exists in this election
    const contestant = await Contestant.findOne({ _id: contestantId, election: electionId });
    if (!contestant) {
      res.status(404).json({ error: "Contestant not found in the specified election" });
      return;
    } 

    // Save vote (Unique index prevents duplicate voting per election)
    try {
      const vote = new Vote({
        contestant: contestantId,
        election: electionId,
        method: "quick",
        voterId,
      });
      await vote.save();
    } catch (dbErr: any) {
      if (dbErr.code === 11000) {
        res.status(400).json({ error: "You have already voted in this election." });
        return;
      }
      throw dbErr;
    }

    // Increment votes
    contestant.votes += 1;
    await contestant.save();

    // Broadcast vote update in real-time
    emitVoteUpdate(electionId, contestantId, contestant.votes);

    res.status(201).json({ message: "Vote cast successfully", votes: contestant.votes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const castQrVote: RequestHandler = async (req, res) => {
  try {
    const { contestantId, electionId } = req.body as { contestantId: string; electionId: string };

    if (!contestantId || !electionId) {
      res.status(400).json({ error: "contestantId and electionId are required" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(contestantId) || !mongoose.Types.ObjectId.isValid(electionId)) {
      res.status(400).json({ error: "Invalid contestantId or electionId format" });
      return;
    }

    const voterId = getClientIp(req);

    // Verify contestant exists in this election
    const contestant = await Contestant.findOne({ _id: contestantId, election: electionId });
    if (!contestant) {
      res.status(404).json({ error: "Contestant not found in the specified election" });
      return;
    }

    // Save vote (Unique index prevents duplicate voting per election)
    try {
      const vote = new Vote({
        contestant: contestantId,
        election: electionId,
        method: "qr",
        voterId, 
      });
      await vote.save();
    } catch (dbErr: any) {
      if (dbErr.code === 11000) {
        res.status(400).json({ error: "You have already voted in this election." });
        return;
      }
      throw dbErr;
    }

    // Increment votes
    contestant.votes += 1;
    await contestant.save();

    // Broadcast vote update in real-time
    emitVoteUpdate(electionId, contestantId, contestant.votes);

    res.status(201).json({ message: "Vote cast successfully via QR Code", votes: contestant.votes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const requestOtp: RequestHandler = async (req, res) => {
  try {
    const { target, contestantId, electionId, method } = req.body as {
      target: string;
      contestantId: string;
      electionId: string;
      method: "email" | "sms";
    };

    if (!target || !contestantId || !electionId || !method) {
      res.status(400).json({ error: "target, contestantId, electionId, and method are all required" });
      return;
    }

    if (method !== "email" && method !== "sms") {
      res.status(400).json({ error: "Method must be 'email' or 'sms'" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(contestantId) || !mongoose.Types.ObjectId.isValid(electionId)) {
      res.status(400).json({ error: "Invalid contestantId or electionId format" });
      return;
    }

    // Check if voter has already voted in this election
    const alreadyVoted = await Vote.findOne({ election: electionId, voterId: target });
    if (alreadyVoted) {
      res.status(400).json({ error: "This email/phone number has already voted in this election." });
      return;
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes

    // Save to OTP collection (upsert to overwrite previous requests for same target/election)
    await Otp.findOneAndUpdate(
      { target, election: electionId },
      { otp, contestant: contestantId, expiresAt },
      { upsert: true, new: true }
    );

    // Send OTP
    if (method === "email") {
      // Validate email format basic
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(target)) {
        res.status(400).json({ error: "Invalid email address format" });
        return;
      }

      await sendEmail({
        to: target,
        toName: "Voter",
        subject: "Your VoteHub Verification Code",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Verify Your Vote</h2>
            <p>You requested a verification code to cast your vote.</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #6200ee; margin: 20px 0;">${otp}</p>
            <p>This code will expire in 5 minutes.</p>
          </div>
        `,
      });
      console.log(`✉️ Email OTP sent to ${target}: ${otp}`);
    } else {
      // SMS Mocking
      console.log(`💬 [SMS OTP MOCK] Sent to ${target}: Your OTP is ${otp}`);
    }

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyOtpAndVote: RequestHandler = async (req, res) => {
  try {
    const { target, otp, contestantId, electionId, method } = req.body as {
      target: string;
      otp: string;
      contestantId: string;
      electionId: string;
      method: "email" | "sms";
    };

    if (!target || !otp || !contestantId || !electionId || !method) {
      res.status(400).json({ error: "target, otp, contestantId, electionId, and method are required" });
      return;
    }

    if (method !== "email" && method !== "sms") {
      res.status(400).json({ error: "Method must be 'email' or 'sms'" });
      return;
    }

    // Find valid OTP
    const otpRecord = await Otp.findOne({
      target,
      otp,
      election: electionId,
      contestant: contestantId,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({ error: "Invalid or expired OTP verification code" });
      return;
    }

    // Verify contestant exists in election
    const contestant = await Contestant.findOne({ _id: contestantId, election: electionId });
    if (!contestant) {
      res.status(404).json({ error: "Contestant not found in specified election" });
      return;
    }

    // Cast the vote
    try {
      const vote = new Vote({
        contestant: contestantId,
        election: electionId,
        method,
        voterId: target,
      });
      await vote.save();
    } catch (dbErr: any) {
      if (dbErr.code === 11000) {
        res.status(400).json({ error: "This email/phone number has already voted in this election." });
        return;
      }
      throw dbErr;
    }

    // Delete OTP record now that it is used
    await otpRecord.deleteOne();

    // Increment votes
    contestant.votes += 1;
    await contestant.save();

    // Broadcast vote update in real-time
    emitVoteUpdate(electionId, contestantId, contestant.votes);

    res.status(201).json({ message: "Vote verified and cast successfully", votes: contestant.votes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
