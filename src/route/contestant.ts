import { Router } from "express";
import { fileParser } from "@/middleware/file";
import {
  createContestant,
  getContestants,
  updateContestant,
  deleteContestant,
} from "@/controller/contestant";

const router = Router();

router.post("/", fileParser, createContestant);
router.get("/", getContestants);
router.patch("/:id", fileParser, updateContestant);
router.delete("/:id", deleteContestant);

export default router;
