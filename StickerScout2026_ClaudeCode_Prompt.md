# StickerScout 2026 — Claude Code Prompt
**NCN-NetConsulting GmbH | Version 3.0 | Juni 2026**

---

---

# 🇩🇪 DEUTSCH

## Projektkontext

Entwickle **StickerScout 2026** — eine React Native App für iOS und Android zur FIFA Fußball-Weltmeisterschaft 2026. Die App ist der KI-gestützte Begleiter für Sticker- und Trading-Card-Sammler und unterstützt BEIDE offiziellen Panini-Kollektionen zur WM 2026 — plus alle Sondereditions-Sticker.

**Basis:** Gleiche Architektur wie unsere bestehende App **AI Coin Collection Platform (CoinScanner)** — React Native, Firebase, Expo Camera + Google ML Kit.

**Developer:** NCN-NetConsulting GmbH (Österreich)
**Target date:** Launch zum WM-Start, 11. Juni 2026

---

## Kollektionen & Datenbanken

### A) Panini Sticker-Kollektion
Datei: `sticker_db_wc2026.json`

| Sektion | Anzahl | Beschreibung |
|---|---|---|
| Base Sticker | 980 | 48 Teams + Intro/Museum |
| Coca-Cola Sticker | 12 (CC1–CC12) | Unter Flaschendeckeln versteckt |
| Extra Sticker | 20 (EXTRA1–EXTRA20) | 1:100 Tüten, extrem selten |
| **Total für 100%** | **1.012** | Vollständiges Album |

**Alphanumerisches Nummerierungssystem:**
- Teams: `[TEAMCODE][1-20]` — z.B. `AUT4` = David Alaba
- Intro/Museum: `00`, `FWC1`–`FWC19`
- Coca-Cola: `CC1`–`CC12`
- Extra: `EXTRA1`–`EXTRA20`

**48 Teams in 12 Gruppen:**
```
A: MEX RSA KOR CZE   |  G: BEL EGY IRN NZL
B: CAN BIH QAT SUI   |  H: ESP CPV KSA URU
C: BRA MAR HAI SCO   |  I: FRA SEN IRQ NOR
D: USA PAR AUS TUR   |  J: ARG ALG AUT JOR
E: GER CUW CIV ECU   |  K: POR COD UZB COL
F: NED JPN SWE TUN   |  L: ENG CRO GHA PAN
```

**Coca-Cola Sticker (CC1–CC12):**
```
CC1  Lamine Yamal      (Spain)       FOIL
CC2  Joshua Kimmich    (Germany)     FOIL
CC3  Eduardo Camavinga (France)      FOIL
CC4  Josko Gvardiol    (Croatia)     FOIL
CC5  Federico Valverde (Uruguay)     FOIL
CC6  Virgil van Dijk   (Netherlands) FOIL
CC7  Alphonso Davies   (Canada)      FOIL
CC8  Raúl Jiménez      (Mexico)      FOIL
CC9  William Saliba    (France)      FOIL
CC10 Lautaro Martínez  (Argentina)   FOIL
CC11 Harry Kane        (England)     FOIL
CC12 Antonee Robinson  (USA)         FOIL
```
**Hinweis:** Regionale Varianten existieren (EUR / NAUO / LATAM / RoW). App erkennt alle Versionen.

### B) Panini Adrenalyn XL Trading Cards (630 Karten)
- 417 Base Cards + 213 Special Cards
- Kategorien: Heroes, Fan Favourites, Icons, Team Logos, Top Keepers, Defensive Rocks, Midfield Maestros, Goal Machines, Master Rookies (16), Golden Baller (9), Eternos 22 (22)
- Limited Editions: in separaten Produkten (Tins, Premium Packs)
- Momentum Cards: Bellingham, Dembélé, Pulisic (Dream Box exklusiv)
- **Jede Karte enthält einen Online-Game-Code** (Rückseite) für das offizielle Adrenalyn XL Spiel

---

## Features — Vollständig

### 1. KI-SCANNER

**Drei Scan-Modi:**

| Modus | Erkennt | Lookup |
|---|---|---|
| Sticker-Scan | Teamcode + Nummer (z.B. `AUT4`) | sticker_db_wc2026.json |
| Coca-Cola-Scan | CC-Code auf Etikett | CC1–CC12 |
| Adrenalyn XL Scan | Kartennummer + Kategorie | adrenalyn_db_wc2026.json |

**Album-Seiten-Scanner (NEU):**
- Kamera auf eine ganze Album-Seite richten
- ML Kit erkennt alle Sticker auf der Seite gleichzeitig
- Automatisches Eintragen aller erkannten Sticker ins digitale Album
- Spart stundenlange manuelle Eingabe

**Promo-Code-Scanner (NEU):**
- Scannt QR-Codes / Textcodes von:
  - Adrenalyn XL Packs (Online-Game-Codes)
  - Coca-Cola Flaschen (tägliche digitale Packs)
  - Panini/FIFA/McDonald's Promo-Codes
