# Squad Karma - Project Context for Claude

> Tämä tiedosto sisältää kaiken oleellisen kontekstin projektista Claude-assistentille.
> Päivitä tätä tiedostoa kun projekti etenee.

---

## 📦 GitHub Repository

- **Repo:** https://github.com/Metroseksuaali/SquadKarma
- **Kehityshaara:** `dev` (pääasiallinen työhaara)
- **Tuotanto:** `main` (vain valmiit releaset)
- **Lokaali polku:** `O:\vibecode\SquadKarma_new`

### Git-työskentely
```bash
# Varmista että olet dev-branchissa
git checkout dev

# Vedä uusimmat muutokset
git pull origin dev

# Committaa muutokset
git add .
git commit -m "feat: kuvaus"
git push origin dev
```

---

## 🎯 Projektin Tavoite

**Squad Karma** on community-projekti, joka tarjoaa reputaatiojärjestelmän Squad-pelin pelaajille.

### Ydinominaisuudet:
1. **Steam-kirjautuminen** - Käyttäjät kirjautuvat Steam-tilillään
2. **Serveri- ja pelaajahaku** - Valitse serveri ja löydä pelaaja
3. **Äänestys** - Anna peukku ylös/alas + syykategoria
4. **Reputaation katselu** - Näe pelaajan kokonaisreputaatio ja historia
5. **Cooldown** - Sama käyttäjä voi äänestää samaa pelaajaa vain kerran tunnissa

### Ei ole:
- Virallinen OWI:n projekti
- Pelkästään negatiivinen "lynkkauspalvelu"
- Vapaatekstipohjainen (vältetään häirintä)

---

## 🏗️ Arkkitehtuuri

### Tech Stack

| Kerros | Teknologia | Miksi |
|--------|------------|-------|
| **Frontend** | React + TypeScript + Vite | Komponenttipohjainen, nopea kehitys |
| **Styling** | Tailwind CSS | Utility-first, tumma teema |
| **State** | TanStack Query + Zustand | Server state + client state erikseen |
| **Backend** | Node.js + Fastify + TypeScript | Nopea, Steam-kirjastot |
| **Database** | PostgreSQL + Prisma ORM | Relaatiotietokanta, tyyppiturva |
| **Cache** | Redis | Cooldown, rate limiting, sessiot |
| **Auth** | @fastify/passport + node-steam-openid | Steam OpenID |

### Kansiorakenne

```
SquadKarma/
├── frontend/                 # React-sovellus
│   ├── src/
│   │   ├── components/       # UI-komponentit
│   │   │   ├── ui/          # Yleiset (Button, Input, Card)
│   │   │   ├── layout/      # Layout (Header, Footer)
│   │   │   └── features/    # Ominaisuuskohtaiset
│   │   ├── pages/           # Sivukomponentit (routing)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API-kutsut
│   │   ├── store/           # Zustand state
│   │   ├── types/           # TypeScript-tyypit
│   │   └── utils/           # Apufunktiot
│   └── public/              # Staattiset tiedostot
│
├── src/                      # Backend (Node.js)
│   ├── config/              # Ympäristömuuttujat
│   ├── db/                  # Tietokantayhteydet
│   ├── middleware/          # Fastify middlewaret
│   ├── modules/             # Ominaisuusmoduulit
│   │   ├── auth/           # Steam-kirjautuminen
│   │   ├── users/          # Käyttäjähallinta
│   │   ├── servers/        # Serverilista
│   │   ├── players/        # Pelaajatiedot
│   │   ├── votes/          # Äänestyslogiikka
│   │   └── reputation/     # Reputaatiolaskenta
│   └── utils/               # Apufunktiot
│
├── prisma/                   # Tietokantaskeema
│   ├── schema.prisma        # Tietomalli
│   └── seed.ts              # Peruskategoriat
│
└── Claude.md                 # Tämä tiedosto
```

---

## 📊 Tietomalli

### Entiteetit

