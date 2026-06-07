import http from "http";
import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import { createSocketServer } from "./config/socket";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
createSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
