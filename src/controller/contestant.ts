import { RequestHandler } from "express";
import { Contestant } from "@/model/contestant";
import { Election } from "@/model/election";
import { uploadImage, deleteImage } from "@/utils/cloudinary";
import mongoose from "mongoose";
import { File } from "formidable";

export const createContestant: RequestHandler = async (req, res) => {
  try {
    const { name, tag, bio, election } = req.body;

    if (!name || !tag || !bio || !election) {
      res.status(400).json({ error: "name, tag, bio, and election are all required" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(election)) {
      res.status(400).json({ error: "Invalid Election ID format" });
      return;
    }

    // Verify election exists
    const electionExists = await Election.findById(election);
    if (!electionExists) {
      res.status(404).json({ error: "Referenced election not found" });
      return;
    }

    const imageFile = req.files?.image;
    if (!imageFile) {
      res.status(400).json({ error: "Contestant image is required" });
      return;
    }

    const fileToUpload = Array.isArray(imageFile) ? imageFile[0] : imageFile;

    // Upload to Cloudinary
    const uploadResult = await uploadImage(fileToUpload, "contestants");

    const contestant = new Contestant({
      name,
      tag,
      bio,
      election,
      image: {
        url: uploadResult.url,
        id: uploadResult.id,
      },
    });

    await contestant.save();

    res.status(201).json({ contestant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getContestants: RequestHandler = async (req, res) => {
  try {
    const { electionId, election } = req.query;
    const filterElectionId = (electionId || election) as string | undefined;

    const filter: any = {};
    if (filterElectionId) {
      if (!mongoose.Types.ObjectId.isValid(filterElectionId)) {
        res.status(400).json({ error: "Invalid Election ID format" });
        return;
      }
      filter.election = filterElectionId;
    }

    // Sort by votes descending, then by creation date
    const contestants = await Contestant.find(filter)
      .populate("election", "title status")
      .sort({ votes: -1, createdAt: -1 });

    res.status(200).json({ contestants });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateContestant: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { name, tag, bio, election } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid Contestant ID" });
      return;
    }

    const contestant = await Contestant.findById(id);
    if (!contestant) {
      res.status(404).json({ error: "Contestant not found" });
      return;
    }

    if (name) contestant.name = name;
    if (tag) contestant.tag = tag;
    if (bio) contestant.bio = bio;

    if (election) {
      if (!mongoose.Types.ObjectId.isValid(election)) {
        res.status(400).json({ error: "Invalid Election ID format" });
        return;
      }
      const electionExists = await Election.findById(election);
      if (!electionExists) {
        res.status(404).json({ error: "Referenced election not found" });
        return;
      }
      contestant.election = election;
    }

    const imageFile = req.files?.image;
    if (imageFile) {
      const fileToUpload = Array.isArray(imageFile) ? imageFile[0] : imageFile;

      // Upload new image
      const uploadResult = await uploadImage(fileToUpload, "contestants");

      // Delete old image from Cloudinary
      if (contestant.image && contestant.image.id) {
        try {
          await deleteImage(contestant.image.id);
        } catch (err) {
          console.error(`Failed to delete old image ${contestant.image.id}:`, err);
        }
      }

      // Update image details in contestant schema
      contestant.image = {
        url: uploadResult.url,
        id: uploadResult.id,
      };
    }

    await contestant.save();

    res.status(200).json({ contestant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteContestant: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid Contestant ID" });
      return;
    }

    const contestant = await Contestant.findById(id);
    if (!contestant) {
      res.status(404).json({ error: "Contestant not found" });
      return;
    }

    // Delete image from Cloudinary
    if (contestant.image && contestant.image.id) {
      try {
        await deleteImage(contestant.image.id);
      } catch (err) {
        console.error(`Failed to delete Cloudinary image ${contestant.image.id}:`, err);
      }
    }

    // Delete from DB
    await contestant.deleteOne();

    res.status(200).json({ message: "Contestant deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
