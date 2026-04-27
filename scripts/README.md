# Scripts

## seed-catalog.ts

Pobla `CatalogCard` con cartas reales desde APIs públicas gratuitas.

**Fuentes:**
- Pokémon: [PokéTCG API](https://pokemontcg.io) — ~2,750 cartas de 11 sets
- Yu-Gi-Oh!: [YGOProDeck API](https://ygoprodeck.com/api-guide) — ~800 cartas de 10 arquetipos
- One Piece: 13 cartas de muestra (API oficial no pública aún)

**Uso:**

```bash
# Desde la raíz del monorepo
export MONGODB_URI=mongodb://localhost:27017/tradeup
bun scripts/seed-catalog.ts
```

O si tienes el `.env` de la API:
```bash
# Windows PowerShell
$env:MONGODB_URI = "mongodb://localhost:27017/tradeup"
bun scripts/seed-catalog.ts
```

**Tiempo estimado:** 2-4 minutos (rate limiting gentil de 300ms entre sets).

**Notas:**
- El script no borra cartas existentes, solo agrega.
- Los duplicados se ignoran automáticamente.
- Para agregar más sets de Pokémon, agrega el `setId` al array `POKEMON_SETS` en el script.
  Los IDs de sets los encuentras en: https://api.pokemontcg.io/v2/sets
