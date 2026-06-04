import { Router } from "express";
import {
  createElection,
  getElections,
  updateElection,
  deleteElection,
} from "@/controller/election";

const router = Router();

router.post("/", createElection);
router.get("/", getElections);
router.patch("/:id", updateElection);
router.delete("/:id", deleteElection);

export default router;
