<div align="center">
  <img src="images/SquadKarmaMedium.png" alt="Squad Karma" width="400">
  
  <p><strong>Community-driven reputation system for Squad players</strong></p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#api-endpoints">API</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

---

## 🎯 What is Squad Karma?

Squad Karma is an independent community project that allows Squad players to build and track their reputation. Players log in with their Steam account and can give thumbs up or thumbs down to other players they've encountered, along with a reason category.

Whether someone is a great squad leader, helpful to new players, or unfortunately known for teamkilling — Squad Karma helps the community share that information transparently.

## ✨ Features

- **🔐 Steam Authentication** — Secure login via Steam OpenID, no passwords needed
- **👍👎 Reputation Voting** — Give positive or negative feedback with predefined reason categories
- **📊 Reputation Statistics** — View aggregated reputation scores, top reasons, and trends over time
- **🛡️ Anti-Spam Protection** — 1 vote per hour cooldown per target player prevents abuse
- **🌐 Server Context** — Votes are tied to specific servers for better context
- **🔒 Privacy First** — Votes are anonymous; no one sees who voted for whom

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Backend** | Node.js, Fastify, TypeScript, Prisma ORM |
| **Database** | PostgreSQL, Redis (sessions & caching) |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Bot** | Discord.js (reputation lookup) |
| **Auth** | Steam OpenID via @fastify/passport |

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Steam Web API Key ([get one here](https://steamcommunity.com/dev/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/Metroseksuaali/SquadKarma.git
cd SquadKarma

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Initialize database
npm run db:push

# Seed base categories
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `STEAM_API_KEY` | Your Steam Web API key |
| `SESSION_SECRET` | Session encryption key (min 32 chars) |

## 📡 API Endpoints

### Authentication
```
GET  /auth/steam           → Redirect to Steam login
GET  /auth/steam/callback  → Handle Steam callback
GET  /auth/me              → Get current user info
POST /auth/logout          → Log out
```

### Core API
```
GET  /api/servers                      → List available servers
GET  /api/players/:steam64             → Get player info
GET  /api/players/:steam64/reputation  → Get reputation stats
GET  /api/reason-categories            → List reason categories
POST /api/votes                        → Submit a vote
```

### Health
```
GET  /health  → Service health check
```

## 📁 Project Structure

```
SquadKarma/
├── src/                  # Backend source code
│   ├── modules/          # Feature modules (auth, votes, etc.)
│   ├── lib/              # Shared utilities
│   └── index.ts          # Entry point
├── frontend/             # React frontend
├── bot/                  # Discord bot
├── prisma/               # Database schema & migrations
├── node/                 # Node operator code (future)
└── docs/                 # Documentation
```

## 🧑‍💻 Development Commands

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Run production build
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:migrate   # Create new migration
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit (`git commit -m 'feat: add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request to `dev` branch

Please read our contributing guidelines and check existing issues before starting work.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- [Privacy Policy](PRIVACY.md)
- [Development Plan](PLAN.md)
- [Project Documentation](docs/)

---

<div align="center">
  <p>Made with ❤️ by the Squad community</p>
  <p><sub>Squad Karma is an independent community project and is not affiliated with Offworld Industries.</sub></p>
</div>
