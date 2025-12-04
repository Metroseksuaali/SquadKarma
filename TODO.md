# Squad Karma - Project TODO

> Track progress for each development phase.
> Mark completed items with [x].

---

## Phase 1: Foundation ✅ COMPLETE

- [x] Project folder structure
- [x] package.json with dependencies
- [x] tsconfig.json configuration
- [x] Prisma schema (User, Server, Player, Vote, ReasonCategory)
- [x] Prisma seed file for reason categories
- [x] Environment config with Zod validation
- [x] Prisma client singleton with pg adapter
- [x] Redis client with helper functions
- [x] Error classes (AppError, CooldownError, etc.)
- [x] Steam64 validation utilities
- [x] Basic Fastify app setup
- [x] Server entry point with graceful shutdown
- [x] Auth guard middleware
- [x] Frontend base structure (React + Vite + Tailwind)
- [x] Documentation (README.md, Claude.md)

---

## Phase 2: Authentication 🔄 IN PROGRESS

### Backend Tasks
- [x] Create `src/modules/auth/` folder structure
- [x] Implement Steam OpenID strategy with node-steam-openid
- [x] Create auth routes:
  - [x] GET `/auth/steam` - Redirect to Steam login
  - [x] GET `/auth/steam/callback` - Handle Steam response
  - [x] GET `/auth/me` - Return current user
  - [x] POST `/auth/logout` - Clear session
- [x] Session storage in Redis
- [x] User creation/update on successful login
- [x] Serialize/deserialize user for session

### Frontend Tasks
- [x] Steam login button component
- [x] Auth context/hook for user state
- [x] Protected route wrapper
- [x] User avatar display in header
- [x] Logout functionality

### Testing
- [ ] Test login flow manually
- [ ] Verify session persistence
- [ ] Test logout clears session

---

## Phase 3: Servers & Players ⏳ PENDING

### Backend Tasks
- [ ] Create `src/modules/servers/` folder
  - [ ] servers.routes.ts
  - [ ] servers.service.ts
  - [ ] servers.schema.ts (Zod)
- [ ] Server endpoints:
  - [ ] GET `/api/servers` - List all active servers
  - [ ] GET `/api/servers/:id` - Single server details
  - [ ] POST `/api/servers` (admin only, future)
- [ ] Create `src/modules/players/` folder
  - [ ] players.routes.ts
  - [ ] players.service.ts
  - [ ] players.schema.ts (Zod)
- [ ] Player endpoints:
  - [ ] GET `/api/players/:steam64` - Player details
  - [ ] GET `/api/players/search?q=` - Search by name
- [ ] Auto-create player record on first vote
- [ ] Add seed data for test servers

### Frontend Tasks
- [ ] Server list page
- [ ] Server card component
- [ ] Player search input
- [ ] Player card component
- [ ] Navigate from server → player selection

### Testing
- [ ] Test server list loads
- [ ] Test player search works
- [ ] Test player creation on first access

---

## Phase 4: Voting System ⏳ PENDING

### Backend Tasks
- [ ] Create `src/modules/votes/` folder
  - [ ] votes.routes.ts
  - [ ] votes.service.ts
  - [ ] votes.schema.ts (Zod)
- [ ] Vote endpoints:
  - [ ] POST `/api/votes` - Submit a vote
  - [ ] GET `/api/votes/cooldown/:steam64` - Check cooldown status
  - [ ] GET `/api/reason-categories` - List categories
- [ ] Business logic:
  - [ ] Validate voter is authenticated
  - [ ] Validate voter is not banned
  - [ ] Validate target ≠ voter
  - [ ] Validate server exists
  - [ ] Validate reason category exists
  - [ ] Check cooldown (Redis)
  - [ ] Check rate limit (Redis)
  - [ ] Create vote record
  - [ ] Set cooldown key in Redis

