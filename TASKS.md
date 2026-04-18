# Tasks

## Source PRD

`PRD.md`

## Task Work Tracking

### Completion Checklist

- [x] Task 1: Backend ISBN Lookup End-to-End
- [x] Task 2: Barcode Lookup Uses Backend ISBN API
- [x] Task 3: Manual Search Uses Backend Search API
- [x] Task 4: Cover Search And Reset Use Backend APIs
- [ ] Task 5: Remove Browser Google Books Access And Env Dependency
- [ ] Task 6: Regression Coverage For Backend-Only Google Books Flows

## Task 1: Backend ISBN Lookup End-to-End

**Type**: AFK

**What to build**

Deliver the first complete backend-backed Google Books path for exact ISBN lookup. This slice should implement the shared server-side Google Books access pattern described in the PRD and wire one real user-facing flow through it: add-book ISBN autofill. This establishes the authenticated callable pattern, normalized book response shape, and basic no-result and error behavior for future slices.

**Acceptance criteria**

- [x] A signed-in user can trigger add-book ISBN autofill through an authenticated callable function rather than a direct browser request to Google Books.
- [x] The backend returns one normalized book result or no result for an ISBN lookup, with basic auth, validation, and error handling consistent with the PRD.
- [x] The backend ISBN lookup path has tests covering normalization and callable auth or validation behavior, and the frontend wrapper path has tests covering the app-level contract.

**Blocked by**

None - can start immediately

**User stories addressed**

- User story 1
- User story 8
- User story 9
- User story 10
- User story 11
- User story 19
- User story 22
- User story 24
- User story 25
- User story 26
- User story 28
- User story 30
- User story 31
- User story 32
- User story 33
- User story 34
- User story 40

## Task 2: Barcode Lookup Uses Backend ISBN API

**Type**: AFK

**What to build**

Extend the backend ISBN lookup slice into the scanner-based flows so barcode scanning uses the same authenticated backend contract end-to-end. This slice should keep duplicate handling and add behavior intact while proving that scan-driven lookup no longer depends on direct browser access to Google Books.

**Acceptance criteria**

- [x] Barcode scanning in the main library flow resolves scanned ISBNs through the backend ISBN lookup path and preserves current duplicate and add behavior.
- [x] Add-to-TBR scanning resolves missing library books through the same backend ISBN lookup path and preserves current success and not-found behavior.
- [x] Scanner-focused tests verify user-visible outcomes without depending on direct browser Google Books requests.

**Blocked by**

Task 1: Backend ISBN Lookup End-to-End

**User stories addressed**

- User story 2
- User story 9
- User story 12
- User story 13
- User story 16
- User story 17
- User story 30
- User story 35
- User story 40

## Task 3: Manual Search Uses Backend Search API

**Type**: AFK

**What to build**

Deliver the second backend-backed Google Books contract for free-text search and wire the manual title and author search UI through it. This slice should establish the list-based normalized search response, preserve current search behavior and basic errors, and ensure the frontend consumes an app-owned search wrapper rather than direct upstream query construction.

**Acceptance criteria**

- [x] A signed-in user can search by title and or author through an authenticated backend callable that returns normalized book results.
- [x] The search modal continues to support debounced searching with user-visible behavior broadly consistent with the current UI.
- [x] Backend callable and normalization tests, plus frontend wrapper or UI tests, cover the app-level manual search contract.

**Blocked by**

None - can start immediately

**User stories addressed**

- User story 3
- User story 7
- User story 9
- User story 10
- User story 14
- User story 16
- User story 18
- User story 20
- User story 22
- User story 24
- User story 25
- User story 26
- User story 30
- User story 31
- User story 32
- User story 33
- User story 34
- User story 40

## Task 4: Cover Search And Reset Use Backend APIs

**Type**: AFK

**What to build**

Move the cover-related flows to backend-owned Google Books access. This slice should deliver the dedicated lightweight cover-search response described in the PRD and wire both cover option search and cover reset behavior through backend APIs while preserving the current UI interactions.

**Acceptance criteria**

- [x] Cover option search uses an authenticated backend callable that returns lightweight cover choices tailored to the existing cover-picker UI.
- [x] Reset cover by ISBN and reset cover by title plus author both use backend-owned Google Books access and preserve current success, not-found, and basic error behavior.
- [x] Cover-flow tests verify the dedicated response contract and the user-visible reset or selection behavior.

**Blocked by**

Task 1: Backend ISBN Lookup End-to-End

Task 3: Manual Search Uses Backend Search API

**User stories addressed**

- User story 4
- User story 5
- User story 6
- User story 9
- User story 15
- User story 16
- User story 21
- User story 22
- User story 23
- User story 25
- User story 27
- User story 30
- User story 31
- User story 35
- User story 40

## Task 5: Remove Browser Google Books Access And Env Dependency

**Type**: AFK

**What to build**

Complete the architectural migration by removing remaining browser-side Google Books access and eliminating the frontend Google Books capability dependency. This slice should make the PRD’s completion condition true: the browser no longer calls Google Books directly in any current flow, and frontend configuration is no longer used as a Google Books credential.

**Acceptance criteria**

- [ ] All current Google Books-backed user flows route through app-owned backend call paths with no remaining direct browser requests to Google Books.
- [ ] Frontend code no longer constructs Google Books URLs or relies on frontend environment configuration as a Google Books credential.
- [ ] Project documentation or configuration examples reflect the backend-only Google Books access model.

**Blocked by**

Task 2: Barcode Lookup Uses Backend ISBN API

Task 3: Manual Search Uses Backend Search API

Task 4: Cover Search And Reset Use Backend APIs

**User stories addressed**

- User story 16
- User story 23
- User story 28
- User story 29
- User story 37
- User story 39
- User story 40

## Task 6: Regression Coverage For Backend-Only Google Books Flows

**Type**: AFK

**What to build**

Add final regression coverage that treats the migrated backend-owned Google Books integration as the stable system boundary. This slice should verify that the key user flows remain demoable, that tests assert external behavior rather than transport internals, and that the codebase is protected against accidental reintroduction of direct browser Google Books access.

**Acceptance criteria**

- [ ] Critical flows have regression coverage aligned with the PRD: ISBN autofill, scanner lookup, manual search, and cover search or reset.
- [ ] Tests assert user-visible behavior and app-owned API contracts rather than direct Google Books transport details.
- [ ] The test suite or supporting checks make it difficult to reintroduce direct browser Google Books access unnoticed.

**Blocked by**

Task 2: Barcode Lookup Uses Backend ISBN API

Task 3: Manual Search Uses Backend Search API

Task 4: Cover Search And Reset Use Backend APIs

Task 5: Remove Browser Google Books Access And Env Dependency

**User stories addressed**

- User story 9
- User story 11
- User story 12
- User story 13
- User story 15
- User story 18
- User story 32
- User story 33
- User story 34
- User story 35
- User story 40
