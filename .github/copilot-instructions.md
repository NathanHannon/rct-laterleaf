## LaterLeaf AI Contributor Guide

Purpose: Give AI agents the minimum, project-specific context (NOT generic advice) to make safe, productive changes across the monorepo (frontend `rct-laterleaf` + backend `lb-laterleaf`). Keep changes consistent with existing patterns below.

### 1. Big Picture: Monorepo Architecture

-   **Frontend (`rct-laterleaf`)**: A React + Vite + TypeScript PWA. It handles all user-facing views and authentication via Clerk. It communicates with the backend via a proxy configured in `vite.config.ts`.
-   **Backend (`lb-laterleaf`)**: A LoopBack 4 API that manages data, business logic, and communication with external services (Clerk for auth validation, Google Gemini for AI, PostgreSQL with pgvector for semantic search).
-   **Authentication Flow**:
    1.  Frontend uses `@clerk/clerk-react` to sign users in and get a JWT.
    2.  Every API request from the frontend includes an `Authorization: Bearer <token>` header.
    3.  Backend uses a custom `ClerkStrategy` (`src/authentication/clerk.strategy.ts`) to validate the JWT from Clerk's JWKS endpoint.
    4.  Backend controllers are protected with the `@authenticate('clerk')` decorator.

### 2. Core Domain Model (Key Files in `lb-laterleaf/src/models`)

-   `User`: Stores user profile info. Linked to Clerk users by `clerkId`. Contains subscription tier info (`hasProAccess`).
-   `Article`: Stores the canonical, user-agnostic content of a saved article. Contains embeddings for semantic search.
-   `UserArticle`: A critical **junction model** that links a `User` to an `Article`. It stores user-specific metadata like `isBookmarked`, `isArchived`, `summary`, `status`, and `chatHistory` (JSONB field). **Most status updates should modify this model, not the canonical `Article`.**
-   `Collection` & `ArticleCollection`: Manages user-created collections of articles.
-   `UserTag` & `UserArticleTag`: Manages user-specific tags for articles.
-   **Status Pattern**: Articles have states managed via `UserArticle.status` ('unread', 'read', 'archived'). Use this instead of separate boolean flags.

### 3. Backend (LoopBack 4) Workflows & Conventions

-   **Run Dev Server**: `npm start` (builds and runs `dist/index.js`). For watch mode, run the "Watch and Compile Project" task in VS Code, then `npm start`.
-   **Database Migrations**: After changing any model in `src/models`, run `npm run migrate` to update the PostgreSQL schema.
-   **Model/Repository/Controller Layers**:
    -   **Models (`src/models`)**: Define the shape of data and relations. Use `@model({name: 'snake_case_table'})` and `@property({postgresql: {columnName: 'snake_case_column'}})` to map to the database schema.
    -   **Repositories (`src/repositories`)**: Handle database access logic. Custom query methods (like `findSimilarWeighted` in `article.repository.ts`) are common for complex lookups.
    -   **Controllers (`src/controllers`)**: Expose REST API endpoints. Use decorators (`@get`, `@post`, `@param`, etc.) to define routes and schemas. Always add new controllers to `src/controllers/index.ts`.
-   **Weighted Recommendations (`recommendation.service.ts` & `article.repository.ts`)**:
    -   User interest profile is calculated **in real-time** by averaging the embeddings of their saved articles.
    -   The final recommendation score is a weighted blend: 60% semantic similarity, 30% bookmark popularity, and 10% save popularity.
    -   The `<=>` operator in `findSimilarWeighted` is the `pgvector` cosine distance operator.

### 4. Background Jobs & Queues (BullMQ + Redis/Valkey)

-   **Architecture**: Integrated Worker Pattern. The worker runs *inside* the API application (via `LifeCycleObserver`) rather than as a separate process. This simplifies deployment for I/O-bound AI tasks.
-   **Infrastructure**: Uses **BullMQ** backed by **Redis (Valkey)**.
    -   **Connection**: Uses `ioredis` directly in services (not a LoopBack datasource).
    -   **TLS/SSL**: DigitalOcean managed databases require `rediss://` protocol. We use `tls: { rejectUnauthorized: false }` to handle self-signed certs in managed environments.
    -   **Eviction Policy**: Must be set to `noeviction` (NOT `allkeys-lru`) to prevent job loss.
