# Bharat Makaan V2.9 deployment guide

## 1. Frontend environment
Create `.env` from `.env.example` and set:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_APPCHECK_SITE_KEY` if App Check is enabled
- `VITE_FUNCTIONS_REGION`

## 2. Firebase setup
- Enable **Phone** sign-in.
- Add only required authorized domains.
- Configure App Check for web.
- Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 3. Functions environment
Inside `functions/`, create `.env.local` for emulator work or set real env in Firebase.
Required:
- `OPENAI_API_KEY`
Optional:
- `OPENAI_MODEL_ANALYSIS`
- `OPENAI_MODEL_MARKET`
- `OPENAI_MODEL_QUOTES`
- `OPENAI_MODEL_SITE`
- `OPENAI_MODEL_FLOORPLAN`
- `ENFORCE_APP_CHECK=true`

Deploy functions:

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

## 4. Hosting
Build the web app:

```bash
npm install
npm run build
firebase deploy --only hosting
```

## 5. Release checklist
- Seed admin masters first.
- Add verified supplier rates before using market numbers in production.
- Test phone auth with real devices and Firebase test numbers.
- Test print/export from saved DB records.
- Test floor-plan upload permissions and cleanup.