- Verwaltung gescannter Codes (eingelöst / verfügbar)

**Scan-Limits:**
- Free: 20 Scans/Tag
- Premium: Unbegrenzt

### 2. DIGITALES ALBUM

**Tab A — Sticker (980 + 12 CC + 20 Extra = 1.012)**
- Grid-Ansicht nach Gruppen A–L geordnet
- Eigene Sektion: "Coca-Cola Special" (CC1–CC12)
- Eigene Sektion: "Extra Sticker" (EXTRA1–EXTRA20, mit Seltenheitsanzeige)
- Filter: vorhanden / doppelt / fehlend / FOIL / CC / Extra
- Fortschrittsbalken: Album (980), CC-Seite (12), Extras (20), Gesamt (1.012)

**Tab B — Adrenalyn XL (630)**
- Grid-Ansicht nach Kategorie
- Seltenheitsstufen: Standard / Rare / Ultra Rare / Limited / Momentum
- Golden Baller & Eternos 22 gesondert hervorgehoben
- Online-Code-Status: eingelöst / verfügbar

### 3. COMPLETION CALCULATOR (NEU)

Statistische Berechnung nach dem "Coupon Collector's Problem":

```
Eingabe:  Aktuelle Sammlung (z.B. 450/980 Sticker)
Ausgabe:
  - Erwartete Anzahl noch benötigter Tüten: ~187
  - Kosten bei €0,60/Tüte: ~€112
  - Wahrscheinlichkeit, in X Tüten fertig zu sein: Kurve
  - Effizienzbonus durch aktiven Tausch: ~30% weniger Tüten
```

Premium-Feature: Personalised Completion Report (PDF-Export)

### 4. TAUSCHBÖRSE

- User kann Doppelte einstellen (Sticker UND Karten UND CC-Sticker)
- Matching-Algorithmus: gegenseitiger Bedarf → Match
- Geolokalisierung: Tauschpartner in der Nähe bevorzugen
- In-App-Chat
- Free: 5 aktive Angebote | Premium: Unbegrenzt + Priority-Matching
- **Panini Nachbestellservice Deep-Link (NEU):** Button in "Fehlende Sticker"-Liste → direkter Link zu panini.de/nachbestellservice mit vorausgefüllter Fehlerliste

### 5. FREUNDE & GRUPPEN (NEU)

- Freunde per Link / QR-Code einladen
- Sammlungsvergleich: Wer hat was, das der andere braucht?
- Gruppen-Challenge: Wer füllt das Album zuerst?
- Geteilter Fortschrittsbalken in Freundesgruppe
- Tausch direkt aus Freundesliste initiieren

### 6. SPIELPLAN & ERGEBNISSE

- Alle 104 WM-Spiele (11. Juni – 19. Juli 2026)
- Live-Score-Integration
- **WM-TIPP / BRACKET PREDICTOR (NEU):**
  - Alle 12 Gruppen vorhersagen
  - K.o.-Runden-Bracket ausfüllen
  - Mit Freunden teilen / vergleichen
  - Österreich-Spiele (Gruppe J) hervorgehoben

### 7. ADRENALYN XL DREAM TEAM BUILDER (NEU)

- Aus gescannten Karten ein 11er-Team zusammenstellen
- Formation wählen (4-3-3, 4-4-2, 3-5-2 etc.)
- Team-Stärke berechnen (basierend auf Kartenkategorie/Seltenheit)
- Dream Team als Bild exportieren und teilen
- Premium: Unbegrenzte Teams speichern

### 8. STATISTIKEN & DASHBOARD

- Sammel-Fortschritt: Sticker + CC + Extra + Adrenalyn XL
- Tauschhistorie
- **Marktwert-Tracker (NEU):** Geschätzte Sekundärmarkt-Preise für seltene Sticker (Golden Baller, Limited Editions, Extra-Sticker) — basierend auf eBay-Daten
- Premium: Erweiterte Charts, Completion Calculator Report, Export

---

## Technische Architektur

```
StickerScout 2026
├── Frontend: React Native (Expo SDK 52+)
│   ├── expo-camera           — Kamera + ML Kit
│   ├── @react-navigation/native — Navigation
│   ├── react-native-paper    — UI Components
│   ├── expo-location         — Geolokalisierung
│   └── react-native-share    — Team/Bracket teilen
├── Backend: Firebase
│   ├── Firestore             — Sammlungen, Tauschbörse, Freunde
│   ├── Firebase Auth         — Google/Apple Login
│   ├── Firebase Storage      — Profilbilder, Team-Exports
│   └── Firebase Functions    — Matching, Push-Notifications, Completion-Calc
├── KI: Google ML Kit
│   ├── Text Recognition v2   — Stickernummer + Code OCR
│   ├── Image Labeling        — Foil-Erkennung
│   ├── Document Scanner      — Album-Seiten-Scan (NEU)
│   └── Barcode Scanning      — QR-Code / Promo-Codes (NEU)
└── Lokale Datenbanken (gebündelt mit App)
    ├── sticker_db_wc2026.json    — 980 + 12 CC + 20 Extra
    └── adrenalyn_db_wc2026.json  — 630 Karten
```

