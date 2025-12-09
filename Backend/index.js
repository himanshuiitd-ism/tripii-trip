// index.js
import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import authroutes from "./routes/auth.routes.js";
import http from "http";
import { initSocket } from "./socket/server.js";
import communityRoute from "./routes/community.routes.js";
import postRoute from "./routes/post.routes.js";

dotenv.config({});

const app = express();
const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 8000; // ✅ Use 8000

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "I'm coming from backend",
    success: true,
  });
});

app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

const corsOption = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOption));

app.use("/api/auth", authroutes);
app.use("/api/community", communityRoute);
app.use("/api/post", postRoute);

// ✅ Use server.listen instead of app.listen
server.listen(PORT, () => {
  connectDB();
  console.log(`Server listen at port ${PORT}`);
});
