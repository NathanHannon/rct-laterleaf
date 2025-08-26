## LaterLeaf AI Contributor Guide

Purpose: Give AI ageError: "Invalid hasMany definition … missing definition of foreign key X" → Usually the FK property is absent or misnamed (e.g. `usersId` vs `userId`). Fix by adding the `@property` or correcting `keyTo`.

### 10. When Unsure the minimum, project-specific context (NOT generic advice) to make safe, productive changes across the monorepo (frontend `rct-laterleaf` + backend `lb-laterleaf`). Keep changes consistent with existing patterns below.

### 1. Big Picture
- Frontend: React + Vite + TypeScript (`rct-laterleaf/src/**`). Pure SPA; authentication handled client-side with Clerk (`@clerk/clerk-react`). Styling: SCSS co-located with components. State patterns: context + custom hooks (see `context/searchContext.tsx`, `hooks/searchHook.tsx`).
- Backend: LoopBack 4 (`lb-laterleaf/src/**`). Layers: models → repositories → controllers. Authentication via custom Clerk strategy + LoopBack auth + optional JWT component. Data source: PostgreSQL (`LaterleafDataSource`). REST endpoints use standard LB4 decorators.
- Core domain: Users save/import Articles; Articles linked to Users through `UserArticle` (junction storing per‑user status: favorite/archive/progress/summary). Tagging: `UserTag` (belongsTo User) and many‑to‑many between `UserArticle` and `UserTag` via `UserArticleTag`.
- Content import: `/articles/import` fetches external URL, parses with `jsdom` + `@mozilla/readability`, stores canonical Article if new, then links user.

### 2. Authentication & Theme System (Critical Patterns)
- **Frontend Provider Hierarchy:** `main.tsx` shows required nesting: `ClerkProvider` → `UserStatusProvider` → `ThemeProvider` → `App`
- **Theme Variables:** CSS variables in `src/styles/theme.scss` use `[data-theme='light|dark']` selectors. Theme set via `document.documentElement.setAttribute('data-theme', theme)`. App applies theme class: `<div className={\`app ${theme}\`}>`.
- **Routing Logic:** Authenticated (`<SignedIn>`) vs unauthenticated (`<SignedOut>`) users see different route trees. Static pages (About, Contact, FAQ, Privacy) accessible to both. Hero page with `<FallingLeaves />` animation only for logged-out users.
- **Clerk Integration:** Custom `ClerkStrategy` in backend validates JWT tokens from `Authorization: Bearer <token>` headers. Controllers use `@authenticate('clerk')` decorator.

### 3. Conventions & Patterns
- Table/model naming: Explicit `@model({name: 'snake_case_table'})`; columns mapped with `postgresql.columnName` for snake_case; TS properties stay camelCase.
- Relations:
	- `@belongsTo(() => User, {keyFrom: 'userId'}, {name: 'user_id'})` pattern for FK columns.
	- Many-to-many (User ↔ Article): `@hasMany(() => Article, { through: { model: () => UserArticle, keyFrom: 'userId', keyTo: 'articleId'}})`. Tagging (UserArticle ↔ UserTag) uses `@hasMany` with `through` (`UserArticleTag`).
	- Foreign key mismatch errors (e.g. “missing definition of foreign key …”): ensure target model actually defines the FK property with the same name you reference in `keyTo` and that repository factory is registered.
- Controllers exported via `src/controllers/index.ts`; add new controllers there so Booter picks them up.
- Mutating user/article status: toggle endpoints (`/articles/{id}/archive`, `/articles/{id}/favorite`) update only the junction (`UserArticle`) not the canonical `Article`.
- Do NOT delete articles globally when a user removes one—only remove the junction row (see `deleteById` in `article.controller.ts`).

### 4. Component & Styling Architecture
- **Component Structure:** `components/<Domain>/<ComponentName>/` with `ComponentName.tsx` + `ComponentName.scss` co-located.
- **CSS Variable Consistency:** Never define theme colors in component CSS or `App.scss` - only in `theme.scss`. Use `var(--card-bg)`, `var(--text-color-secondary)`, etc. across all components.
- **Animation Patterns:** Use `motion` (Framer Motion) for component animations. See `CollectionsList.tsx` for list animation patterns, `ArticleCard.tsx` for hover effects.

### 5. Backend Workflows
- Build (watch): `npm run build:watch` (task: “Watch and Compile Project”). Single build: `npm run build`; clean + rebuild: `npm run rebuild`.
- Run API: `npm start` (builds then runs) or `node .` (assumes built `dist`).
- DB migrations: `npm run migrate` after adding/changing models/relations (ensure `@model` + FKs added first).
- OpenAPI spec: `npm run openapi-spec` writes spec from decorators.
- Tests: `npm run test` (full) or `npm run test:dev` for pattern-based (dist) execution.