### Frontend Tasks
- [ ] Vote modal/dialog component
- [ ] Thumbs up/down buttons
- [ ] Reason category dropdown
- [ ] Cooldown timer display
- [ ] Success/error feedback (toast)
- [ ] Rate limit warning

### Testing
- [ ] Test successful vote submission
- [ ] Test cooldown blocks repeat vote
- [ ] Test rate limit kicks in after 10 votes
- [ ] Test validation errors show correctly

---

## Phase 5: Reputation System ⏳ PENDING

### Backend Tasks
- [ ] Create `src/modules/reputation/` folder
  - [ ] reputation.routes.ts
  - [ ] reputation.service.ts
- [ ] Reputation endpoint:
  - [ ] GET `/api/players/:steam64/reputation`
- [ ] Aggregation queries:
  - [ ] Total upvotes count
  - [ ] Total downvotes count
  - [ ] Votes by category (top 5)
  - [ ] Votes over time (last 30 days)
  - [ ] Server-specific breakdown (optional)
- [ ] Calculate reputation score/ratio
- [ ] Consider caching hot player stats in Redis

### Frontend Tasks
- [ ] Player profile page
- [ ] Reputation summary card (up/down counts)
- [ ] Category breakdown chart (bar chart)
- [ ] Time series chart (line chart, last 30 days)
- [ ] Reputation badge/indicator
- [ ] Share player profile link

### Testing
- [ ] Test aggregation returns correct counts
- [ ] Test category breakdown is accurate
- [ ] Test time series data format
- [ ] Test empty player (no votes)

---

## Phase 6: Polish & UX ⏳ PENDING

### Error Handling
- [ ] Global error boundary (React)
- [ ] API error interceptor
- [ ] User-friendly error messages
- [ ] 404 page styling
- [ ] Network error handling

### Loading States
- [ ] Skeleton loaders for lists
- [ ] Spinner for actions
- [ ] Optimistic UI updates for votes
- [ ] Suspense boundaries

### Notifications
- [ ] Toast notification system
- [ ] Success messages
- [ ] Error messages
- [ ] Cooldown warnings

### Responsive Design
- [ ] Mobile navigation (hamburger menu)
- [ ] Touch-friendly vote buttons
- [ ] Responsive tables/lists
- [ ] Test on various screen sizes

### Accessibility
- [ ] Keyboard navigation
- [ ] ARIA labels
- [ ] Focus management
- [ ] Color contrast check

### Performance
- [ ] Code splitting (lazy routes)
- [ ] Image optimization
- [ ] API response caching
- [ ] Bundle size analysis

---

## Future: v2+ Features ⏳ BACKLOG

### Admin Panel
- [ ] Admin authentication/role check
- [ ] Dashboard with stats overview
- [ ] User management (ban/unban)
- [ ] Vote moderation (delete suspicious votes)
- [ ] Audit log viewer
- [ ] Reason category management

### RCON Integration
- [ ] Connect to Squad server via RCON
- [ ] Fetch live player list
- [ ] Auto-sync players to database
- [ ] Server status indicator

### Real-time Updates
- [ ] WebSocket connection
- [ ] Live vote notifications
- [ ] Real-time reputation updates
- [ ] Online player count

### Analytics
- [ ] Most voted players
- [ ] Most active voters
- [ ] Trending servers
- [ ] Category distribution over time

### API Enhancements
- [ ] API rate limiting per key
- [ ] Public API documentation (Swagger)
- [ ] Webhook notifications
- [ ] Export data (CSV)

---

## Quick Reference

| Phase | Status | Priority |
|-------|--------|----------|
| 1. Foundation | ✅ Complete | - |
| 2. Authentication | 🔄 In Progress | HIGH |
| 3. Servers & Players | ⏳ Pending | HIGH |
| 4. Voting System | ⏳ Pending | HIGH |
| 5. Reputation | ⏳ Pending | MEDIUM |
| 6. Polish | ⏳ Pending | MEDIUM |
| 7. Future (v2+) | ⏳ Backlog | LOW |

---

*Last updated: December 2024*
