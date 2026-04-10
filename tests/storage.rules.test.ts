import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import fs from 'node:fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'bharat-makaan-test',
    storage: {
      rules: fs.readFileSync('storage.rules', 'utf8'),
    },
    firestore: {
      rules: fs.readFileSync('firestore/firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('storage rules', () => {
  it('blocks unauthenticated writes', async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    const ref = storage.ref('projects/p1/floorplans/u1/test.png');
    await assertFails(ref.putString('x', 'raw', { contentType: 'image/png' }));
  });
});