### 6. Frontend Workflows
- Dev server: `npm run dev` (Vite). Build: `npm run build` (TS project refs + Vite). Lint: `npm run lint`. Preview: `npm run preview`.
- Component structure: Each feature under `components/<Domain>/<ComponentName>/` with the component file named `ComponentName.tsx` and its stylesheet named `ComponentName.scss`.

### 7. Adding a New Many-to-Many Relation (Example Template)
1. Create junction model with its own id + the two FK columns (with `postgresql.columnName`).
2. In each participating model, add `@hasMany(... { through: { model: () => Junction, keyFrom: 'thisModelId', keyTo: 'otherModelId'}})`.
3. Create repository for junction if custom logic needed; otherwise ensure factory registration in the owning repository (see `UserArticleRepository`).
4. Expose endpoints via new controller; export from `controllers/index.ts`.
5. Run `npm run migrate`.

### 8. Safe Change Checklist for AI
- Touching relations? Verify FK property exists in target model and naming matches `keyTo` / `keyFrom`.
- Adding model? Provide `@model({name})`, all `@property` mappings, then rebuild + migrate.
- New endpoint? Use existing pattern: auth decorator (`@authenticate('clerk')` if needed), schema decorators for request/response, use repositories not raw SQL.
- Frontend consuming backend? Follow existing fetch/data shape pattern used in article listing (status fields derived from junction, not base model).
- Adding theme styles? Only define color variables in `theme.scss`, never in component stylesheets.

### 9. Common Pitfall Example
Error: “Invalid hasMany definition … missing definition of foreign key X” → Usually the FK property is absent or misnamed (e.g. `usersId` vs `userId`). Fix by adding the `@property` or correcting `keyTo`.

### 8. When Unsure
Prefer reading existing analogous file (e.g., `user-article.model.ts` for junction patterns) and mirror style exactly; keep modifications minimal & explicit.

## LaterLeaf Design System & Brand Guidelines

Purpose: This guide provides strict instructions for styling all new and existing React components for the LaterLeaf application. Adhere to these rules to ensure a consistent, professional, and on-brand user experience.

### 1. Color Palette

Use these exact HEX codes. Do not introduce new colors. The palette is designed to be calming, professional, and focused.

* [cite_start]**Primary Green (for primary CTAs, active states, important icons):** `#22c55e` [cite: 128]
* [cite_start]**Dark Teal (for backgrounds, primary text):** `#0f766e` [cite: 131]
* [cite_start]**Neutral Gray (for secondary text, borders, disabled states):** `#4b5563` [cite: 134]
* [cite_start]**Background White (for main content areas, cards):** `#f9fafb` [cite: 137]
* [cite_start]**Accent Yellow (for highlights, notifications, warnings):** `#facc15` [cite: 140]

**Implementation (SCSS):**
When writing SCSS, use the existing CSS variables defined in the project (e.g., `var(--primary-color)`). If a variable does not exist for one of these colors, please create it.

### 2. Typography

All text **must** use the "Inter" font family.

* **Headings (`<h1>`, `<h2>`, `<h3>`):**
    * [cite_start]**Font:** Inter [cite: 144]
    * [cite_start]**Weight:** Bold (700) or Extra Bold (800) [cite: 144]
    * [cite_start]**Purpose:** Strong, clear, and professional titles. [cite: 146]

* **Body Text (`<p>`, `<span>`, lists, etc.):**
    * [cite_start]**Font:** Inter [cite: 147]
    * [cite_start]**Weight:** Regular (400) [cite: 147]
    * [cite_start]**Purpose:** Ensure maximum readability for articles and UI text. [cite: 148]

### 3. Core Principles (The "Vibe")

When generating components or styles, ensure the final result feels:

1.  **Intelligent & Trustworthy:** Use clean lines, professional colors, and clear typography. [cite_start]The UI should feel solid and reliable. [cite: 151]
2.  **Calm & Focused:** The design must be minimalist. Avoid clutter. [cite_start]Prioritize white space to create a serene, distraction-free environment for reading and learning. [cite: 153, 154]
3.  [cite_start]**Modern & Organic:** Balance modern UI patterns (like clean cards and subtle animations) with the natural feel of the "Circuit Leaf" logo and the green/teal color palette. [cite: 156]

### 4. Component-Specific Rules

* **Buttons (CTAs):** Primary call-to-action buttons MUST use the **Primary Green (`#22c55e`)** background color to draw the user's attention. Secondary buttons can use Neutral Gray or a simple border.
* **Backgrounds:** The main application background should be **Background White (`#f9fafb`)**. Cards and modals should use a slightly brighter white (`#ffffff`) to stand out.
* **Text Color:** Primary text should be **Dark Teal (`#0f766e`)** for a softer, more focused reading experience than pure black. Secondary text can use **Neutral Gray (`#4b5563`)**.

By following these rules precisely, you will help build a consistent and beautiful user interface for LaterLeaf.

End of file.
