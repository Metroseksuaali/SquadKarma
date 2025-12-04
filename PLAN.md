# SquadKarma – Suunnitelma

## 1. Tavoite ja perusidea
- Rakennetaan yhteisövetoisen Squad-reputaatiosivun MVP.
- Steam-kirjautuminen sitoo äänet oikeaan tiliin; OWI:sta riippumaton yhteisöprojekti.

## 2. Roolit
- **Käyttäjä:** Kirjautuu Steamilla, valitsee serverin ja pelaajan, antaa peukun ja syykategorian, tarkistaa reputaation.
- **Admin/Moderaattori:** Näkee raportit ja tilastot, poistaa väärinkäyttöä, hallinnoi syykategorioita ja mahdollisia blacklist-sanoja.
- **Järjestelmä:** Hoitaa Steam-authin, valvoo 1 ääni / tunti / kohde, kokoaa reputaatiotilastot ja valvoo spam-sääntöjä.

## 3. Keskeiset käyttäjäpolut
- **Kirjautuminen:** "Sign in with Steam" → Steam palauttaa Steam64ID:n, nimen, avatarin → backend luo/päivittää käyttäjän.
- **Serverin ja pelaajan valinta:** Näytetään serverilista → valitaan serveri → listataan sen pelaajat (Steam64ID) → fallback-haku ID:llä/nimellä tarvittaessa.
- **Äänen antaminen:** Valitaan 👍/👎 + syykategoria → backend tarkistaa onko äänestetty samaa kohdepelaajaa < 1 h → hyväksyy tai palauttaa odotusajan.
- **Reputaation katselu:** Haetaan pelaaja serveriltä tai haulla → näytetään up/down-summat, top-syyt (esim. 30 pv), aikasarja ja mahdolliset varoitustasot.

## 4. Säännöt ja rajoitteet
- **Cooldown:** 1 ääni / tunti / (äänestäjä + kohdepelaaja); ääni voi olla up tai down, ei molempia.
- **Spam-suoja:** Globaalirajoitus X ääntä / 10 min / käyttäjä; IP tallennetaan mahdollisiin väärinkäytösanalyyseihin.
- **Anonyymius:** Julkisesti ei näytetä kuka äänesti; admin näkee audit-logista.
- **Syykategoriat:** Esim. Trolling, Teamkilling, Bad at vehicles, Good squad leader, Helpful, New player, jne.; ei vapaata tekstiä MVP:ssä.
- **Serverikonteksti:** Ääni liittyy sekä kohdepelaajaan että serveriin (voi käyttäytyä eri tavoin eri servereillä).

## 5. Arkkitehtuurilinja
- **Frontend:** Kirjautumis- ja äänestys UI sekä reputilastot.
- **Backend API:** Steam-auth, endpointit /servers, /servers/{id}/players, /players/{steam64}/reputation, POST /votes; toteuttaa cooldownin ja validoinnin.
- **Tietokanta:** User, Server, Player, Vote, ReasonCategory, AuditLog.
- **Integraatiot:** Steam OpenID/OAuth; Squad-serverien pelaajadata pluginilla, RCONilla tai välipalvelulla.

## 6. Tietomallin luonnos
- **User:** id, steam64, displayName, avatarUrl, createdAt, lastLogin.
- **Server:** id, name, ip, port, communityTag, isActive.
- **Player:** steam64 (PK), lastKnownName, firstSeenAt, lastSeenAt.
- **Vote:** id, voterSteam64 → User, targetSteam64 → Player, serverId → Server, direction (UP/DOWN), reasonCategoryId, createdAt.
- **ReasonCategory:** id, name, type (NEGATIVE/POSITIVE/NEUTRAL).
- **AuditLog:** id, adminUserId, actionType (DELETE_VOTE, BAN_USER, ...), target (voteId/userId), createdAt.

## 7. Prosessit (tekstuaaliset swimlanet)
- **Kirjautuminen:** Käyttäjä → Frontend → Steam → Backend → DB (luo/päivittää User, palauttaa session).
- **Äänen antaminen:** Käyttäjä valitsee serverin ja pelaajan → POST /votes → backend tarkistaa tunnin cooldownin → tallentaa Vote tai palauttaa odotusajan → palauttaa tuoreet reputilastot.
- **Reputaation haku:** GET /players/{steam64}/reputation → backend aggregoi UP/DOWN + kategoriat + aikasarja → frontend renderöi.

## 8. Moderointi ja väärinkäytösten hallinta (MVP + v2)
- **MVP:** Admin voi tarkastella ja poistaa ilmeisiä trolliääniä; audit-logi tallentaa toimenpiteet; bannattu käyttäjä ei voi äänestää.
- **V2+ ideat:** Raportit epäilyttävistä äänestyskuvioista (esim. negatiivinen swarmi), targeted harassment -ilmaisimet, laajempi analytiikka.

## 9. Roadmap (korkean tason sprintit)
1) Määrittely: lukitaan säännöt, syykategoriat, ei vapaata tekstiä.
2) Teknologia- ja integraatiovalinnat: frontend/backend/db, pelaajalistan hakutapa serveriltä.
3) Perusrunko: Steam-auth, User-malli, sessiot.
4) Reputaatiosysteemi: Vote-entiteetti, cooldown ja spam-suoja, äänien API:t.
5) UI: kirjautuminen, serveri/pelaajavalinta, äänestys, reputilastot.
6) Moderointi & analytiikka (v2): admin-paneeli ja raportit.