```
User (Kirjautunut käyttäjä)
├── id: string (cuid)
├── steam64: string (unique)
├── displayName: string
├── avatarUrl: string?
├── isBanned: boolean
└── votes: Vote[]

Server (Squad-palvelin)
├── id: string (cuid)
├── name: string
├── ip: string
├── port: number
├── isActive: boolean
└── votes: Vote[]

Player (Äänestyksen kohde)
├── steam64: string (PK)
├── lastKnownName: string
├── firstSeenAt: DateTime
├── lastSeenAt: DateTime
└── receivedVotes: Vote[]

Vote (Yksittäinen ääni)
├── id: string (cuid)
├── voterSteam64: string (FK → User)
├── targetSteam64: string (FK → Player)
├── serverId: string (FK → Server)
├── direction: UP | DOWN
├── reasonCategoryId: number (FK)
└── createdAt: DateTime

ReasonCategory (Syykategoria)
├── id: number (autoincrement)
├── name: string (unique)
├── type: POSITIVE | NEGATIVE | NEUTRAL
├── sortOrder: number
└── votes: Vote[]
```

### Syykategoriat (seed data)

**Negatiiviset:**
- Trolling, Teamkilling, Toxic behavior
- Bad at vehicles, Mic spam, Not following orders
- Griefing, AFK / Idle

**Positiiviset:**
- Good squad leader, Helpful, Good pilot/driver
- Team player, Good communication, Skilled player
- Good commander

**Neutraalit:**
- New player

---

## 🔌 API-rajapinnat

### Auth
```
GET  /auth/steam              # Aloita Steam-login
GET  /auth/steam/callback     # Steam palauttaa tänne
GET  /auth/me                 # Palauttaa kirjautuneen käyttäjän
POST /auth/logout             # Kirjaudu ulos
```

### Servers
```
GET  /api/servers             # Lista servereistä
GET  /api/servers/:id         # Yksittäinen serveri
GET  /api/servers/:id/players # Pelaajat serverillä (TODO: RCON)
```

### Players
```
GET  /api/players/:steam64           # Pelaajan tiedot
GET  /api/players/:steam64/reputation # Reputaatiotilastot
GET  /api/players/search?q=          # Haku nimellä
```

### Votes
```
POST /api/votes                      # Anna ääni
GET  /api/votes/cooldown/:steam64    # Tarkista cooldown
GET  /api/reason-categories          # Syykategoriat
```

---

## 🔐 Liiketoimintasäännöt

### Äänestysrajoitukset
1. **Cooldown**: 1 ääni / tunti / (äänestäjä + kohde) pari
2. **Rate limit**: Max 10 ääntä / 10 min (globaalisti per käyttäjä)
3. **Autentikointi**: Vain kirjautuneet voivat äänestää
4. **Banni**: Bannatut eivät voi äänestää mutta voivat katsoa

### Validoinnit
- Steam64 ID: 17 numeroa, alkaa "7656119"
- Direction: "UP" tai "DOWN"
- ReasonCategoryId: Olemassa oleva aktiivinen kategoria

### Anonymiteetti
- Peruskäyttäjä ei näe kuka äänesti ketä
- Admin näkee audit-logista (myöhempi ominaisuus)

---

## 🚀 Kehitysvaiheet

### ✅ Vaihe 1: Pohja (VALMIS)
- [x] Projektin kansiorakenne
- [x] Package.json ja riippuvuudet
- [x] TypeScript-konfiguraatio
- [x] Prisma-skeema
- [x] Perus Fastify-sovellus
- [x] Redis-apufunktiot (cooldown, rate limit)
- [x] Error-luokat
- [x] Frontend-pohja (React + Vite + Tailwind)

