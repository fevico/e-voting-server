# VoteHub 2024 - API & Integration Documentation

This document provides detailed API specifications, Socket.io event models, integration instructions, and upcoming features roadmap for the **VoteHub 2024** real-time e-voting application.

---

## 🔌 Real-Time Socket.io Integration

The server runs Socket.io alongside HTTP REST. WebSockets are used to receive instant, live vote updates. Vote casting is handled via standard REST APIs, which immediately trigger socket broadcasts.

### Base Socket URL: `http://localhost:3030` (or your backend production URL)

### Frontend Socket.io Client Example (React/JS)

```javascript
import { io } from "socket.io-client";

// Initialize socket connection
const socket = io("http://localhost:3030", {
  withCredentials: true,
});

socket.on("connect", () => {
  console.log(`🔌 Connected to socket server! ID: ${socket.id}`);
  
  // 1. Join the room corresponding to the active election to filter updates
  const activeElectionId = "6a20ca9455d05da9871cd930";
  socket.emit("joinElection", activeElectionId);
});

// 2. Listen to updates for the joined election room
socket.on("voteUpdate", (data) => {
  console.log("Live vote cast inside active election:", data);
  // data: { contestantId: "6a20cb1255d05da9871cd931", votes: 45 }
  // Update your candidate's UI vote counts and turnout percentages here!
});

// 3. Optional: Listen for global vote updates (for master dashboards)
socket.on("globalVoteUpdate", (data) => {
  console.log("Global vote cast:", data);
  // data: { electionId: "...", contestantId: "...", votes: ... }
});

socket.on("disconnect", () => {
  console.log("❌ Socket connection closed");
});
```

---

## 📡 REST API Reference

All REST endpoints are prefixed with `/api`.

### 1. Elections Module (`/api/elections`)

#### **POST** `/api/elections`
*   **Description:** Create a new election category.
*   **Headers:** `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "title": "VoteHub 2024",
      "description": "Annual Excellence Voting System 2024",
      "status": "active" // Optional, default is "upcoming". Enum: ["upcoming", "active", "completed"]
    }
    ```
*   **Success Response (`201 Created`):**
    ```json
    {
      "election": {
        "_id": "6a20ca9455d05da9871cd930",
        "title": "VoteHub 2024",
        "description": "Annual Excellence Voting System 2024",
        "status": "active",
        "createdAt": "2026-06-04T19:44:45.302Z",
        "updatedAt": "2026-06-04T19:44:45.302Z",
        "__v": 0
      }
    }
    ```

#### **GET** `/api/elections`
*   **Description:** List all elections, sorted by newest created first.
*   **Success Response (`200 OK`):**
    ```json
    {
      "elections": [
        {
          "_id": "6a20ca9455d05da9871cd930",
          "title": "VoteHub 2024",
          "description": "Annual Excellence Voting System 2024",
          "status": "active",
          "createdAt": "2026-06-04T19:44:45.302Z"
        }
      ]
    }
    ```

#### **PATCH** `/api/elections/:id`
*   **Description:** Update an election's title, description, or status.
*   **Request Body:** Same as creation (all fields optional).
*   **Success Response (`200 OK`):** Updated election object.

#### **DELETE** `/api/elections/:id`
*   **Description:** Deletes an election and deletes all associated contestants and their Cloudinary files.
*   **Success Response (`200 OK`):**
    ```json
    {
      "message": "Election and all associated contestants deleted successfully"
    }
    ```

---

### 2. Contestants Module (`/api/contestants`)

#### **POST** `/api/contestants`
*   **Description:** Create a contestant. Must be submitted as `multipart/form-data`.
*   **Headers:** `Content-Type: multipart/form-data`
*   **Form Fields:**
    *   `name`: (String) Name of candidate.
    *   `tag`: (String) Role/category tag (e.g. "Community Builder", "Tech Pioneer").
    *   `bio`: (String) Candidate description.
    *   `election`: (String) ObjectId of the parent election.
    *   `image`: (File) The profile photo.