### Sticker Lookup (inkl. aller Sektionen)

```javascript
import db from './assets/sticker_db_wc2026.json';

function lookupSticker(id) {
  // Coca-Cola Sticker
  if (id.startsWith('CC')) {
    return db.coca_cola_stickers.find(s => s.id === id) || null;
  }
  // Extra Sticker
  if (id.startsWith('EXTRA')) {
    return db.extra_stickers.find(s => s.id === id) || null;
  }
  // Intro / Museum
  if (id.startsWith('FWC') || id === '00') {
    return db.intro_stickers.find(s => s.id === id) || null;
  }
  // Team Sticker: z.B. AUT4
  const teamCode = id.replace(/\d+$/, '');
  const team = db.teams.find(t => t.code === teamCode);
  if (!team) return null;
  const sticker = team.stickers.find(s => s.id === id);
  return sticker ? { ...sticker, team: team.name, group: team.group } : null;
}

// Completion Calculator
function calcCompletion(owned, total = 980) {
  const missing = total - owned;
  // Expected packs needed = H(total) * total / (total - owned)
  // Simplified: expected additional stickers needed with duplicates
  const expectedPacks = Math.round(missing * (total / (missing + 1)) / 7);
  return {
    owned, missing, total,
    expectedPacksNeeded: expectedPacks,
    estimatedCostEUR: (expectedPacks * 0.60).toFixed(2),
    completionPct: ((owned / total) * 100).toFixed(1)
  };
}
```

### Firebase Firestore Schema

```
users/{userId}
  ├── profile:     { name, premium, scanCount, language, createdAt }
  ├── stickers/{id}:  { owned, count, forTrade, scannedAt }
  ├── cc_stickers/{id}: { owned, count, forTrade }
  ├── extra_stickers/{id}: { owned, count }
  ├── cards/{id}:  { owned, count, forTrade, codeRedeemed, scannedAt }
  ├── friends/[userId]: { addedAt }
  └── dream_teams/{teamId}: { name, formation, players[], createdAt }

trades/{tradeId}
  ├── offeredBy:    userId
  ├── offeredItems: [{ type: "sticker"|"card"|"cc", id, name }]
  ├── wantedItems:  [{ type: "sticker"|"card"|"cc", id, name }]
  ├── status:       "open"|"matched"|"completed"|"cancelled"
  ├── location:     GeoPoint
  └── createdAt:    timestamp

bracket_predictions/{userId}
  ├── groups:  { A: { winner, runner_up }, ... }
  ├── r16:     [{ match, prediction }]
  ├── qf, sf, final: [...]
  └── updatedAt: timestamp
```

---

## Monetarisierung

| Feature | Free | Premium (€1,99/Mo.) |
|---|---|---|
| KI-Scanner | 20/Tag | Unbegrenzt |
| Album-Seiten-Scanner | 3/Tag | Unbegrenzt |
| Sticker + CC + Extra Album | ✅ | ✅ |
| Adrenalyn XL Album | ✅ | ✅ |
| Completion Calculator | Basic | Vollständig + PDF |
| Tauschbörse | 5 Angebote | Unbegrenzt |
| Priority-Matching | ❌ | ✅ |
| Dream Team Builder | 1 Team | Unbegrenzt |
| WM-Tipp/Bracket | ✅ | ✅ |
| Marktwert-Tracker | Top 10 | Alle seltenen |
| Freunde/Gruppen | 5 Freunde | Unbegrenzt |
| Werbung (AdMob) | ✅ | ❌ |

---

## App Store Metadaten

- **App-Name:** StickerScout 2026
- **Bundle ID iOS:** at.ncn.stickerscout2026
- **Package Name Android:** at.ncn.stickerscout2026
- **Kategorie:** Sports / Unterhaltung
- **Altersfreigabe:** 4+ / PEGI 3

---

---

# 🇬🇧 ENGLISH

## Project Context

Build **StickerScout 2026** — a React Native app for iOS and Android for the FIFA World Cup 2026. AI-powered companion for sticker and trading card collectors, supporting BOTH official Panini collections plus all special edition stickers.

**Base:** Same architecture as **AI Coin Collection Platform (CoinScanner)** — React Native, Firebase, Expo Camera + Google ML Kit.

**Developer:** NCN-NetConsulting GmbH (Austria)  
**Target date:** Launch for World Cup kick-off, June 11, 2026

---

## Collections & Databases

### A) Panini Sticker Collection
File: `sticker_db_wc2026.json`

| Section | Count | Description |
|---|---|---|
| Base Stickers | 980 | 48 teams + intro/museum |
| Coca-Cola Stickers | 12 (CC1–CC12) | Hidden under bottle labels |
| Extra Stickers | 20 (EXTRA1–EXTRA20) | 1:100 packs, extremely rare |
| **Total for 100%** | **1,012** | Complete album |

