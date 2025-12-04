# Squad Karma - Project Context for Claude

> This file contains all essential context about the project for Claude assistant.
> Update this file as the project progresses.

---

## 📦 GitHub Repository

- **Repo:** https://github.com/Metroseksuaali/SquadKarma
- **Development branch:** `dev` (primary working branch)
- **Production:** `main` (releases only)
- **Local path:** `O:\vibecode\SquadKarma_new`

### Git Workflow
```bash
# Make sure you're on dev branch
git checkout dev

# Pull latest changes
git pull origin dev

# Commit changes
git add .
git commit -m "feat: description"
git push origin dev
```

---

## 🎯 Project Goal

**Squad Karma** is a community project that provides a reputation system for Squad game players.

### Core Features:
1. **Steam Login** - Users authenticate with their Steam account
2. **Server & Player Search** - Select a server and find players
3. **Voting** - Give thumbs up/down + reason category
4. **Reputation Viewing** - See player's overall reputation and history
5. **Cooldown** - Same user can only vote for the same player once per hour

### What it's NOT:
- Official OWI project
- A purely negative "lynch mob service"
- Free-text based (to prevent harassment)

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | React + TypeScript + Vite | Component-based, fast development |
| **Styling** | Tailwind CSS | Utility-first, dark theme |
| **State** | TanStack Query + Zustand | Server state + client state separately |
| **Backend** | Node.js + Fastify + TypeScript | Fast, Steam libraries available |
| **Database** | PostgreSQL + Prisma ORM | Relational database, type safety |
| **Cache** | Redis | Cooldown, rate limiting, sessions |
| **Auth** | @fastify/passport + node-steam-openid | Steam OpenID |

### Folder Structure

```
SquadKarma/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── ui/          # Common (Button, Input, Card)
│   │   │   ├── layout/      # Layout (Header, Footer)
│   │   │   └── features/    # Feature-specific
│   │   ├── pages/           # Page components (routing)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API calls
│   │   ├── store/           # Zustand state
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── public/              # Static files
│
├── src/                      # Backend (Node.js)
│   ├── config/              # Environment variables
│   ├── db/                  # Database connections
│   ├── middleware/          # Fastify middlewares
│   ├── modules/             # Feature modules
│   │   ├── auth/           # Steam authentication
│   │   ├── users/          # User management
│   │   ├── servers/        # Server list
│   │   ├── players/        # Player data
│   │   ├── votes/          # Voting logic
│   │   └── reputation/     # Reputation calculation
│   └── utils/               # Utility functions
│
├── prisma/                   # Database schema
│   ├── schema.prisma        # Data model
│   └── seed.ts              # Base categories
│
└── Claude.md                 # This file
```

---

## 📊 Data Model

### Entities

```
User (Authenticated user)
├── id: string (cuid)
├── steam64: string (unique)
├── displayName: string
├── avatarUrl: string?
├── isBanned: boolean
└── votes: Vote[]

Server (Squad server)
├── id: string (cuid)
├── name: string
├── ip: string
├── port: number
├── isActive: boolean
└── votes: Vote[]

Player (Vote target)
├── steam64: string (PK)
├── lastKnownName: string
├── firstSeenAt: DateTime
├── lastSeenAt: DateTime
└── receivedVotes: Vote[]

Vote (Individual vote)
├── id: string (cuid)
├── voterSteam64: string (FK → User)
├── targetSteam64: string (FK → Player)
├── serverId: string (FK → Server)
├── direction: UP | DOWN
├── reasonCategoryId: number (FK)
└── createdAt: DateTime

ReasonCategory (Reason category)
├── id: number (autoincrement)
├── name: string (unique)
├── type: POSITIVE | NEGATIVE | NEUTRAL
├── sortOrder: number
└── votes: Vote[]
```

### Reason Categories (seed data)

**Negative:**
- Trolling, Teamkilling, Toxic behavior
- Bad at vehicles, Mic spam, Not following orders
- Griefing, AFK / Idle

**Positive:**
- Good squad leader, Helpful, Good pilot/driver
- Team player, Good communication, Skilled player
- Good commander

**Neutral:**
- New player

---

## 🔌 API Endpoints

### Auth
```
GET  /auth/steam              # Start Steam login
GET  /auth/steam/callback     # Steam returns here
GET  /auth/me                 # Returns logged-in user
POST /auth/logout             # Log out
```

### Servers
```
GET  /api/servers             # List of servers
GET  /api/servers/:id         # Single server
GET  /api/servers/:id/players # Players on server (TODO: RCON)
```

### Players
```
GET  /api/players/:steam64           # Player details
GET  /api/players/:steam64/reputation # Reputation stats
GET  /api/players/search?q=          # Search by name
```

