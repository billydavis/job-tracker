# backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## Database (MongoDB)

There are no SQL-style migrations: collections are created when the app first writes documents.

**Environment (optional):**

- `MONGO_URI` — default `mongodb://localhost:27017`
- `MONGO_DB` — default `job-tracker`

**Recreate an empty dev database from scratch**

1. Start MongoDB locally (or use your Atlas URI in `MONGO_URI`).
2. Optional — wipe only the dev database (destructive). In `mongosh`:

   ```javascript
   use job-tracker
   db.dropDatabase()
   ```

3. Start the API (`bun run index.ts`) and the frontend (`bun run dev` in `frontend/`), open the app, and **Register** a new account (creates the `users` document and sets the auth cookie).
4. Optional — load sample companies and jobs for the **first user** in the DB:

   ```bash
   bun run seed
   ```

**Tests** use the database **`job-tracker-test` only** (`test/setup.ts`, plus `bunfig.toml` preload so **`bun test`** and **Vitest** both isolate). Your dev data lives in **`job-tracker`** and is not touched when that works correctly.

If you use **`TEST_USE_CUSTOM_MONGO_DB=1`**, never point `MONGO_DB` at `job-tracker` (tests will refuse).

This project was created using `bun init` in bun v1.3.10. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
