# Dodavanje sadržaja

Mapa crta samo pinove iz `src/features/map/data/map-pins.json`. Klik na pin sa `"pinStyle": "model"` otvara isti 3D model zgrade. Fotografije i podaci o stanu ili kući su poseban katalog i vežu se na pin preko istog `id`.

## Pin na mapi

Otvori `src/features/map/data/map-pins.json` i dodaj objekat na kraj niza. `src/features/map/data/locations.ts` učitava taj fajl kao `MAP_PINS`. Mapa u `interactive-map.tsx` crta samo tu listu.

Obavezna polja: `id`, `name`, `category`, `description`, `latitude`, `longitude`. `id` mora biti jedinstven unutar fajla. Koordinate su decimalni stepeni (Podgorica je oko `42.44`, `19.26`).

Dva tipa pina:

| `pinStyle` | Šta se dešava poslije leta kamere |
| --- | --- |
| `"plain"` | Pojavi se naziv i linija. Nema ulaska u zgradu. |
| `"model"` | Poslije slijetanja otvara se 3D model. Naslov overlay-a je `name` pina. |

Primjer običnog pina:

```json
{
  "id": "trg-nezavisnosti",
  "name": "Trg nezavisnosti",
  "category": "Lokacija",
  "description": "Kratak opis koji ide u karticu.",
  "latitude": 42.441,
  "longitude": 19.26,
  "address": "Ulica, Podgorica",
  "pinStyle": "plain"
}
```

Primjer pina koji otvara zgradu:

```json
{
  "id": "zgrada-centar",
  "name": "Zgrada u centru",
  "category": "Zgrada",
  "description": "Kratak opis koji ide u karticu.",
  "latitude": 42.442,
  "longitude": 19.261,
  "address": "Ulica, Podgorica",
  "pinStyle": "model"
}
```

Opciono, na bilo koji pin:

- `address` — adresa u kartici
- `imageUrl` — slika u kartici. Putanja iz `public/` (`"/properties/slika.png"`) ili pun `http(s)` URL
- `imageCredit` — `{ author, authorUrl, license, licenseUrl }` kad je slika tuđa
- `tags` — niz stringova
- `metadata` — parovi ključ/vrijednost (`string`, broj ili `true`/`false`). Kartica ih ispisuje ispod opisa
- `altitude` — visina markera
- `viewRange` i `viewTilt` — udaljenost i nagib kamere umjesto bliskog pogleda

Validacija je u `src/features/map/utils/map-validation.ts`. Loš JSON (dupli `id`, prazan naziv, koordinata van opsega) ruši učitavanje mape.

Test `src/features/map/utils/map-validation.test.ts` trenutno očekuje tačno tri `"plain"` i tri `"model"` pina. Poslije dodavanja pina ažuriraj te brojeve, pa pokreni `npm test`.

`locations.ts` (landmarki, vile) i `children-venues.json` (rezerva za žive OSM lokacije) se ne crtaju kao ovi pinovi. Novi pin ide u `map-pins.json`.

## 3D zgrada

Svi `"model"` pinovi otvaraju jedan isti model. Pin bira mjesto na mapi i naslov. Geometrija se ne mijenja po pinu.

| Šta mijenjaš | Fajl |
| --- | --- |
| Nazivi spratova i tekst na hoveru | `src/features/scene/data/house-hotspots.ts` |
| Oblik zgrade, sobe, materijali | `createBuilding()` i `createStory()` u `src/features/scene/components/example-scene.tsx` |
| Visina sprata i dubina fasade | `FLOOR_HEIGHT` i `FACADE_Z` u `house-hotspots.ts` |

Spratovi su fiksna tri: `ground`, `first`, `second` (`level` 0, 1, 2). `position` u hotspotu je tačka na fasadi na koju kamera ide. Ako pomjeriš vrata ili balkon, pomjeri i tu tačku.

Tekst sprata:

```ts
{
  id: "ground",
  level: 0,
  title: "Prizemlje",
  detail: "Kamera prolazi kroz otvorena vrata u stan.",
  position: [0, 0.78, 1.58],
}
```

`id` mora ostati `"ground" | "first" | "second"`. Petlja u `createBuilding()` pravi tri sprata i veže ih redom na `FLOOR_HOTSPOTS[level]`. Novi sprat traži i novi `level` u tipu, i novi prolaz u toj petlji.

Isti model se vidi i na ruti `/scene`.

## Fotografije i podaci o stanu ili kući

Galerija je u `src/features/property-gallery/data/properties.ts`. Kartica na mapi je otvara preko `getPropertyByLocationId`. Veza je `property.locationId` jednak `id` pina.

Za pin `zgrada-centar` unos izgleda ovako:

```ts
{
  id: "zgrada-centar",
  locationId: "zgrada-centar",
  title: "Zgrada u centru",
  location: "Ulica, Podgorica",
  details: {
    price: "€180,000",
    area: "72 m²",
    bedrooms: 2,
    bathrooms: 1,
  },
  images: [
    {
      id: "zgrada-centar-dnevna",
      src: "/properties/zgrada-centar-dnevna.png",
      alt: "Dnevna soba",
      roomLabel: "Dnevna soba",
    },
  ],
}
```

Slike stavi u `3D mape/public/properties/`. `src` je putanja od korijena sajta, sa početnim `/`.

- `details` je opciono. Ako ga ima, sva četiri polja su obavezna: `price`, `area`, `bedrooms`, `bathrooms`.
- `roomLabel` je opciono; to je natpis na slici.
- `panoramaUrl` ostavi prazan dok ne postoji pravi panorama URL. Bez njega panorama režim ostaje zatvoren.

Ako za taj `id` nema unosa u `properties.ts`, galerija pada na jednu sliku iz `imageUrl` pina. Bez `imageUrl` galerija je prazna.

Trenutni unosi (`vila-moraca`, `stan-preko-morace`, `kuca-stara-varos`) nisu povezani sa pinovima (`zgrada-moraca`, `zgrada-preko`, `zgrada-varos`) jer se `id` ne poklapa. Da bi se galerija otvorila sa pina, `locationId` mora biti isti string kao `id` u `map-pins.json`.