**Sticker ID format:** `[TEAMCODE][1-20]` (e.g. `AUT4` = David Alaba)  
Special: `CC1–CC12` (Coca-Cola), `EXTRA1–EXTRA20`, `FWC1–FWC19`, `00`

**Coca-Cola Stickers (CC1–CC12) — EUR version:**
```
CC1  Lamine Yamal / ESP   CC7  Alphonso Davies / CAN
CC2  Joshua Kimmich / GER CC8  Raúl Jiménez / MEX
CC3  E. Camavinga / FRA   CC9  William Saliba / FRA
CC4  Josko Gvardiol / CRO CC10 Lautaro Martínez / ARG
CC5  Federico Valverde/URU CC11 Harry Kane / ENG
CC6  Virgil van Dijk / NED CC12 Antonee Robinson / USA
```
Note: Regional variants exist (EUR/NAUO/LATAM/RoW). App recognizes all versions.

### B) Panini Adrenalyn XL Trading Cards (630)
- 417 Base Cards + 213 Special Cards
- Each card has an Online Game Code on the reverse for the official Adrenalyn XL game
- Limited Editions: in Tins, Premium Packs, Special Boxes
- Momentum Cards: Bellingham, Dembélé, Pulisic (Dream Box exclusive)

---

## Features — Complete

### 1. AI SCANNER

**Three Scan Modes:**
- **Sticker Mode**: OCR reads team code + number → lookup in sticker_db
- **Coca-Cola Mode**: Scans CC code on bottle label → CC1–CC12
- **Adrenalyn XL Mode**: Reads card number + category → adrenalyn_db

**Album Page Scanner (NEW):**
- Point camera at full album page
- ML Kit Document Scanner identifies all stickers simultaneously
- Auto-adds all detected stickers to digital collection
- Eliminates hours of manual entry

**Promo Code Scanner (NEW):**
- Scans QR codes / text codes from:
  - Adrenalyn XL packs (online game codes)
  - Coca-Cola bottles (daily digital packs)
  - Panini / FIFA / McDonald's promo codes
- Tracks code status: redeemed / available

### 2. DIGITAL ALBUM

**Tab A — Stickers (980 + 12 CC + 20 Extra = 1,012)**
- Grid view by Groups A–L
- Dedicated section: "Coca-Cola Special" (CC1–CC12)
- Dedicated section: "Extra Stickers" (EXTRA1–EXTRA20, rarity indicator)
- Filters: owned / duplicate / missing / FOIL / CC / Extra
- Progress bars: Album (980), CC page (12), Extras (20), Total (1,012)

**Tab B — Adrenalyn XL (630)**
- Grid by category with rarity tiers
- Golden Baller & Eternos 22 highlighted
- Online code status per card

### 3. COMPLETION CALCULATOR (NEW)

Statistical calculation based on the Coupon Collector's Problem:

```
Input:  Current collection (e.g. 450/980 stickers)
Output:
  — Expected additional packs needed: ~187
  — Estimated cost at €0.60/pack: ~€112
  — Probability curve for completing in X packs
  — Efficiency bonus with active trading: ~30% fewer packs
```

Premium: Full personalized completion report (PDF export)

### 4. TRADING EXCHANGE

- List duplicates (stickers, Adrenalyn XL cards, CC stickers)
- Smart matching algorithm
- Geolocation: prefer nearby partners
- In-app chat
- Free: 5 listings | Premium: Unlimited + Priority matching
- **Panini Order Service Deep-Link (NEW):** "Missing stickers" list → direct link to Panini's official replacement service with pre-filled missing list

### 5. FRIENDS & GROUPS (NEW)

- Invite friends via link / QR code
- Collection comparison: who has what you need?
- Group challenge: who completes first?
- Shared progress bar
- Initiate trades directly from friends list

### 6. MATCH SCHEDULE & RESULTS

- All 104 WC 2026 matches (June 11 – July 19)
- Live score integration
- **WM BRACKET PREDICTOR (NEW):**
  - Predict all 12 group standings
  - Fill knockout bracket
  - Share / compare with friends
  - Austria matches (Group J) highlighted

### 7. ADRENALYN XL DREAM TEAM BUILDER (NEW)

- Build an 11-player team from scanned cards
- Choose formation (4-3-3, 4-4-2, 3-5-2 etc.)
- Team strength score based on card category/rarity
- Export and share team image
- Premium: Unlimited saved teams

### 8. STATISTICS & DASHBOARD

- Progress: Stickers + CC + Extra + Adrenalyn XL
- Trade history
- **Market Value Tracker (NEW):** Estimated secondary market prices for rare stickers (Golden Baller, Limited Editions, Extra stickers) — based on eBay/market data
- Premium: Full analytics, completion calculator report, export

---

## Technical Architecture

