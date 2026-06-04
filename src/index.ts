import  express from "express"
import "dotenv/config"
import "@/db/connect"

const app = express()
app.use(cors({ origin: [process.env.APP_URL!], credentials: true }));

app.use(express.json())
app.use(express.urlencoded({ extended: false }));

const port = process.env.PORT || 8000;

app.listen(port, () => { 
  console.log(`Server is running on port ${port}`);
});   