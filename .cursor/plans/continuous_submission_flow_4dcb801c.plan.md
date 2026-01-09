---
name: Continuous Submission Flow
overview: Implement continuous form submissions with optimistic UI updates, allowing users to submit multiple computations without blocking, with instant list updates and live progress tracking.
todos:
  - id: backend-return-full
    content: Modify computation.create to return full computation object instead of just ID
    status: completed
  - id: form-non-blocking
    content: "Update ComputeForm: non-blocking, 'Submit' button text, 'Submitting...' during mutation, clear inputs on success"
    status: completed
  - id: optimistic-updates
    content: Implement optimistic list updates - prepend new computation immediately and auto-select it to show in Computation Engine
    status: completed
  - id: rename-title
    content: Rename 'Past Computations' to 'Computations'
    status: completed
  - id: multi-polling
    content: Track multiple active computations and poll status for all pending ones
    status: completed
  - id: list-item-states
    content: Add visual indicators in list for different computation states (submitting, processing, completed)
    status: completed
---

# Continuous Submission Flow

## Current State

- Form blocks during computation (`isLoading = createMutation.isPending || isProcessing`)
- History only updates via 10-second polling
- Single active computation tracked at a time
- Title says "Past Computations"

## Architecture

```mermaid
flowchart LR
    subgraph frontend [Frontend]
        Form[ComputeForm]
        List[Computations List]
        Results[ResultsTable]
    end
    
    subgraph backend [Backend]
        API[tRPC API]
        DB[(MongoDB)]
        Queue[Job Queue]
    end
    
    Form -->|"1. Submit (non-blocking)"| API
    API -->|"2. Return full computation"| Form
    Form -->|"3. Optimistic add"| List
    API -->|"4. Queue jobs"| Queue
    Queue -->|"5. Process"| DB
    List -->|"6. Poll status"| API
```

## Key Changes

### 1. Backend: Return Full Computation on Create

Modify [`apps/web/src/server/routers/computation.ts`](apps/web/src/server/routers/computation.ts) to return the full computation object (not just the ID):

```typescript
// Current: return { id: computationId };
// New: return the full computation object
const computation = await getComputation(computationId);
return computation;
```

### 2. Frontend: Non-Blocking Form

Update [`apps/web/src/components/compute-form.tsx`](apps/web/src/components/compute-form.tsx):

- Remove dependency on `isProcessing` for disabling inputs
- Show brief "Submitting..." state only during mutation
- Clear inputs immediately after successful mutation
- Button text: "Submit" → "Submitting..." → "Submit"

### 3. Frontend: Optimistic List Updates + Auto-Select

Update [`apps/web/src/app/page.tsx`](apps/web/src/app/page.tsx):

- Rename "Past Computations" → "Computations"
- Use tRPC's optimistic updates (`onMutate`, `onSuccess`, `onError`)
- Immediately prepend new computation to list on submit
- **Auto-select newly submitted computation** so Computation Engine shows it immediately
- Track multiple active computation IDs for parallel polling
- Poll all pending/processing computations in the list

### 4. Computation Engine: Always Reflect Selected State

The Computation Engine (ResultsTable) will:

- Always display the currently selected computation from the list
- Show real-time progress updates via polling for the selected item
- Handle initial "pending" state when first submitted (all operations at 0%)

### 5. Frontend: Computation List Item States

Add visual indicators for computation states in the list:

- **Pending/Processing**: Animated spinner indicator
- **Completed**: Normal display
- **Failed**: Error styling

### 6. Multi-Computation Polling

Implement efficient polling for multiple active computations:

- Track set of active IDs needing status updates
- Use `useQueries` or individual queries with polling for each active computation
- Remove from active set when completed/failed

## Files to Modify

- [`apps/web/src/server/routers/computation.ts`](apps/web/src/server/routers/computation.ts) - Return full computation on create
- [`apps/web/src/components/compute-form.tsx`](apps/web/src/components/compute-form.tsx) - Non-blocking submissions
- [`apps/web/src/app/page.tsx`](apps/web/src/app/page.tsx) - Optimistic updates, rename title, multi-polling
- [`apps/web/src/components/results-table.tsx`](apps/web/src/components/results-table.tsx) - Handle pending initial state (minor)