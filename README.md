# Squad Karma API

Squad-pelaajien reputaatiojärjestelmän backend.

## Vaatimukset

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

## Asennus

```bash
# Asenna riippuvuudet
npm install

# Kopioi ympäristömuuttujat
cp .env.example .env
# Muokkaa .env tiedostoa omilla arvoillasi

# Alusta tietokanta
npm run db:push

# Lisää peruskategoriat
npm run db:seed

# Käynnistä kehityspalvelin
npm run dev
```

## Ympäristömuuttujat

| Muuttuja | Kuvaus |
|----------|--------|
| `DATABASE_URL` | PostgreSQL-yhteysosoite |
| `REDIS_URL` | Redis-yhteysosoite |
| `STEAM_API_KEY` | Steam Web API -avain |
| `SESSION_SECRET` | Sessioiden salausavain (min 32 merkkiä) |

## API-endpointit

```
GET  /health                         - Terveystarkistus
GET  /auth/steam                     - Aloita Steam-kirjautuminen
GET  /auth/steam/callback            - Steam-callback
GET  /auth/me                        - Kirjautunut käyttäjä
POST /auth/logout                    - Kirjaudu ulos

GET  /api/servers                    - Lista servereistä
GET  /api/players/:steam64           - Pelaajan tiedot
GET  /api/players/:steam64/reputation - Reputaatiotilastot
GET  /api/reason-categories          - Syykategoriat
POST /api/votes                      - Anna ääni
```

## Kehityskomennot

```bash
npm run dev          # Käynnistä kehityspalvelin
npm run build        # Käännä tuotantoversioksi
npm run db:studio    # Avaa Prisma Studio (tietokannan hallinta)
npm run db:migrate   # Luo uusi migraatio
```
