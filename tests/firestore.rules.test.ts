import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import fs from 'node:fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'bharat-makaan-test',
    firestore: {
      rules: fs.readFileSync('firestore/firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('firestore rules', () => {
  it('allows a signed-in user to create their own profile', async () => {
    const db = testEnv.authenticatedContext('owner-1').firestore();
    await assertSucceeds(db.collection('users').doc('owner-1').set({ uid: 'owner-1', role: 'owner', status: 'active' }));
  });

  it('blocks anonymous project creation', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('projects').add({ ownerId: 'x', memberIds: ['x'] }));
  });
});
