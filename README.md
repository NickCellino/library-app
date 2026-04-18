# Library

Personal book collection manager built with React, Vite, and Firebase.

It is designed primarily for mobile use and focuses on fast book entry, searchable organization, and a polished editorial-style UI.

## Highlights

- Add and edit books manually
- Scan barcodes for quick ISBN-based entry
- Search across title, author, ISBN, and publisher
- Group books by author in the main library view
- Store data per user in Firebase
- Run as a responsive PWA

Each book can include title, author, ISBN, cover image, publication year, publisher, page count, and date added.

## Stack

- React + Vite frontend
- Firebase Auth, Firestore, Storage, and callable Functions
- Fuse.js for client-side fuzzy search
- Google Books integration through backend functions
- Terraform for infrastructure management

## Getting Started

```bash
npm install
npm run dev
```

Other common commands:

```bash
npm run build
npm run preview
npm run dev:emulate
npm test
npm run test:unit
```

## Repository Guide

- `src/` app code
- `tests/` Playwright end-to-end tests
- `functions/` Firebase Cloud Functions
- `terraform/` infrastructure config

## Development Notes

- Use `npm run dev:emulate` when working locally with Firebase emulators
- Production frontend config is supplied through `VITE_FIREBASE_*` environment variables
- Infrastructure-specific details live in `terraform/README.md`
- Agent-specific workflow and environment details live in `AGENTS.md`