```
StickerScout 2026
├── Frontend: React Native (Expo SDK 52+)
│   ├── expo-camera           — Camera + ML Kit
│   ├── @react-navigation/native
│   ├── react-native-paper    — UI
│   ├── expo-location         — Geolocation
│   └── react-native-share    — Dream Team / Bracket sharing
├── Backend: Firebase
│   ├── Firestore             — Collections, trades, friends, brackets
│   ├── Firebase Auth         — Google / Apple Sign-In
│   ├── Firebase Storage      — Profile images, team exports
│   └── Firebase Functions    — Matching, push notifications, completion calc
├── AI: Google ML Kit
│   ├── Text Recognition v2   — Sticker number + code OCR
│   ├── Image Labeling        — Foil detection
│   ├── Document Scanner      — Album page scan (NEW)
│   └── Barcode Scanning      — QR / promo codes (NEW)
└── Local Databases (bundled)
    ├── sticker_db_wc2026.json    — 980 + 12 CC + 20 Extra
    └── adrenalyn_db_wc2026.json  — 630 cards
```

### Key Code Snippets

```javascript
// Complete sticker lookup (all sections)
import db from './assets/sticker_db_wc2026.json';

function lookupSticker(id) {
  if (id.startsWith('CC'))    return db.coca_cola_stickers.find(s => s.id === id);
  if (id.startsWith('EXTRA')) return db.extra_stickers.find(s => s.id === id);
  if (id.startsWith('FWC') || id === '00')
                              return db.intro_stickers.find(s => s.id === id);
  const teamCode = id.replace(/\d+$/, '');
  const team = db.teams.find(t => t.code === teamCode);
  const sticker = team?.stickers.find(s => s.id === id);
  return sticker ? { ...sticker, team: team.name, group: team.group } : null;
}

// Completion Calculator
function calcCompletion(owned, total = 980) {
  const missing = total - owned;
  const expectedPacks = Math.round(missing * (total / (missing + 1)) / 7);
  return {
    owned, missing, total,
    expectedPacksNeeded: expectedPacks,
    estimatedCostEUR: (expectedPacks * 0.60).toFixed(2),
    completionPct: ((owned / total) * 100).toFixed(1)
  };
}
```

### Firebase Schema

```
users/{userId}
  ├── profile: { name, premium, scanCount, language, createdAt }
  ├── stickers/{id}:     { owned, count, forTrade, scannedAt }
  ├── cc_stickers/{id}:  { owned, count, forTrade }
  ├── extra_stickers/{id}: { owned, count }
  ├── cards/{id}: { owned, count, forTrade, codeRedeemed, scannedAt }
  ├── friends/[userId]: { addedAt }
  └── dream_teams/{id}: { name, formation, players[], createdAt }

trades/{tradeId}
  ├── offeredBy, offeredItems, wantedItems
  ├── status: "open"|"matched"|"completed"|"cancelled"
  ├── location: GeoPoint
  └── createdAt: timestamp

bracket_predictions/{userId}
  ├── groups: { A: { winner, runnerUp }, ... }
  ├── r16, qf, sf, final: [predictions]
  └── updatedAt: timestamp
```

---

## Monetization

| Feature | Free | Premium (€1.99/mo.) |
|---|---|---|
| AI Scanner | 20/day | Unlimited |
| Album Page Scanner | 3/day | Unlimited |
| Sticker + CC + Extra Album | ✅ | ✅ |
| Adrenalyn XL Album | ✅ | ✅ |
| Completion Calculator | Basic | Full + PDF |
| Trading Exchange | 5 listings | Unlimited |
| Priority Matching | ❌ | ✅ |
| Dream Team Builder | 1 team | Unlimited |
| WM Bracket Predictor | ✅ | ✅ |
| Market Value Tracker | Top 10 | All rare items |
| Friends / Groups | 5 friends | Unlimited |
| Ads (AdMob) | ✅ | ❌ |

---

## Reference Files

| File | Content |
|---|---|
| `sticker_db_wc2026.json` | Complete sticker DB v3.0: 980 + CC1-CC12 + Extra1-20 |
| `StickerScout2026_AppStore_Texte.md` | Store texts DE+EN, Apple + Google Play |

*NCN-NetConsulting GmbH | StickerScout 2026 | Version 2.0 | Juni 2026*

---
---

# 📱 NAVIGATION & SCREEN-FLOW

## Bottom Navigation (5 Tabs)

```
[📷 Scan]  [📚 Album]  [🔄 Tausch]  [📅 Spiele]  [👤 Profil]
```

## Screen-Flow nach dem Scan

### Sticker gescannt → Scan-Bestätigung
```
📷 Scanner erkennt: "AUT20"
         ↓
┌──────────────────────────────────┐
│  ✅ SCAN-BESTÄTIGUNG             │
│  Marko Arnautović · AUT20        │
│  Österreich · Gruppe J           │
│  Typ: Player · nicht FOIL        │
│  WM-Stats (live via Claude API)  │
│  Marktwert: ~€0,60               │
│                                  │
│  ● NEU hinzugefügt               │
│  [Album ansehen]    [Weiter]     │
│                                  │
│  — bei Doppeltem —               │
│  ● Bereits vorhanden (2×)        │
│  [Tauschbörse]      [Behalten]  │
└──────────────────────────────────┘
         ↓ "Album ansehen"
ALBUM → Tab A → Gruppe J → AUT
→ AUT20 jetzt ✅ markiert
```

