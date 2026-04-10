# Bharat Makaan V2.9 deployment pass

This is a deployment-focused full snapshot of the Bharat Makaan app.

## What changed in V2.9
- hosting config added for a Vite SPA on Firebase Hosting
- CI workflow added for frontend build, rules tests, and functions build
- deployment guide added in `docs/DEPLOYMENT.md`
- `.firebaserc.example` and `functions/.env.example` included
- admin-facing deployment readiness page added in the app
- package scripts added for emulators, hosting deploy, and rules deploy
- keeps OTP auth, Storage-backed floor plan uploads, verified supplier pricing, and DB-first printing

## Local setup
1. copy `.env.example` to `.env`
2. copy `.firebaserc.example` to `.firebaserc`
3. set your Firebase project id
4. install root dependencies with `npm install`
5. install functions dependencies with `cd functions && npm install`
6. run `npm run test:rules`
7. run `npm run dev`

## Deploy order
1. deploy rules and indexes
2. deploy functions
3. seed admin masters and verified prices
4. build and deploy hosting
5. run a staging smoke test with real auth and uploads