*   **Success Response (`201 Created`):**
    ```json
    {
      "contestant": {
        "name": "Marcus Chen",
        "tag": "Community Builder",
        "bio": "Building sustainable community programs",
        "votes": 0,
        "image": {
          "url": "https://res.cloudinary.com/.../contestants/sd5gexgsl.png",
          "id": "contestants/sd5gexgsl"
        },
        "election": "6a20ca9455d05da9871cd930",
        "_id": "6a20cb1255d05da9871cd931",
        "createdAt": "2026-06-04T19:47:14.249Z",
        "updatedAt": "2026-06-04T19:47:14.249Z"
      }
    }
    ```

#### **GET** `/api/contestants`
*   **Description:** Fetch contestants list (sorted by votes descending). Pass `electionId` (or `election`) to filter by a specific election scope.
*   **Query Parameters:** `?electionId=6a20ca9455d05da9871cd930`
*   **Success Response (`200 OK`):**
    ```json
    {
      "contestants": [
        {
          "_id": "6a20cb1255d05da9871cd931",
          "name": "Marcus Chen",
          "tag": "Community Builder",
          "bio": "Building sustainable community programs",
          "votes": 3124,
          "image": {
            "url": "https://res.cloudinary.com/...",
            "id": "contestants/..."
          },
          "election": {
            "_id": "6a20ca9455d05da9871cd930",
            "title": "VoteHub 2024",
            "status": "active"
          }
        }
      ]
    }
    ```

---

### 3. Voting Module (`/api/votes`)

#### **POST** `/api/votes/quick`
*   **Description:** Cast a normal vote. Double voting is restricted to 1 per IP address per election.
*   **Request Body:**
    ```json
    {
      "contestantId": "6a20cb1255d05da9871cd931",
      "electionId": "6a20ca9455d05da9871cd930"
    }
    ```
*   **Success Response (`201 Created`):**
    ```json
    {
      "message": "Vote cast successfully",
      "votes": 3125
    }
    ```
*   **Error Response (`400 Bad Request`):**
    ```json
    {
      "error": "You have already voted in this election."
    }
    ```

#### **POST** `/api/votes/qr`
*   **Description:** Cast a vote by scanning a QR code (similar rules to Quick Vote, but logs method as `qr`).
*   **Request Body:** Same as Quick Vote.

#### **POST** `/api/votes/otp/request`
*   **Description:** Request a 6-digit verification code. If target email/phone has already voted, it returns a 400 error immediately.
*   **Request Body:**
    ```json
    {
      "target": "ajayifavour81@gmail.com", // Email address OR Phone number
      "contestantId": "6a20cb2b55d05da9871cd932",
      "electionId": "6a20ca9455d05da9871cd930",
      "method": "email" // "email" or "sms"
    }
    ```
*   **Success Response (`200 OK`):**
    ```json
    {
      "message": "OTP sent successfully"
    }
    ```

#### **POST** `/api/votes/otp/verify`
*   **Description:** Verifies the generated 6-digit code and records the vote.
*   **Request Body:**
    ```json
    {
      "target": "ajayifavour81@gmail.com",
      "otp": "909599",
      "contestantId": "6a20cb2b55d05da9871cd932",
      "electionId": "6a20ca9455d05da9871cd930",
      "method": "email"
    }
    ```
*   **Success Response (`201 Created`):**
    ```json
    {
      "message": "Vote verified and cast successfully",
      "votes": 1
    }
    ```

---

## 🔮 Roadmap / Next Steps

Here is what is scheduled for implementation next:

1.  **Admin Authentication System:**
    *   Setting up an Admin registration, login, and token generation (`JWT`) system.
    *   Securing Election & Contestant creation routes with an `adminAuth` middleware so that only verified administrators can make changes.
2.  **SMS Gateway Integration:**
    *   Replacing our current SMS OTP mock (`console.log`) with a Twilio or Termii API integration to send actual texts for phone verifications.
3.  **Voter Analytics & Statistics Endpoint:**
    *   An API endpoint `/api/elections/:id/analytics` calculating turnout rates, distribution of vote methods (e.g. % of votes cast via QR vs Email), and timeline charts showing hourly voting spikes.
4.  **Voter Turnout Rate Limiting:**
    *   Configurable election policies (e.g., allow multiple votes per IP but verify with email, or block all duplicate emails).