### Adrenalyn XL Karte gescannt
```
📷 Scanner (Adrenalyn XL Modus) erkennt: Golden Baller
         ↓
┌──────────────────────────────────┐
│  ⭐ GOLDEN BALLER · #GL4         │
│  Josko Gvardiol · Kroatien       │
│  Seltenheit: Ultra Rare           │
│  Marktwert: ~€12,50              │
│  Online-Code: ABC123 [Kopieren]  │
│                                  │
│  [Karte ansehen]    [Weiter]     │
└──────────────────────────────────┘
         ↓ "Karte ansehen"
ALBUM → Tab B → Golden Baller
→ GL4 Gvardiol jetzt ✅ (1/9 Golden Baller)
```

## Album — interne Struktur

### Tab A: Sticker (1.012 gesamt)
```
ALBUM TAB A
├── Alle Teams (nach Gruppen A–L sortiert)
│   ├── Gruppe A: MEX · RSA · KOR · CZE
│   │   └── [Team-Karte] z.B. AUT: ██████████████████░ 19/20
│   └── ...
├── 🥤 Coca-Cola Special (CC1–CC12)
│   └── 12er Grid — Doppelseite im Album
└── ⭐ Extra Sticker (EXTRA1–EXTRA20)
    └── 20er Grid — extrem selten, 1:100 Tüten

Filter-Leiste: [Alle] [Vorhanden] [Fehlend] [Doppelt] [FOIL]
```

### Tab B: Adrenalyn XL (630 gesamt)
```
ALBUM TAB B
├── Base Cards (417)
│   ├── Heroes (nach Team sortiert)
│   ├── Contenders (Playoff-Teams)
│   └── Mascots (3 Karten)
├── Special Cards (213)
│   ├── Fan Favourites · Icons · Team Logos
│   ├── Top Keepers · Defensive Rocks
│   ├── Midfield Maestros · Goal Machines
│   ├── Master Rookies (16)
│   ├── ⭐ Golden Baller (9) — hervorgehoben
│   └── 🏆 Eternos 22 (22) — hervorgehoben
└── Limited Editions (nicht in Basis-630)
    └── aus Tins / Premium Packs / Special Box

Filter-Leiste: [Alle] [Base] [Special] [Limited] [Ultra Rare]
```

### Karten-Detail (Tap auf Karte)
```
┌──────────────────────────────────┐
│  ⭐ GOLDEN BALLER                │
│  [Karten-Bild]                   │
│  Josko Gvardiol · Kroatien       │
│  Nummer: GL4 · Kategorie: Golden │
│  Seltenheit: Ultra Rare ★★★★★   │
│  Marktwert: €12,50 (live eBay)   │
│  Online-Code: ABC123             │
│  [Code kopieren] [Einlösen →]    │
│  Status: ✅ Vorhanden (1×)       │
│  [Zum Tauschen anbieten]         │
└──────────────────────────────────┘
```

## Profil-Screen
```
👤 PROFIL
├── Sammel-Fortschritt gesamt
│   ├── Sticker: 712/980 (72,7%)
│   ├── CC-Seite: 8/12 (66,7%)
│   ├── Extra: 1/20 (5%)
│   └── Adrenalyn XL: 287/630 (45,6%)
├── Completion Calculator
│   └── "Noch ~43 Tüten bis Album-Fertig (€25,80)"
├── Tausch-Historie
├── Premium-Status
└── Einstellungen (Sprache, Notifications)
```

---
---

# 🤖 AI-ERWEITERUNGEN & FEATURE-ROADMAP

---

## AI-Features nach Version

### v1.0 — Launch 11. Juni 2026 (Basis-AI)

Diese Features basieren auf der Claude API und Google ML Kit und sind ohne zusätzliche ML-Infrastruktur umsetzbar.

#### Claude Chatbot (In-App Assistent)
Powered by Claude API (`claude-sonnet-4-20250514`). Der Assistent kennt die vollständige Sammlung des Users, die Tauschbörse und den Spielplan.

**System Prompt für den In-App Assistenten:**
```
Du bist StickerScout, der persönliche Sammel-Assistent für die
FIFA WM 2026 Sticker- und Adrenalyn XL Kollektion.
Du kennst die aktuelle Sammlung des Users (wird als Kontext übergeben).
Du hilfst bei: Tauschstrategie, Completion-Planung, Spieler-Info,
WM-Spielplan, Pack-Kaufberatung. Antworte kurz und konkret.
Sprache: Deutsch (oder Englisch, je nach User-Einstellung).
```

