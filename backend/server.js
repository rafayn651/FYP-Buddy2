import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import "dotenv/config";
import cors from "cors";

import connectDB from "./database/db.js";
import userRoute from "./routes/userRoute.js";
import groupFormationRoute from "./routes/groupFormationRoutes.js";
import supervisorRequestRoute from "./routes/supervisorRequestRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import milestoneRoutes from "./routes/milestoneRoutes.js";
import gradingRoutes from "./routes/gradingRoutes.js";
import thesisRoutes from "./routes/thesisRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { registerChatGateway } from "./socket/chatGateway.js";

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const Frontend_Url = process.env.FRONTEND_URL;
const allowedOrigins = Frontend_Url
  ? Frontend_Url.split(",").map((o) => o.trim()).filter(Boolean)
  : ["http://localhost:5173"];

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use("/user", userRoute);
app.use("/group", groupFormationRoute);
app.use("/supervisor", supervisorRequestRoute);
app.use("/task", taskRoutes);
app.use("/milestone", milestoneRoutes);
app.use("/grading", gradingRoutes);
app.use("/thesis", thesisRoutes);
app.use("/chat", chatRoutes);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

registerChatGateway(io);

connectDB();

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening at port ${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
  console.log(`Server accessible from network at http://0.0.0.0:${PORT}`);
});