### 🔄 Vaihe 2: Autentikointi (SEURAAVA)
- [ ] Steam OpenID -integraatio
- [ ] Session-hallinta (Redis)
- [ ] Auth middleware
- [ ] /auth/* routet

### ⏳ Vaihe 3: Serverit ja pelaajat
- [ ] Servers CRUD
- [ ] Players haku/luonti
- [ ] Seed-data servereille

### ⏳ Vaihe 4: Äänestyslogiikka
- [ ] Vote-endpoint
- [ ] Cooldown-logiikka
- [ ] Rate limiting
- [ ] Validoinnit

### ⏳ Vaihe 5: Reputaatio
- [ ] Aggregaatiot (up/down count)
- [ ] Top-kategoriat
- [ ] Aikasarjadata
- [ ] Serverikohtainen breakdown

### ⏳ Vaihe 6: Polish
- [ ] Error handling
- [ ] Loading states
- [ ] Toast-notifikaatiot
- [ ] Mobile responsive

### ⏳ Tulevaisuus (v2+)
- [ ] Admin-paneeli
- [ ] RCON-integraatio (live-pelaajalista)
- [ ] WebSocket (reaaliaikaiset päivitykset)
- [ ] Audit-logit

---

## 🛠️ Kehityskomennot

### Backend
```bash
cd SquadKarma
npm install              # Asenna riippuvuudet
npm run dev              # Käynnistä dev-serveri
npm run db:push          # Synkronoi schema tietokantaan
npm run db:seed          # Lisää seed-data
npm run db:studio        # Avaa Prisma Studio
```

### Frontend
```bash
cd SquadKarma/frontend
npm install              # Asenna riippuvuudet
npm run dev              # Käynnistä Vite dev-serveri
npm run build            # Tuotantobuildi
```

### Tietokannat (Docker)
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

## 📝 Koodauskäytännöt

### TypeScript
- Strict mode aina päällä
- Ei `any`-tyyppejä (paitsi väliaikaisesti)
- Interface nimiin ei `I`-prefiksiä
- Enumit SCREAMING_SNAKE_CASE

### React
- Funktionaaliset komponentit
- Custom hookit `use`-prefiksillä
- Props-interfacet komponentin yhteydessä
- Lazy loading isoille sivuille

### Backend
- Modulaarinen rakenne (auth, users, votes...)
- Service-kerros business-logiikalle
- Route-kerros HTTP-käsittelylle
- Zod validointiin

### Git
- Conventional Commits (feat:, fix:, docs:...)
- Feature branchit
- PR:t ennen mergea mainiin

---

## ⚠️ Huomioitavaa

### Turvallisuus
- Älä tallenna Steam API -avainta repoon
- Session secret vähintään 32 merkkiä
- Rate limiting estää spam-hyökkäykset
- Input-validointi kaikille endpointeille

### Suorituskyky
- Redis cooldown-tarkistuksiin (ei DB-kyselyitä)
- Indeksit tietokannassa (steam64, createdAt)
- Aggregaatiot voi cachettaa myöhemmin

### Käyttäjäkokemus
- Selkeät virheilmoitukset
- Loading-tilat kaikille async-operaatioille
- Mobile-first responsive design
- Tumma teema (Squad-henkinen)

---

## 🔗 Hyödyllisiä linkkejä

- [Steam Web API](https://steamcommunity.com/dev)
- [Fastify Docs](https://fastify.dev/docs/latest/)
- [Prisma Docs](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📚 Context7 -yhteensopivuus

Koodi on tarkistettu ja päivitetty Context7-dokumentaation mukaiseksi:

| Kirjasto | Versio | Huomiot |
|----------|--------|---------|
| **Fastify** | 4.x | Perusrakenne dokumentaation mukainen |
| **Prisma** | 6.x | Käyttää `@prisma/adapter-pg` adapteria (Context7 suositus) |
| **ioredis** | 5.x | Import: `import Redis from 'ioredis'` |
| **@fastify/passport** | 3.x | Authenticator-luokka + secureSession |
| **@fastify/cors** | 9.x | Rekisteröinti dokumentaation mukainen |
| **Zod** | 3.x | Ympäristömuuttujien validointi |

### Prisma-adapterin käyttö
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

### @fastify/passport -käyttö
```typescript
import { Authenticator } from '@fastify/passport';

const fastifyPassport = new Authenticator();
app.register(fastifyPassport.initialize());
app.register(fastifyPassport.secureSession());
```

---

*Päivitetty: Context7-tarkistus suoritettu*
