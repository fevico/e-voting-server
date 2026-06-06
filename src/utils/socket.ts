import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

let io: SocketServer | null = null;

export const initSocket = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: [process.env.APP_URL || "http://localhost:5173"], // Fallback to common dev client port
      methods: ["GET", "POST"],
      credentials: true, 
    },
  }); 

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Allow clients to join rooms for specific elections to prevent noise
    socket.on("joinElection", (electionId: string) => {
      if (electionId) {
        socket.join(electionId);
        console.log(`👤 Client ${socket.id} joined election room: ${electionId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};

export const emitVoteUpdate = (electionId: string, contestantId: string, votes: number) => {
  if (io) {
    // 1. Broadcast specifically to clients in the room for this election
    io.to(electionId).emit("voteUpdate", { contestantId, votes });
    
    // 2. Broadcast globally for overall metrics (e.g., total votes)
    io.emit("globalVoteUpdate", { electionId, contestantId, votes });
  }
};
