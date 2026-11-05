# Refactor Cleanup Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all non-dashboard pages, components, and associated code logic while fully preserving the dashboard and Supabase connection layer.

**Architecture:** Inspect project structure, identify non-dashboard pages/components/routes, remove them safely, ensure Supabase client/connection code and dashboard remain intact, and verify build/tests pass.

**Tech Stack:** React/Vite/Next.js (project stack), Supabase.

**Spec:** User request to clean up all pages except dashboard and retain Supabase connections.

## Global Constraints

- Preserve Supabase client setup, environment configuration, and connection handlers.
- Preserve the Dashboard component and its direct dependencies.
- Remove all other pages/views, unneeded components, and specific page logic.

## Review Focus

- Accidental deletion of Supabase helper or client configuration.
- Broken routing or missing imports after page cleanup.
- Orphaned imports or dangling references in remaining files.

---

### Task 1: Analyze Project Structure and Identify Files

**Files:**
- None (analysis only)

- [ ] **Step 1: List files in project to map out components, pages, and Supabase files**
Run: `find src -maxdepth 3 -not -path '*/.*'`
Expected: List of directories and files.