**Beispiel-Interaktionen:**
```
User: "Was fehlt mir noch für Gruppe J?"
KI:   "Dir fehlen 7 Sticker in Gruppe J: AUT3, AUT16, ARG14,
       ALG8, ALG19, JOR5, JOR12. Österreich ist dein
       vollständigstes Team mit 19/20."

User: "Soll ich jetzt Packs kaufen oder tauschen?"
KI:   "6 deiner fehlenden Sticker werden gerade auf der
       Tauschbörse angeboten. Tausch zuerst — das spart dir
       schätzungsweise €8 gegenüber Packs kaufen."

User: "Wer ist Lamine Yamal?"
KI:   "Lamine Yamal, 17, FC Barcelona / Spanien. WM 2026:
       3 Spiele, 4 Tore, 3 Assists — aktuell Topscorer
       Gruppe H. Dein Sticker: ESP15 (Standard, nicht FOIL).
       Marktwert aktuell ~€4,20 (↑ nach Hattrick)."
```

**Implementation:**
```javascript
// In-App Claude API Call
async function askAssistant(userMessage, userCollection) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `Du bist StickerScout. Sammlung des Users:
        Sticker: ${userCollection.stickers.owned}/980
        Fehlende: ${userCollection.stickers.missing.slice(0,20).join(', ')}...
        Adrenalyn XL: ${userCollection.cards.owned}/630`,
      messages: [{ role: "user", content: userMessage }]
    })
  });
  const data = await response.json();
  return data.content[0].text;
}
```

#### Live Spieler-Infokarten
Beim Scannen eines Stickers erscheint eine KI-generierte Mini-Infokarte mit Live-Daten.

```javascript
async function getPlayerInfo(stickerId, playerName, team) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Erstelle eine kompakte Spieler-Infokarte für ${playerName} (${team})
                  zur FIFA WM 2026. Format: Verein, Alter, WM-Stats, aktueller Status.
                  Max 4 Zeilen. Deutsch.`
      }]
    })
  });
  const data = await response.json();
  return data.content.filter(b => b.type === "text").map(b => b.text).join("");
}
```

#### Pack-Kaufberatung KI
```javascript
async function getPackAdvice(collection, budget) {
  // Sends current missing stickers + budget to Claude
  // Returns: optimal pack type + expected completion boost
}
```

---

### v1.1 — Ende Juni 2026 (Während Gruppenphase)

#### Promo-Code-Scanner
- ML Kit Barcode Scanner erkennt QR-Codes auf Adrenalyn XL Packs
- OCR liest alphanumerische Codes auf Coca-Cola Flaschen
- Datenbank der eingelösten vs. verfügbaren Codes pro User
- Deep-Link zur offiziellen Panini Adrenalyn XL App zum Einlösen

#### WM Performance → Sammlerwert Live-Tracker
```javascript
// Firebase Function — läuft nach jedem WM-Spiel
async function updateCardValues(matchResult) {
  const { scorers, assisters, tournamentMoment } = matchResult;

  // Claude analysiert Auswirkung auf Kartenwert
  const analysis = await askClaude(`
    WM-Ergebnis: ${matchResult.summary}
    Torschützen: ${scorers.join(', ')}
    Welche Panini-Sticker / Adrenalyn XL Karten
    steigen dadurch im Sammlerwert? Gib Prozentschätzungen.
  `);

  // Push Notification an betroffene User
  await sendValueAlerts(analysis);
}
```

Beispiel-Push: *"🔥 Arnautović (AUT20) nach Tor gegen Argentinien: Marktwert ↑ ~35%"*

#### Kettenmatching Tauschbörse
KI findet Tauschketten über 3–4 Sammler:
```
A hat: MEX5 doppelt    → braucht: AUT20
B hat: AUT20 doppelt   → braucht: ENG11
C hat: ENG11 doppelt   → braucht: MEX5
→ KI initiiert 3-Wege-Tausch, alle gewinnen
```

#### Freunde & Gruppen + AI-Gruppen-Challenge
- KI generiert wöchentliche Gruppen-Challenges: *"Wer sammelt diese Woche die meisten Gruppe-J-Sticker?"*
- Automatische Tausch-Empfehlungen innerhalb der Freundesgruppe

---

### v1.2 — Mitte Juli 2026 (K.o.-Phase)

#### Album-Seiten-Scanner (ML Kit Document Scanner)
- Ganze Album-Seite fotografieren → alle Sticker werden erkannt
- ML Kit Document Scanner + Custom OCR-Pipeline
- Erkennung auch bei schräger Kamera, schlechtem Licht
- Batch-Eintragung aller erkannten Sticker mit einem Tap

#### AI Spielcoach für Adrenalyn XL
```
User scannt 87 Karten
KI:  "Dein stärkstes Team (4-3-3):
      TW: Courtois (BEL) ★★★★★
      ABW: Van Dijk (NED-Golden Baller) ★★★★★
      ...
      Schwachstelle: Mittelfeld. Kimmich (GER2) oder
      Ødegaard (NOR10) würden dein Team um ~15% stärken.
      Beide werden gerade auf der Tauschbörse angeboten."
