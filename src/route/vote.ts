import { Router } from "express";
import {
  castQuickVote,
  castQrVote,
  requestOtp,
  verifyOtpAndVote,
} from "@/controller/vote";

const router = Router();

router.post("/quick", castQuickVote);
router.post("/qr", castQrVote);
router.post("/otp/request", requestOtp);
router.post("/otp/verify", verifyOtpAndVote);

export default router;
