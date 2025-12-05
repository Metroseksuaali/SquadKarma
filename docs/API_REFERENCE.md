# Squad Karma - API Reference

Complete API reference for Squad Karma node endpoints.

---

## 🔐 Authentication

All endpoints (except `/api/health` and `/api/replicate/health`) require Bearer token authentication.

```http
Authorization: Bearer YOUR_API_KEY
```

The API key is generated when registering a node with `/register-node` in Discord.

---

## 📡 Health & Stats Endpoints

### GET /api/health

Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-05T12:00:00.000Z",
  "nodeId": "squad-server-001",
  "nodeName": "My Squad Server"
}
```

**Status Codes:**
- `200 OK` - Node is healthy

---

### GET /api/stats

Get node statistics.

**Authentication:** Required

**Response:**
```json
{
  "totalSessions": 1234,
  "activeSessions": 42,
  "totalVotes": 567,
  "upvotes": 400,
  "downvotes": 167,
  "uniquePlayers": 890,
  "timestamp": "2024-12-05T12:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing API key
- `500 Internal Server Error` - Database error

---

## 👥 Session Endpoints

### GET /api/session/:steam64

Get current or recent session for a player.

**Authentication:** Required

**Parameters:**
- `steam64` (path) - Steam64 ID (17 digits, starts with 7656119)

**Response (Active Session):**
```json
{
  "id": 42,
  "steam64": "76561198012345678",
  "playerName": "PlayerName",
  "joinedAt": "2024-12-05T10:30:00.000Z",
  "leftAt": null,
  "serverId": "squad-server-001"
}
```

**Response (No Session):**
```json
{
  "error": "Not Found",
  "message": "No active or recent session found for this player"
}
```

**Status Codes:**
- `200 OK` - Session found
- `400 Bad Request` - Invalid Steam64 ID
- `401 Unauthorized` - Invalid or missing API key
- `404 Not Found` - No session found
- `500 Internal Server Error` - Database error

---

### POST /api/session/validate-overlap

Validate if two players' sessions overlapped.

**Authentication:** Required

**Request Body:**
```json
{
  "voterSteam64": "76561198012345678",
  "targetSteam64": "76561198087654321"
}
```

**Response (Valid Overlap):**
```json
{
  "valid": true,
  "voterSession": {
    "id": 42,
    "joinedAt": "2024-12-05T10:00:00.000Z",
    "leftAt": "2024-12-05T12:00:00.000Z"
  },
  "targetSession": {
    "id": 43,
    "joinedAt": "2024-12-05T10:30:00.000Z",
    "leftAt": "2024-12-05T11:30:00.000Z"
  },
  "overlapMinutes": 90
}
```

**Response (No Overlap):**
```json
{
  "valid": false,
  "message": "Players must have played together for at least 5 minutes"
}
```

**Status Codes:**
- `200 OK` - Validation complete
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Invalid or missing API key
- `500 Internal Server Error` - Database error

---

## 🗳️ Voting Endpoints

### POST /api/vote

Submit a vote with proof of presence validation.

**Authentication:** Required

**Request Body:**
```json
{
  "voterSteam64": "76561198012345678",
  "targetSteam64": "76561198087654321",
  "direction": "UP",
  "reasonCategory": "Good squad leader"
}
```

**Request Fields:**
- `voterSteam64` - Voter's Steam64 ID (17 digits)
- `targetSteam64` - Target player's Steam64 ID (17 digits)
- `direction` - Vote direction: `"UP"` or `"DOWN"`
- `reasonCategory` - Reason from predefined list (see below)

**Reason Categories:**

*Positive:*
- Good squad leader
- Helpful
- Good pilot/driver
- Team player
- Good communication
- Skilled player
- Good commander

*Negative:*
- Trolling
- Teamkilling
- Toxic behavior
- Bad at vehicles
- Mic spam
- Not following orders
- Griefing
- AFK / Idle

*Neutral:*
- New player

**Response (Success):**
```json
{
  "success": true,
  "vote": {
    "id": 123,
    "direction": "UP",
    "reasonCategory": "Good squad leader",
    "createdAt": "2024-12-05T12:00:00.000Z"
  },
  "proof": {
    "voterSession": {
      "joinedAt": "2024-12-05T10:00:00.000Z",
      "leftAt": "2024-12-05T12:00:00.000Z"
    },
    "targetSession": {
      "joinedAt": "2024-12-05T10:30:00.000Z",
      "leftAt": "2024-12-05T11:30:00.000Z"
    },
    "overlapMinutes": 90
  }
}
```

**Error Responses:**

*Self-Vote (400):*
```json
{
  "error": "Bad Request",
  "message": "Cannot vote for yourself"
}
```

*No Recent Session (403):*
```json
{
  "error": "Forbidden",
  "message": "No recent session found for voter (must be within last 24 hours)"
}
```

*Insufficient Overlap (403):*
```json
{
  "error": "Forbidden",
  "message": "Players must have played together for at least 5 minutes",
  "details": {
    "minOverlapMinutes": 5,
    "voterHasSessions": true,
    "targetHasSessions": true
  }
}
```

*Duplicate Vote (409):*
```json
{
  "error": "Conflict",
  "message": "You have already voted for this player in this session",
  "existingVote": {
    "direction": "UP",
    "reasonCategory": "Good squad leader",
    "createdAt": "2024-12-05T11:00:00.000Z"
  }
}
```

**Status Codes:**
- `201 Created` - Vote submitted successfully
- `400 Bad Request` - Invalid request parameters or self-vote
- `401 Unauthorized` - Invalid or missing API key
- `403 Forbidden` - No recent session or insufficient overlap
- `409 Conflict` - Duplicate vote
- `500 Internal Server Error` - Database error

---

## 📊 Reputation Endpoints

### GET /api/reputation/:steam64

Get aggregated reputation for a player.

**Authentication:** Required

**Parameters:**
- `steam64` (path) - Steam64 ID (17 digits, starts with 7656119)

**Response:**
```json
{
  "steam64": "76561198012345678",
  "totalVotes": 150,
  "upvotes": 120,
  "downvotes": 30,
  "netReputation": 90,
  "categories": {
    "Good squad leader": { "up": 45, "down": 2 },
    "Helpful": { "up": 30, "down": 0 },
    "Team player": { "up": 25, "down": 1 },
    "Teamkilling": { "up": 0, "down": 15 },
    "Toxic behavior": { "up": 0, "down": 12 }
  },
  "recentVotes": [
    {
      "direction": "UP",
      "reasonCategory": "Good squad leader",
      "createdAt": "2024-12-05T11:30:00.000Z",
      "replicatedFrom": null
    },
    {
      "direction": "UP",
      "reasonCategory": "Helpful",
      "createdAt": "2024-12-05T10:15:00.000Z",
      "replicatedFrom": "squad-server-002"
    }
  ],
  "timestamp": "2024-12-05T12:00:00.000Z"
}
```

**Response (No Votes):**
```json
{
  "steam64": "76561198012345678",
  "totalVotes": 0,
  "upvotes": 0,
  "downvotes": 0,
  "netReputation": 0,
  "categories": {},
  "recentVotes": []
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid Steam64 ID
- `401 Unauthorized` - Invalid or missing API key
- `500 Internal Server Error` - Database error

---

## 🔄 Node-to-Node Replication Endpoints

### POST /api/replicate/votes

Receive votes from other trusted nodes for replication.

**Authentication:** Required

**Request Body:**
```json
{
  "sourceNodeId": "squad-server-002",
  "votes": [
    {
      "voterSteam64": "76561198012345678",
      "targetSteam64": "76561198087654321",
      "direction": "UP",
      "reasonCategory": "Good squad leader",
      "voterSessionId": 123,
      "targetSessionId": 124,
      "createdAt": "2024-12-05T11:00:00.000Z",
      "sourceNodeId": "squad-server-002"
    }
  ]
}
```

**Request Fields:**
- `sourceNodeId` - Identifier of the source node
- `votes` - Array of votes (max 100 per request)

**Vote Fields:**
- `voterSteam64` - Voter's Steam64 ID
- `targetSteam64` - Target player's Steam64 ID
- `direction` - `"UP"` or `"DOWN"`
- `reasonCategory` - Reason from predefined list
- `voterSessionId` - Session ID on source node (for reference)
- `targetSessionId` - Session ID on source node (for reference)
- `createdAt` - ISO 8601 timestamp
- `sourceNodeId` - Same as top-level sourceNodeId

**Response:**
```json
{
  "success": true,
  "results": {
    "total": 1,
    "inserted": 1,
    "duplicates": 0,
    "errors": 0
  },
  "message": "Processed 1 votes: 1 inserted, 0 duplicates, 0 errors"
}
```

**Error Responses:**

*Untrusted Node (403):*
```json
{
  "error": "Forbidden",
  "message": "Source node is not in trusted nodes list or is inactive"
}
```

*Invalid Request (400):*
```json
{
  "error": "Bad Request",
  "message": "Invalid request parameters"
}
```

**Status Codes:**
- `200 OK` - Votes processed
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Invalid or missing API key
- `403 Forbidden` - Untrusted node
- `500 Internal Server Error` - Processing error

**Notes:**
- Duplicate votes are detected using 1-hour timestamp window
- Placeholder sessions are created for replicated votes
- First vote wins in conflict resolution
- Replicated votes are marked with `replicatedFrom` field

---

### GET /api/replicate/health

Health check for node-to-node communication (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "nodeId": "squad-server-001",
  "timestamp": "2024-12-05T12:00:00.000Z",
  "stats": {
    "votes": 567,
    "sessions": 1234,
    "trustedNodes": 2
  }
}
```

**Error Response:**
```json
{
  "status": "unhealthy",
  "error": "Database connection failed"
}
```

**Status Codes:**
- `200 OK` - Node is healthy
- `503 Service Unavailable` - Node is unhealthy

---

### GET /api/replicate/votes/since/:timestamp

Get votes since a specific timestamp for replication (pull-based).

**Authentication:** Required

**Parameters:**
- `timestamp` (path) - ISO 8601 timestamp (e.g., `2024-12-05T10:00:00.000Z`)

**Response:**
```json
{
  "nodeId": "squad-server-001",
  "votesCount": 2,
  "votes": [
    {
      "voterSteam64": "76561198012345678",
      "targetSteam64": "76561198087654321",
      "direction": "UP",
      "reasonCategory": "Good squad leader",
      "voterSessionId": 123,
      "targetSessionId": 124,
      "createdAt": "2024-12-05T11:00:00.000Z",
      "sourceNodeId": "squad-server-001"
    },
    {
      "voterSteam64": "76561198012345679",
      "targetSteam64": "76561198087654322",
      "direction": "DOWN",
      "reasonCategory": "Trolling",
      "voterSessionId": 125,
      "targetSessionId": 126,
      "createdAt": "2024-12-05T11:30:00.000Z",
      "sourceNodeId": "squad-server-001"
    }
  ]
}
```

**Notes:**
- Only returns original votes (not replicated ones)
- Maximum 100 votes per request
- Votes are ordered by `createdAt` ascending
- Use for pull-based replication strategy

**Status Codes:**
- `200 OK` - Votes retrieved
- `400 Bad Request` - Invalid timestamp format
- `401 Unauthorized` - Invalid or missing API key
- `500 Internal Server Error` - Database error

---

## 🔍 Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    "additionalInfo": "optional"
  }
}
```

### Common Error Types

- `Bad Request` (400) - Invalid parameters or malformed request
- `Unauthorized` (401) - Missing or invalid API key
- `Forbidden` (403) - Valid request but action not allowed
- `Not Found` (404) - Resource not found
- `Conflict` (409) - Duplicate resource or conflict
- `Internal Server Error` (500) - Server-side error

---

## 📝 Rate Limiting

Currently, no rate limiting is implemented at the API level. Rate limiting should be implemented at the network level (e.g., reverse proxy, load balancer).

**Recommended limits:**
- 100 requests per minute per IP for general endpoints
- 10 requests per minute per IP for vote submission
- 1000 requests per minute for replication endpoints (node-to-node)

---

## 🔒 Security Best Practices

1. **Always use HTTPS** in production
2. **Keep API keys secret** - never commit to version control
3. **Validate Steam64 IDs** - 17 digits, starts with 7656119
4. **Use trusted node whitelist** for replication
5. **Implement network-level rate limiting**
6. **Monitor for suspicious patterns** (vote spam, etc.)
7. **Regular security updates** for dependencies

---

## 📚 Related Documentation

- [Setup Guide](HYBRID_SETUP.md)
- [Architecture](ARCHITECTURE_HYBRID.md)
- [Project Context](../CLAUDE.md)
- [Roadmap](POC_ROADMAP.md)

---

*Last Updated: 2024-12-05 - Phase 5 Complete*
