---
name: mern-stack-assistant
description: "Assists with building and modifying a MERN stack application."
category: code
risk: safe
source: user
tags: "[mern, fullstack, code-generation]"
date_added: "2026-05-16"
---

# mern-stack-assistant

## Purpose

To assist the developer in building, maintaining, and debugging their MERN (MongoDB, Express, React, Node.js) stack website. It provides contextual code generation and modification across the `frontend` and `backend` directories.

## When to Use This Skill

This skill should be used when:
- Working on the MERN stack application
- Adding new features to the frontend or backend
- Debugging issues that span the client and server
- Creating API endpoints or React components
- You prompt the assistant for help with the application

## Core Capabilities

1. **Full-Stack Context Awareness** - Understands the relationship between the `frontend` React code and `backend` Node/Express code.
2. **Code Generation** - Generates boilerplate and functional code for both ends of the stack.
3. **Debugging** - Diagnoses errors by analyzing both server logs and client-side behavior.
4. **Platform Support** - Designed to work with GitHub Copilot CLI, Claude Code, Codex, and Antigravity.

## Behavior

When invoked, this skill will:
1. Examine relevant files in `frontend` and `backend` directories.
2. Ensure changes in the backend API are reflected in the frontend's API calls.
3. Follow best practices for React components and Express controllers.

## Technical Implementation Notes

- Frontend is located in `./frontend/`
- Backend is located in `./backend/`