### Votes
```
POST /api/votes                      # Submit vote
GET  /api/votes/cooldown/:steam64    # Check cooldown
GET  /api/reason-categories          # Reason categories
```

---

## 🔐 Business Rules

### Voting Restrictions
1. **Cooldown**: 1 vote / hour / (voter + target) pair
2. **Rate limit**: Max 10 votes / 10 min (globally per user)
3. **Authentication**: Only logged-in users can vote
4. **Ban**: Banned users cannot vote but can view

### Validations
- Steam64 ID: 17 digits, starts with "7656119"
- Direction: "UP" or "DOWN"
- ReasonCategoryId: Existing active category

### Anonymity
- Regular users cannot see who voted for whom
- Admin can see audit log (future feature)

---

## 🚀 Development Phases

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Project folder structure
- [x] Package.json and dependencies
- [x] TypeScript configuration
- [x] Prisma schema
- [x] Basic Fastify application
- [x] Redis helper functions (cooldown, rate limit)
- [x] Error classes
- [x] Frontend base (React + Vite + Tailwind)

### 🔄 Phase 2: Authentication (NEXT)
- [ ] Steam OpenID integration
- [ ] Session management (Redis)
- [ ] Auth middleware
- [ ] /auth/* routes

### ⏳ Phase 3: Servers and Players
- [ ] Servers CRUD
- [ ] Players search/creation
- [ ] Seed data for servers

### ⏳ Phase 4: Voting Logic
- [ ] Vote endpoint
- [ ] Cooldown logic
- [ ] Rate limiting
- [ ] Validations

### ⏳ Phase 5: Reputation
- [ ] Aggregations (up/down count)
- [ ] Top categories
- [ ] Time series data
- [ ] Server-specific breakdown

### ⏳ Phase 6: Polish
- [ ] Error handling
- [ ] Loading states
- [ ] Toast notifications
- [ ] Mobile responsive

### ⏳ Future (v2+)
- [ ] Admin panel
- [ ] RCON integration (live player list)
- [ ] WebSocket (real-time updates)
- [ ] Audit logs

---

## 🛠️ Development Commands

### Backend
```bash
cd SquadKarma
npm install              # Install dependencies
npm run dev              # Start dev server
npm run db:push          # Sync schema to database
npm run db:seed          # Add seed data
npm run db:studio        # Open Prisma Studio
```

### Frontend
```bash
cd SquadKarma/frontend
npm install              # Install dependencies
npm run dev              # Start Vite dev server
npm run build            # Production build
```

### Databases (Docker)
```bash
# PostgreSQL
docker run -d --name squad-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=squad_karma \
  -p 5432:5432 postgres:15

# Redis
docker run -d --name squad-redis \
  -p 6379:6379 redis:7
```

---

## 📝 Coding Conventions

### TypeScript
- Strict mode always enabled
- No `any` types (except temporarily)
- No `I` prefix for interface names
- Enums in SCREAMING_SNAKE_CASE

### React
- Functional components
- Custom hooks with `use` prefix
- Props interfaces alongside component
- Lazy loading for large pages

### Backend
- Modular structure (auth, users, votes...)
- Service layer for business logic
- Route layer for HTTP handling
- Zod for validation

### Git
- Conventional Commits (feat:, fix:, docs:...)
- Feature branches
- PRs before merging to main

---

## ⚠️ Important Notes

### Security
- Never store Steam API key in repo
- Session secret minimum 32 characters
- Rate limiting prevents spam attacks
- Input validation for all endpoints

### Performance
- Redis for cooldown checks (no DB queries)
- Database indexes (steam64, createdAt)
- Aggregations can be cached later

### User Experience
- Clear error messages
- Loading states for all async operations
- Mobile-first responsive design
- Dark theme (Squad-inspired)

---

## 🔗 Useful Links

- [Steam Web API](https://steamcommunity.com/dev)
- [Fastify Docs](https://fastify.dev/docs/latest/)
- [Prisma Docs](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📚 Context7 Compatibility

Code has been verified and updated according to Context7 documentation:

| Library | Version | Notes |
|---------|---------|-------|
| **Fastify** | 4.x | Basic structure follows documentation |
| **Prisma** | 6.x | Uses `@prisma/adapter-pg` adapter (Context7 recommendation) |
| **ioredis** | 5.x | Import: `import Redis from 'ioredis'` |
| **@fastify/passport** | 3.x | Authenticator class + secureSession |
| **@fastify/cors** | 9.x | Registration follows documentation |
| **Zod** | 3.x | Environment variable validation |

### Prisma Adapter Usage
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

### @fastify/passport Usage
```typescript
import { Authenticator } from '@fastify/passport';

const fastifyPassport = new Authenticator();
app.register(fastifyPassport.initialize());
app.register(fastifyPassport.secureSession());
```

---

*Updated: Context7 verification completed*
