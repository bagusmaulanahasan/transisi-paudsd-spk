# Refactor Kelas & Kriteria Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `src/routes/kelas/+page.svelte` and `src/routes/kriteria/+page.svelte` to use global `<Table>` and `<Input>` components.

**Architecture:** Replace existing `<table` and `input` tags with global UI components.

**Tech Stack:** Svelte, Supabase, Tailwind.

**Spec:** `/home/beema/Projects/Github-Repo/windows/spk-tkislamkencana-v2/.superpowers/sdd/2026-11-08-global-table-form-components/task-2-brief.md`

## Global Constraints
- UI components: Table, Input, Select, Button, Modal.
- Maintain existing functionality.

## Review Focus
- Ensure data binding in forms remains functional.
- Verify table layout and actions are preserved.

---

### Task 1: Refactor Kelas Page
- Modify: `src/routes/kelas/+page.svelte`

- [ ] **Step 1: Replace HTML table with `<Table>` component in `src/routes/kelas/+page.svelte`**
- [ ] **Step 2: Replace `input` elements with `<Input>` in `src/routes/kelas/+page.svelte`**
- [ ] **Step 3: Commit**

### Task 2: Refactor Kriteria Page
- Modify: `src/routes/kriteria/+page.svelte`

- [ ] **Step 1: Replace HTML table with `<Table>` component in `src/routes/kriteria/+page.svelte`**
- [ ] **Step 2: Replace `input` elements with `<Input>` in `src/routes/kriteria/+page.svelte`**
- [ ] **Step 3: Commit**

### Task 3: Build and Verify
- Run: `npm run build`
