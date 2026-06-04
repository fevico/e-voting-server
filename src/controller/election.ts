import { RequestHandler } from "express";
import { Election } from "@/model/election";
import { Contestant } from "@/model/contestant";
import { deleteImage } from "@/utils/cloudinary";
import mongoose from "mongoose";

export const createElection: RequestHandler = async (req, res) => {
  try {
    const { title, description, status } = req.body;

    if (!title) {
      res.status(400).json({ error: "Election title is required" });
      return;
    }

    const existingElection = await Election.findOne({ title });
    if (existingElection) {
      res.status(400).json({ error: "An election with this title already exists" });
      return;
    }

    const election = new Election({
      title,
      description,
      status,
    });

    await election.save();

    res.status(201).json({ election });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getElections: RequestHandler = async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.status(200).json({ elections });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateElection: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { title, description, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid Election ID" });
      return;
    }

    const election = await Election.findById(id);
    if (!election) {
      res.status(404).json({ error: "Election not found" });
      return;
    }

    if (title && title !== election.title) {
      const existingElection = await Election.findOne({ title });
      if (existingElection) {
        res.status(400).json({ error: "An election with this title already exists" });
        return;
      }
      election.title = title;
    }

    if (description !== undefined) election.description = description;
    if (status) election.status = status;

    await election.save();

    res.status(200).json({ election });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteElection: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid Election ID" });
      return;
    }

    const election = await Election.findById(id);
    if (!election) {
      res.status(404).json({ error: "Election not found" });
      return;
    }

    // Find all contestants in this election to delete their Cloudinary images
    const contestants = await Contestant.find({ election: id });
    for (const contestant of contestants) {
      if (contestant.image && contestant.image.id) {
        try {
          await deleteImage(contestant.image.id);
        } catch (err) {
          console.error(`Failed to delete Cloudinary image ${contestant.image.id}:`, err);
        }
      }
    }

    // Delete all contestants
    await Contestant.deleteMany({ election: id });

    // Delete the election
    await election.deleteOne();

    res.status(200).json({ message: "Election and all associated contestants deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