-   **Queues (`src/services/job-queue.service.ts`)**:
    -   `summary-pro`: For Gemini Pro summaries. Strict rate limits (50 RPM).
    -   `audio-generation`: For Podcast generation. Very strict rate limits (10 RPM).
-   **Services**:
    -   `JobQueueService`: Adds jobs to queues. Injected into controllers.
    -   `JobWorkerService`: Processes jobs. Registered as a `LifeCycleObserver` to start/stop automatically.

### 5. Frontend (React) Workflows & Conventions

-   **Run Dev Server**: `npm run dev`. The Vite dev server proxies `/api` requests to the backend running on port 3000 (see `vite.config.ts`).
-   **Component Architecture**: Components are organized by domain under `src/components`. Each component has its own folder with co-located `ComponentName.tsx` and `ComponentName.scss` files.
-   **State Management**:
    -   Global state is managed via React Context and custom hooks (e.g., `UserStatusProvider`, `ThemeProvider`).
    -   Server state is fetched using standard `fetch` calls within `useEffect` or event handlers, often using the `useAuth` hook to get a token.
    -   **User Status Pattern**: Use `UserStatusProvider` to access `isPro` and `isLoading` throughout the app.
-   **Polling Pattern**: For long-running AI tasks (Audio, Pro Summaries), the backend returns a `pending` or `processing` status immediately. Frontend components (`ArticleReader`, `ArticlePodcastPlayer`) must implement **polling** (e.g., every 5s) to check for completion.
-   **Styling (`src/styles`)**:
    -   Theming is controlled by CSS variables in `theme.scss` on the `[data-theme='light|dark']` selector.
    -   Components should use `var(--primary-color)`, `var(--card-bg)`, etc., and **never define new theme colors locally**.
-   **Analytics Pattern**: PostHog integration requires API keys from `.env`. Use consistent naming for feature flags and custom properties (see `.cursor/rules/posthog-integration.mdc`).

### 6. AI Services (`lb-laterleaf/src/services`)

-   **`GenAiService`**: Uses **Google Gemini** for all generative tasks:
    -   **Basic Summary**: Uses `gemini-2.5-flash-lite`. High limits, runs **synchronously** (direct API response).
    -   **Pro Summary**: Uses `gemini-2.5-pro`. Strict limits, runs **asynchronously** via `summary-pro` queue.
    -   **Audio/Podcast**: Uses `gemini-2.5-pro` (multi-speaker). Very strict limits, runs **asynchronously** via `audio-generation` queue.
-   **`ContentModerationService`**: Uses **OpenAI's** moderation endpoint (`omni-moderation-latest`) to check content before it's recommended to users. This is a deliberate choice to use a best-in-class specialized model for safety.
-   **`RecommendationService`**: Generates personalized recommendations by averaging user article embeddings into an "interest vector", then using `findSimilarWeighted` for recommendations.

### 7. Common Pitfalls & Key Reminders

-   **Error: "Invalid hasMany definition… missing definition of foreign key X"**: Usually, the foreign key property (e.g., `userId`) is missing from the target model's `@property` definitions or is misnamed in the relation mapping.
-   **Modifying User/Article Status**: When a user bookmarks or archives an article, you are updating the `UserArticle` junction record, not the global `Article`.
-   **Database Naming**: LoopBack properties are `camelCase`, but PostgreSQL columns are `snake_case`. Ensure all models and repositories use the correct mapping decorators.
-   **Artifact Exports (Barrel Files)**: LoopBack 4 relies on `index.ts` exports. ALWAYS add new Controllers, Models, Repositories, Services, and Datasources to their respective `src/<type>/index.ts` file to be discovered by the application.
-   **Frontend API Calls**: All API calls should be directed to relative paths like `/api/articles/...`. Vite handles proxying to the backend.

