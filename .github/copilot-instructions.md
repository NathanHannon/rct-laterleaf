## LaterLeaf AI Contributor Guide

Purpose: Give AI agents the minimum, project-specific context (NOT generic advice) to make safe, productive changes across the monorepo (frontend `rct-laterleaf` + backend `lb-laterleaf`). Keep changes consistent with existing patterns below.

### 1. Big Picture
- Frontend: React + Vite + TypeScript (`rct-laterleaf/src/**`). Pure SPA; authentication handled client-side with Clerk (`@clerk/clerk-react`). Styling: SCSS co-located with components. State patterns: context + custom hooks (see `context/searchContext.tsx`, `hooks/searchHook.tsx`).
- Backend: LoopBack 4 (`lb-laterleaf/src/**`). Layers: models → repositories → controllers. Authentication via custom Clerk strategy + LoopBack auth + optional JWT component. Data source: PostgreSQL (`LaterleafDataSource`). REST endpoints use standard LB4 decorators.
- Core domain: Users save/import Articles; Articles linked to Users through `UserArticle` (junction storing per‑user status: favorite/archive/progress/summary). Tagging: `UserTag` (belongsTo User) and many‑to‑many between `UserArticle` and `UserTag` via `UserArticleTag`.
- Content import: `/articles/import` fetches external URL, parses with `jsdom` + `@mozilla/readability`, stores canonical Article if new, then links user.

### 2. Conventions & Patterns
- Table/model naming: Explicit `@model({name: 'snake_case_table'})`; columns mapped with `postgresql.columnName` for snake_case; TS properties stay camelCase.
- Relations:
	- `@belongsTo(() => User, {keyFrom: 'userId'}, {name: 'user_id'})` pattern for FK columns.
	- Many-to-many (User ↔ Article): `@hasMany(() => Article, { through: { model: () => UserArticle, keyFrom: 'userId', keyTo: 'articleId'}})`. Tagging (UserArticle ↔ UserTag) uses `@hasMany` with `through` (`UserArticleTag`).
	- Foreign key mismatch errors (e.g. “missing definition of foreign key …”): ensure target model actually defines the FK property with the same name you reference in `keyTo` and that repository factory is registered.
- Controllers exported via `src/controllers/index.ts`; add new controllers there so Booter picks them up.
- Mutating user/article status: toggle endpoints (`/articles/{id}/archive`, `/articles/{id}/favorite`) update only the junction (`UserArticle`) not the canonical `Article`.
- Do NOT delete articles globally when a user removes one—only remove the junction row (see `deleteById` in `article.controller.ts`).

### 3. Backend Workflows
- Build (watch): `npm run build:watch` (task: “Watch and Compile Project”). Single build: `npm run build`; clean + rebuild: `npm run rebuild`.
- Run API: `npm start` (builds then runs) or `node .` (assumes built `dist`).
- DB migrations: `npm run migrate` after adding/changing models/relations (ensure `@model` + FKs added first).
- OpenAPI spec: `npm run openapi-spec` writes spec from decorators.
- Tests: `npm run test` (full) or `npm run test:dev` for pattern-based (dist) execution.

### 4. Frontend Workflows
- Dev server: `npm run dev` (Vite). Build: `npm run build` (TS project refs + Vite). Lint: `npm run lint`. Preview: `npm run preview`.
- Component structure: Each feature under `components/<Domain>/<ComponentName>/` with the component file named `ComponentName.tsx` and its stylesheet named `ComponentName.scss`.

### 5. Adding a New Many-to-Many Relation (Example Template)
1. Create junction model with its own id + the two FK columns (with `postgresql.columnName`).
2. In each participating model, add `@hasMany(... { through: { model: () => Junction, keyFrom: 'thisModelId', keyTo: 'otherModelId'}})`.
3. Create repository for junction if custom logic needed; otherwise ensure factory registration in the owning repository (see `UserArticleRepository`).
4. Expose endpoints via new controller; export from `controllers/index.ts`.
5. Run `npm run migrate`.

### 6. Safe Change Checklist for AI
- Touching relations? Verify FK property exists in target model and naming matches `keyTo` / `keyFrom`.
- Adding model? Provide `@model({name})`, all `@property` mappings, then rebuild + migrate.
- New endpoint? Use existing pattern: auth decorator (`@authenticate('clerk')` if needed), schema decorators for request/response, use repositories not raw SQL.
- Frontend consuming backend? Follow existing fetch/data shape pattern used in article listing (status fields derived from junction, not base model).

### 7. Common Pitfall Example
Error: “Invalid hasMany definition … missing definition of foreign key X” → Usually the FK property is absent or misnamed (e.g. `usersId` vs `userId`). Fix by adding the `@property` or correcting `keyTo`.

### 8. When Unsure
Prefer reading existing analogous file (e.g., `user-article.model.ts` for junction patterns) and mirror style exactly; keep modifications minimal & explicit.

End of file.