```

#### Bracket Predictor mit AI-Odds
- KI analysiert Turnierverlauf und berechnet Gewinnwahrscheinlichkeiten
- User-Prognosen werden mit AI-Prognose verglichen
- Live-Updates nach jedem Spiel

---

### v2.0 — August 2026 (Post-WM / Nächste Saison)

#### Visuelle Sticker-Erkennung (Custom ML Model)
Statt nur OCR: Erkennung des Stickers anhand des **Spieler-Fotos**.
- Custom TensorFlow Lite Modell, trainiert auf allen 1.012 Sticker-Bildern
- Funktioniert auch ohne sichtbare Nummer (beschädigt, abgeklebt)
- Erkennt automatisch: Standard / FOIL / Parallel-Variante / Condition (Mint/Good/Fair)
- On-Device Inference (kein Server nötig, offline-fähig)

**Training-Daten:** Panini-Sticker-Bilder von:
- Offizielle Panini-Produktfotos
- Community-Uploads (mit User-Consent)
- Synthetische Augmentierung (Rotation, Beleuchtung, Perspektive)

#### Album Video-Scan
- User blättert physisches Album durch (Video, 30 Sek.)
- KI erkennt automatisch alle Sticker auf jeder Seite
- Vollständiger Sammlungsimport in unter einer Minute
- Vergleich mit vorheriger Aufnahme → automatische Delta-Erkennung

#### Multi-Kollektion Plattform
Nach WM-Ende: StickerScout wird zur generischen Sammel-Plattform
- Bundesliga Österreich Sticker 2026/27
- Adrenalyn XL FIFA 365 2027
- Andere Panini-Kollektionen on demand
- Gleiche KI-Infrastruktur, neue Datenbanken

---

## Vollständige Feature-Roadmap

```
JUNI 2026
│
├─ 01. Juni   ████ Entwicklung v1.0
├─ 11. Juni   🚀 LAUNCH v1.0
│              • KI-Scanner (3 Modi: Sticker/CC/Adrenalyn XL)
│              • Album (980 + 12 CC + 20 Extra + 630 Cards)
│              • Tauschbörse (Basic Matching)
│              • Spielplan (alle 104 Spiele)
│              • Completion Calculator
│              • Claude Chatbot (In-App Assistent)
│              • Live Spieler-Infokarten
│              • Pack-Kaufberatung KI
│
├─ 14. Juni   Gruppenphase beginnt
│
├─ 26. Juni   🔄 UPDATE v1.1
│              • Promo-Code-Scanner (Adrenalyn XL + Coca-Cola)
│              • Performance → Sammlerwert Live-Tracker
│              • Kettenmatching Tauschbörse (3-Wege-Tausch)
│              • Freunde & Gruppen + AI-Challenge
│              • WM Bracket Predictor
│              • Dream Team Builder
│              • Panini Nachbestellservice Deep-Link
│
JULI 2026
│
├─ 04. Juli   K.o.-Runden beginnen
│
├─ 10. Juli   🔄 UPDATE v1.2
│              • Album-Seiten-Scanner (ganze Seite = 1 Scan)
│              • AI Spielcoach Adrenalyn XL
│              • Bracket Predictor mit AI-Odds
│              • Marktwert-Tracker (alle seltenen Items)
│              • Parallels & Varianten-Tracking (US-Edition)
│
├─ 19. Juli   🏆 WM-FINALE (MetLife Stadium, New Jersey)
│
AUGUST 2026
│
├─ August     🔄 v2.0 Entwicklung
│              • Visuelles ML-Modell (Spielerfoto-Erkennung)
│              • Album Video-Scan (30 Sek. → vollständiger Import)
│              • Multi-Kollektion Plattform
│              • Bundesliga Österreich 2026/27 Vorbereitung
│
SEPTEMBER 2026
│
└─ September  🚀 v2.0 LAUNCH — Multi-Kollektion Plattform
```

---

## AI-Stack Übersicht

| Layer | Technologie | Einsatz |
|---|---|---|
| **Language AI** | Claude API (Sonnet 4) | Chatbot, Spieler-Info, Kaufberatung, Spielcoach |
| **OCR** | Google ML Kit Text Recognition v2 | Stickernummer, Promo-Codes |
| **Image** | Google ML Kit Image Labeling | Foil-Erkennung, Condition |
| **Document** | ML Kit Document Scanner | Album-Seiten-Scanner (v1.2) |
| **Barcode** | ML Kit Barcode Scanning | QR-Code Promo-Codes |
| **Custom ML** | TensorFlow Lite (on-device) | Visuelles Spieler-Modell (v2.0) |
| **Data** | Firebase + Web Search | Live WM-Stats, Marktwerte |

---

## Referenz-Dateien

| Datei | Inhalt |
|---|---|
| `sticker_db_wc2026.json` | Sticker-DB v3.0: 980 + CC1-12 + Extra1-20 |
| `StickerScout2026_AppStore_Texte.md` | Store-Texte DE+EN |

*NCN-NetConsulting GmbH | StickerScout 2026 | Claude Code Prompt v3.0 | Juni 2026*
