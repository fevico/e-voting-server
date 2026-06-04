import "@/dns-setup";
import express, { Request, Response, NextFunction } from "express";
import "dotenv/config";
import "@/db/connect";
import cors from "cors";
import electionRouter from "@/route/election";
import contestantRouter from "@/route/contestant";

const app = express();
app.use(cors({ origin: [process.env.APP_URL!], credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api/elections", electionRouter);
app.use("/api/contestants", contestantRouter); 

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

const port = process.env.PORT || 8000;

app.listen(port, () => { 
  console.log(`Server is running on port ${port}`);
});   