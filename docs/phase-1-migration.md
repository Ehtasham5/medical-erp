# Phase 1 migration procedure

Fresh environments run `pnpm exec prisma migrate deploy`; CI applies the full
migration history to a clean PostgreSQL database.

Existing environments created with `prisma db push` must first baseline their
current schema, then deploy Phase 1:

```bash
pnpm exec prisma migrate resolve --applied 20261008000000_initial_schema
pnpm exec prisma migrate deploy
```

The Phase 1 migration creates a default `MAIN` branch, rounds legacy floating
point money values to two decimal places, makes duplicate legacy batches unique
without deleting records, and records each existing stock count as an opening
inventory balance.
