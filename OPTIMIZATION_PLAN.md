# CityLife — Expert Code Review & Optimization Plan

> **Reviewed:** All pages, components, hooks, utilities, Supabase integration, SQL migrations, CI/CD workflow  
> **Stack:** Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + Supabase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Critical Issues (Must Fix)](#2-critical-issues-must-fix)
3. [Architecture & Structure](#3-architecture--structure)
4. [TypeScript & Type Safety](#4-typescript--type-safety)
5. [Data Fetching & State Management](#5-data-fetching--state-management)
6. [Form Management](#6-form-management)
7. [Component Decomposition](#7-component-decomposition)
8. [Performance Optimization](#8-performance-optimization)
9. [Security & Auth](#9-security--auth)
10. [UX & Consistency](#10-ux--consistency)
11. [Database & Migrations](#11-database--migrations)
12. [CI/CD & DevOps](#12-cicd--devops)
13. [Testing Strategy](#13-testing-strategy)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Executive Summary

The CityLife application is a functional civic services portal for San Carlos City, Pangasinan. It covers document requests, citizen concerns, business services, health services, emergency info, announcements, admin dashboard, payment tracking, and notifications. The code works but suffers from several systemic issues:

- **God components** — `AdminDashboard.tsx` (580+ lines) and `DocumentRequestsService.tsx` (800+ lines) contain entire features in single files
- **Unused dependencies** — `@tanstack/react-query`, `react-hook-form`, and `zod` are installed but never used
- **Pervasive `any` types** — Type safety is undermined throughout, especially with `as any` casts for missing Supabase table types
- **Duplicate systems** — Two toast libraries (`sonner` + custom `use-toast`) used inconsistently
- **No code splitting** — All 10 routes are eagerly imported
- **No shared auth guard** — Every page reimplements auth checking independently
- **Stale generated types** — `payments` and `notifications` tables exist in migrations but are absent from `types.ts`

**Estimated effort:** 3–4 sprints (assuming 2-week sprints) to address all items below.

---

## 2. Critical Issues (Must Fix)

### 2.1 Stale Supabase Generated Types
**Files:** `src/integrations/supabase/types.ts`  
**Problem:** Only `citizen_concerns`, `city_announcements`, `profiles`, and `user_roles` are typed. `payments` and `notifications` tables are completely missing, forcing `as any` casts in every query touching those tables.  
**Fix:** Regenerate types with `supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts`. Run this as part of CI whenever migrations change.

### 2.2 Duplicate Toast Systems
**Files:** Throughout the codebase  
**Problem:** `sonner` is used in service components (`DocumentRequestsService`, `CitizenConcernsService`, etc.) and `MyRequestsSection`, while the shadcn `use-toast` hook is used in `AdminDashboard`, `Header`, `Auth`, and `AdminSidebar`. Users see different toast UIs depending on which page they're on.  
**Fix:** Pick one system. Recommendation: **keep `sonner`** (simpler API, already used in the majority of files). Remove the custom `use-toast` hook, `Toaster` from shadcn's toast, and replace all `useToast()` calls with `toast()` from sonner.

### 2.3 Hardcoded Announcements
**File:** `src/components/AnnouncementsSection.tsx`  
**Problem:** Displays 4 hardcoded static announcement objects instead of fetching from the `city_announcements` Supabase table. The `requireAuth()` function is defined but the data is never fetched from the DB.  
**Fix:** Fetch published announcements from Supabase with proper loading/error states.

### 2.4 Duplicate Migration for `location` Column
**Files:** `20260215233817_*.sql` (initial migration) and `20260218000000_add_location_to_citizen_concerns.sql`  
**Problem:** The initial migration already creates `citizen_concerns` with `location TEXT DEFAULT ''`. The second migration attempts to add the same column again. This will fail on fresh deployments.  
**Fix:** Remove or guard the second migration with `IF NOT EXISTS` equivalent, or consolidate into the initial migration.

### 2.5 `createNotification()` Exported from Component File
**File:** `src/components/NotificationBell.tsx`  
**Problem:** A data-layer function (`createNotification`) is exported from a UI component file. This creates a circular concern — service files import from a component purely for a utility function.  
**Fix:** Move `createNotification()` to `src/lib/notifications.ts` or `src/services/notifications.ts`.

---

## 3. Architecture & Structure

### 3.1 Adopt Feature-Based Folder Structure
**Current:** Flat `components/` and `pages/` folders with everything mixed together.  
**Proposed:**
```
src/
  features/
    auth/
      AuthPage.tsx
      AuthGuard.tsx
      useAuth.ts
    admin/
      AdminDashboard.tsx
      components/
        ConcernsTab.tsx
        AnnouncementsTab.tsx
        AnalyticsTab.tsx
      hooks/
        useAdminData.ts
    documents/
      DocumentRequestsService.tsx
      hooks/
        useDocumentForm.ts
      schemas/
        documentSchema.ts
    concerns/
      CitizenConcernsService.tsx
    payments/
      PaymentHistory.tsx
      GCashPayment.tsx
    notifications/
      NotificationBell.tsx
      notificationService.ts
  shared/
    components/ (Header, Footer, ServiceCard, etc.)
    hooks/
    lib/
    ui/ (shadcn components)
```

### 3.2 Create a Service/API Layer
**Problem:** Supabase calls are scattered inline throughout components.  
**Fix:** Create `src/services/` with modules like:
- `src/services/concerns.ts` — CRUD for citizen_concerns
- `src/services/announcements.ts` — fetch/create/update announcements
- `src/services/payments.ts` — payment operations
- `src/services/notifications.ts` — notification CRUD + `createNotification()`
- `src/services/auth.ts` — auth state helpers

This decouples data access from UI and enables easier testing and caching.

### 3.3 Add Path Aliases
**Current:** `@/` alias exists but map it more granularly for better DX:
```json
{
  "@/features/*": ["./src/features/*"],
  "@/shared/*": ["./src/shared/*"],
  "@/services/*": ["./src/services/*"]
}
```

---

## 4. TypeScript & Type Safety

### 4.1 Eliminate All `any` Types
**Scope:** ~30+ instances across the codebase  
**Key offenders:**

| File | Usage | Fix |
|------|-------|-----|
| `AdminDashboard.tsx` | `concerns`, `announcements`, `profiles` all typed as `any[]` | Use Supabase generated types: `Tables<'citizen_concerns'>[]` |
| `PaymentHistory.tsx` | `supabase.from("payments" as any)` | Regenerate types to include `payments` table |
| `NotificationBell.tsx` | `supabase.from("notifications" as any)` | Regenerate types to include `notifications` table |
| `BusinessServicesService.tsx` | `} as any).select()` on inserts | Remove once types are regenerated |
| `MyRequestsSection.tsx` | `request: any` in callbacks | Define `CitizenConcern` type properly |
| `GCashPayment.tsx` | `onPaymentSubmitted: (info: any) => void` | Define `PaymentSubmission` interface |

### 4.2 Enable Stricter TypeScript
Add to `tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 4.3 Define Domain Types
Create `src/types/` with:
```typescript
// src/types/domain.ts
export interface CitizenConcern {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  location: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  admin_response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  request_id: string | null;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  status: 'pending_verification' | 'verified' | 'rejected' | 'refunded';
  // ...
}

export interface Notification { /* ... */ }
```

---

## 5. Data Fetching & State Management

### 5.1 Adopt `@tanstack/react-query` (Already Installed!)
**Problem:** The package is installed and `QueryClientProvider` wraps the app, but zero `useQuery` or `useMutation` hooks are used. Every component manually manages `useState` + `useEffect` + loading/error states with raw Supabase calls.  
**Fix:** Wrap all data fetching in react-query hooks:

```typescript
// src/services/concerns.ts
export const useConcerns = () =>
  useQuery({
    queryKey: ['concerns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citizen_concerns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useRespondToConcern = () =>
  useMutation({
    mutationFn: async ({ id, response, status }: RespondPayload) => {
      const { error } = await supabase
        .from('citizen_concerns')
        .update({ admin_response: response, status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concerns'] });
    },
  });
```

**Benefits:** Automatic caching, background refetching, optimistic updates, deduplication, loading/error states, devtools.

### 5.2 Remove Manual Polling Where react-query Refetch Suffices
**File:** `NotificationBell.tsx`  
**Problem:** Uses both `setInterval` (30s polling) AND Supabase Realtime subscription simultaneously.  
**Fix:** Use react-query with Realtime-triggered invalidation:
```typescript
const queryClient = useQueryClient();

// Realtime subscription invalidates the cache
useEffect(() => {
  const channel = supabase.channel('notifications')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' },
      () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    ).subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);
```

### 5.3 AdminDashboard `fetchAll()` → Parallel react-query Hooks
**Current:** Single `Promise.all` blob with 3-4 queries, manual `setLoading`, `setError`.  
**Fix:** Separate `useAdminConcerns()`, `useAdminAnnouncements()`, `useAdminProfiles()` hooks. react-query runs them in parallel automatically and each has independent loading/error states.

---

## 6. Form Management

### 6.1 Adopt `react-hook-form` + `zod` (Already Installed!)
**Problem:** Both are in `package.json` but unused. `DocumentRequestsService.tsx` has **80+ individual `useState` hooks** for form fields, plus ~60 lines of manual validation and ~80 lines of manual reset.  
**Fix:** For each form, define a zod schema and use `react-hook-form`:

```typescript
// src/features/documents/schemas/birthCertificateSchema.ts
import { z } from 'zod';

export const birthCertificateSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Required'),
  dobMonth: z.string().min(1, 'Required'),
  dobDay: z.string().min(1, 'Required'),
  dobYear: z.string().min(1, 'Required'),
  birthCity: z.string().min(1, 'Required'),
  birthProvince: z.string().min(1, 'Required'),
  fatherName: z.string().optional(),
  motherMaidenName: z.string().optional(),
  purpose: z.string().min(1, 'Required'),
});

// In component:
const form = useForm<z.infer<typeof birthCertificateSchema>>({
  resolver: zodResolver(birthCertificateSchema),
});
```

**Impact:** Eliminates ~80 `useState` calls, ~60 lines of manual validation, ~80 lines of manual reset in `DocumentRequestsService` alone.

### 6.2 Split Document Forms by Type
**Problem:** `DocumentRequestsService.tsx` is 800+ lines managing 5 different certificate types in a single component.  
**Fix:** Extract each certificate form into its own component:
- `BirthCertificateForm.tsx`
- `MarriageCertificateForm.tsx`
- `DeathCertificateForm.tsx`
- `ResidenceCertificateForm.tsx`
- `CedulaForm.tsx`

Each uses its own zod schema and react-hook-form instance. Parent component conditionally renders the selected form.

---

## 7. Component Decomposition

### 7.1 AdminDashboard (~580 lines → Multiple Components)
**Current state:** 15+ `useState` hooks, inline chart rendering, CRUD dialogs, tabbed views — all in one file.  
**Decompose into:**

| New Component | Responsibility |
|---------------|----------------|
| `AdminLayout.tsx` | Sidebar + content area shell |
| `ConcernsTab.tsx` | Concerns table, search/filter, response dialog |
| `AnnouncementsTab.tsx` | Announcements CRUD + create dialog |
| `DocumentsTab.tsx` | Document requests management |
| `BusinessTab.tsx` | Business service requests |
| `HealthTab.tsx` | Health service requests |
| `AnalyticsTab.tsx` | Charts + statistics cards |
| `ConcernResponseDialog.tsx` | The respond-to-concern modal |
| `AnnouncementFormDialog.tsx` | Create/edit announcement modal |
| `useAdminStats.ts` | Hook for dashboard statistics |

### 7.2 MyRequestsSection (~350 lines)
- Extract `RequestCard` (currently defined inline inside the component) into its own file
- Extract `RequestTimeline` stepper into a reusable component
- Move category-detection logic into a utility:
  ```typescript
  // Bad: subject?.startsWith("Document Request:")
  // Good: categorizeRequest(request) using category field + fallback
  ```

### 7.3 Header Component
- Extract `MobileNav` as a separate component (currently duplicates desktop nav link className logic)
- Extract auth state management into `useAuth()` hook

### 7.4 Service Components (Common Patterns)
All 4 service components (`DocumentRequests`, `CitizenConcerns`, `BusinessServices`, `HealthServices`) follow a similar pattern: auth check → form → submit to `citizen_concerns` → email → notification → toast.  
**Create shared hooks:**
- `useServiceSubmission(tableName, subject, category)` — handles the common Supabase insert + email + notification + toast flow
- `useFileUpload()` — handles Supabase Storage file uploads (currently duplicated in Documents and Concerns)

---

## 8. Performance Optimization

### 8.1 Route-Level Code Splitting
**File:** `src/App.tsx`  
**Problem:** All 10 pages are eagerly imported at the top of App.tsx.  
**Fix:**
```typescript
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Auth = lazy(() => import('./pages/Auth'));
const Services = lazy(() => import('./pages/Services'));
// ... etc

// In router:
<Route path="/admin" element={
  <Suspense fallback={<PageSkeleton />}>
    <AdminDashboard />
  </Suspense>
} />
```
**Impact:** Initial bundle reduced significantly since admin-only code (~580 lines + recharts) won't load for regular users.

### 8.2 Memoize Expensive Computations
**AdminDashboard:** Client-side profile joining and chart data computation run on every render.
```typescript
// Memoize profile lookup map
const profileMap = useMemo(
  () => new Map(profiles.map(p => [p.user_id, p])),
  [profiles]
);

// Memoize chart data
const chartData = useMemo(() => computeChartData(concerns), [concerns]);
```

### 8.3 Virtualize Long Lists
**My Requests page** and **Admin concerns table** can grow large. Use `@tanstack/react-virtual` or paginate results server-side with Supabase `.range()`.

### 8.4 Image Optimization
- Photo previews in CitizenConcernsService use `URL.createObjectURL` which is fine, but uploaded images are served at full size from Supabase Storage.
- **Fix:** Use Supabase Image Transformations or resize client-side before upload.

### 8.5 Debounce Admin Search Input
**AdminDashboard:** The search input (`searchQuery`) triggers filtering on every keystroke.
```typescript
const debouncedSearch = useDebouncedValue(searchQuery, 300);
```

---

## 9. Security & Auth

### 9.1 Shared Auth Guard / Protected Route
**Problem:** Each page independently calls `supabase.auth.getSession()` and redirects to `/auth`. This logic is duplicated ~8 times.  
**Fix:** Create a `<ProtectedRoute>` wrapper:
```typescript
// src/components/ProtectedRoute.tsx
export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) return <PageSkeleton />;
  if (!user) return <Navigate to="/auth" />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" />;
  return children;
};

// Usage:
<Route path="/admin" element={
  <ProtectedRoute requireAdmin>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

### 9.2 Create a Centralized `useAuth()` Hook
**Problem:** Auth state (user, session) is fetched independently in Header, AdminDashboard, NotificationBell, every service component, etc. Multiple `onAuthStateChange` subscriptions exist.  
**Fix:** Create `src/hooks/useAuth.ts` that provides auth state via React Context, with a single `onAuthStateChange` listener. All components consume this context.

### 9.3 Validate User Inputs Server-Side
**Problem:** Form validation is client-side only. The Supabase RLS policies enforce `user_id` ownership but don't validate field content.  
**Fix:** Add Supabase Edge Function or database-level constraints for critical fields (e.g., max length on `subject`, valid `status` values via enum).

### 9.4 Use `BrowserRouter` Instead of `HashRouter`
**Current:** `HashRouter` produces `/#/services` URLs.  
**Problem:** Hash-based routing is a workaround for static hosting that doesn't support SPA fallback. GitHub Pages already has the `404.html` fallback file in `public/`.  
**Fix:** Switch to `BrowserRouter`. The existing `public/404.html` file handles the SPA redirect for GitHub Pages.

---

## 10. UX & Consistency

### 10.1 Consolidate Toast System
(See 2.2 above.) Standardize on `sonner` throughout.

### 10.2 Fix Copyright Year
**File:** `src/components/Footer.tsx`  
**Problem:** Hardcoded `2024`.  
**Fix:** `{new Date().getFullYear()}`

### 10.3 Loading States
**Problem:** Most pages show no feedback while data loads. Admin dashboard has a loading spinner, but individual tabs don't.  
**Fix:** Use skeleton components (shadcn's `Skeleton`) for cards and tables during loading.

### 10.4 Error Boundaries
**Problem:** No React error boundaries. A crash in any component takes down the entire app.  
**Fix:** Add error boundaries at the route level:
```typescript
<Route path="/admin" element={
  <ErrorBoundary fallback={<ErrorPage />}>
    <AdminDashboard />
  </ErrorBoundary>
} />
```

### 10.5 Empty States
**Problem:** When a user has no requests, the My Requests page shows an empty area with no guidance.  
**Fix:** Add friendly empty-state illustrations/messages with CTAs (e.g., "No requests yet. Browse Services to get started.").

### 10.6 Fragile Category Detection
**File:** `MyRequestsSection.tsx`  
**Problem:** Uses `subject?.startsWith("Document Request:")`, `startsWith("Business")`, `startsWith("Vaccination")`, etc. to categorize requests. If the subject format changes even slightly, categories break.  
**Fix:** Use the `category` database field directly instead of parsing subjects. Map category values to display tabs.

---

## 11. Database & Migrations

### 11.1 Fix Duplicate `location` Column Migration
(See 2.4 above.)

### 11.2 Add Indexes for Common Queries
```sql
CREATE INDEX idx_concerns_user_id ON public.citizen_concerns(user_id);
CREATE INDEX idx_concerns_status ON public.citizen_concerns(status);
CREATE INDEX idx_concerns_created_at ON public.citizen_concerns(created_at DESC);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_notifications_user_id_read ON public.notifications(user_id, is_read);
```

### 11.3 Use Proper Enums for Status Fields
**Current:** `status TEXT` allows any string value.  
**Fix:**
```sql
CREATE TYPE concern_status AS ENUM ('pending', 'in-progress', 'resolved', 'rejected');
ALTER TABLE citizen_concerns ALTER COLUMN status TYPE concern_status USING status::concern_status;
```

### 11.4 Regenerate Supabase Types in CI
Add a CI step (or pre-commit hook) that runs `supabase gen types typescript` and fails if the output differs from the committed `types.ts`.

---

## 12. CI/CD & DevOps

### 12.1 Add Lint & Type-Check to CI
**Current:** `deploy.yml` only runs `npm ci` and `npm run build`.  
**Fix:** Add steps:
```yaml
- name: Type check
  run: npx tsc --noEmit

- name: Lint
  run: npm run lint
```

### 12.2 Add Environment Variable Validation
**Problem:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are required but not validated at build time. If missing, the app silently fails at runtime.  
**Fix:** Add a vite plugin or startup check:
```typescript
// src/lib/env.ts
const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'] as const;
for (const v of requiredVars) {
  if (!import.meta.env[v]) throw new Error(`Missing env var: ${v}`);
}
```

### 12.3 Consider Preview Deployments
Add Vercel/Netlify preview deploys for PRs or use GitHub Pages preview with a different base path.

---

## 13. Testing Strategy

### 13.1 Unit Tests (Vitest)
**Vitest is already compatible with the Vite setup.** Add:
```
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```
Priority test targets:
- `generateOrderId()` — pure function, easy to test
- `cn()` utility
- Service layer functions (once extracted)
- Zod schemas (once created)

### 13.2 Component Tests
- Form validation flows
- Auth guard behavior  
- Toast message correctness

### 13.3 E2E Tests (Playwright)
- Full auth flow (sign up → sign in → sign out)
- Submit a document request → verify it appears in My Requests
- Admin responds to a concern → user sees notification

---

## 14. Implementation Roadmap

### Phase 1: Foundations (Sprint 1) — High Impact, Low Risk
| # | Task | Priority | Files Affected |
|---|------|----------|----------------|
| 1 | Regenerate Supabase types (add `payments`, `notifications`) | P0 | `types.ts` |
| 2 | Consolidate toast systems → `sonner` only | P0 | ~10 files |
| 3 | Create `useAuth()` context + `<ProtectedRoute>` | P0 | New files + all pages |
| 4 | Move `createNotification()` to `src/services/notifications.ts` | P1 | `NotificationBell.tsx`, 4 service files |
| 5 | Fix hardcoded announcements → fetch from Supabase | P1 | `AnnouncementsSection.tsx` |
| 6 | Fix Footer copyright year | P2 | `Footer.tsx` |
| 7 | Fix duplicate location migration | P1 | Migration file |
| 8 | Add env var validation | P1 | New `src/lib/env.ts` |

### Phase 2: Data Layer (Sprint 2) — Architecture Improvement
| # | Task | Priority | Files Affected |
|---|------|----------|----------------|
| 9 | Create service layer (`src/services/*.ts`) | P0 | New files |
| 10 | Adopt `@tanstack/react-query` for all data fetching | P0 | All pages/components with Supabase queries |
| 11 | Remove manual polling in NotificationBell | P1 | `NotificationBell.tsx` |
| 12 | Fix fragile category detection in MyRequestsSection | P1 | `MyRequestsSection.tsx` |
| 13 | Add database indexes | P1 | New migration |
| 14 | Switch to `BrowserRouter` | P2 | `App.tsx` |

### Phase 3: Forms & Components (Sprint 3) — DX & Maintainability
| # | Task | Priority | Files Affected |
|---|------|----------|----------------|
| 15 | Adopt `react-hook-form` + `zod` for DocumentRequests | P0 | `DocumentRequestsService.tsx` → split into 5+ files |
| 16 | Adopt `react-hook-form` + `zod` for all other forms | P1 | Concerns, Business, Health, Admin forms |
| 17 | Decompose AdminDashboard into sub-components | P0 | `AdminDashboard.tsx` → 8+ files |
| 18 | Extract inline components (RequestCard, MobileNav, etc.) | P1 | Multiple files |
| 19 | Add route-level code splitting with `React.lazy` | P1 | `App.tsx` |
| 20 | Add `useMemo` for admin charts and profile joins | P1 | `AdminDashboard.tsx` |

### Phase 4: Polish & Quality (Sprint 4) — Robustness
| # | Task | Priority | Files Affected |
|---|------|----------|----------------|
| 21 | Enable strict TypeScript + eliminate remaining `any` | P0 | `tsconfig.app.json` + all files |
| 22 | Add error boundaries | P1 | `App.tsx` + new component |
| 23 | Add loading skeletons & empty states | P1 | Multiple pages |
| 24 | Add Vitest unit tests for services + utils | P1 | New test files |
| 25 | Add lint + type-check to CI | P1 | `deploy.yml` |
| 26 | Add status enums to database | P2 | New migration |
| 27 | Feature-based folder restructure | P2 | All files (big rename) |
| 28 | Add E2E tests with Playwright | P2 | New test files |

---

## Appendix: Unused Dependencies to Remove or Adopt

| Package | Status | Action |
|---------|--------|--------|
| `@tanstack/react-query` | Installed, `QueryClientProvider` wraps app, but zero hooks used | **Adopt** (Phase 2) |
| `react-hook-form` | Installed, never imported | **Adopt** (Phase 3) |
| `zod` | Installed, never imported | **Adopt** (Phase 3) |
| `@hookform/resolvers` | Installed, never imported | **Adopt** with react-hook-form |
| `recharts` | Used only in AdminDashboard | Keep, but lazy-load with the admin route |
| `date-fns` | Used in a few spots | Keep |
| `input-otp` | Installed (shadcn), not observed in use | **Audit & remove if unused** |
| `embla-carousel-react` | Installed (shadcn carousel), not observed in use | **Audit & remove if unused** |

---

*This plan should be treated as a living document. Update it as items are completed and new issues are discovered.*
