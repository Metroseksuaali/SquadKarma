# Squad Karma API

Backend for Squad player reputation system.

## Requirements

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env file with your own values

# Initialize database
npm run db:push

# Add base categories
npm run db:seed

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `STEAM_API_KEY` | Steam Web API key |
| `SESSION_SECRET` | Session encryption key (min 32 characters) |

## API Endpoints

```
GET  /health                         - Health check
GET  /auth/steam                     - Start Steam login
GET  /auth/steam/callback            - Steam callback
GET  /auth/me                        - Logged-in user
POST /auth/logout                    - Log out

GET  /api/servers                    - List of servers
GET  /api/players/:steam64           - Player details
GET  /api/players/:steam64/reputation - Reputation stats
GET  /api/reason-categories          - Reason categories
POST /api/votes                      - Submit vote
```

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:studio    # Open Prisma Studio (database management)
npm run db:migrate   # Create new migration
```
