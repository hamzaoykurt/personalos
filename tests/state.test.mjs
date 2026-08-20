import assert from "node:assert/strict";
import test from "node:test";
import { createSeedState } from "../lib/seed.ts";
import { migrateState, projectProgress } from "../lib/state.ts";

test("derives project progress from subtasks", () => {
  assert.equal(projectProgress({ progress: 99, subtasks: [{ completed: true }, { completed: false }, { completed: true }] }), 67);
  assert.equal(projectProgress({ progress: 42, subtasks: [] }), 42);
});

test("migrates V1 state to V2 without losing records", () => {
  const current = createSeedState();
  const legacy = structuredClone(current);
  legacy.version = 1;
  delete legacy.weeklyPlans;
  delete legacy.weeklySnapshots;
  delete legacy.preferences;
  legacy.projects[0].progress = 3;

  const migrated = migrateState(legacy);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.projects.length, current.projects.length);
  assert.equal(migrated.tasks.length, current.tasks.length);
  assert.equal(migrated.notes.length, current.notes.length);
  assert.equal(migrated.projects[0].id, current.projects[0].id);
  assert.equal(migrated.projects[0].progress, 40);
  assert.ok(migrated.weeklyPlans.length > 0);
  assert.equal(migrated.preferences.weekStart, "monday");
});

test("keeps existing V2 weekly history and preferences", () => {
  const state = createSeedState();
  state.preferences.reduceMotion = true;
  state.weeklySnapshots[0].score = 88;
  const migrated = migrateState(state);
  assert.equal(migrated.preferences.reduceMotion, true);
  assert.equal(migrated.weeklySnapshots[0].score, 88);
});

test("keeps durable voice recording metadata during migration", () => {
  const state = createSeedState();
  state.activityLogs.unshift({
    id: "log-voice",
    area: "diction",
    title: "Karmaşık bir şeyi basitçe açıkla",
    date: "2026-08-21",
    duration: 6,
    score: 4,
    recording: {
      key: "voice/53bc9ff1-8f54-4e4e-a177-3699b0faf213.webm",
      mimeType: "audio/webm;codecs=opus",
      size: 2048,
      durationSeconds: 361,
    },
  });
  const migrated = migrateState(state);
  assert.deepEqual(migrated.activityLogs[0].recording, state.activityLogs[0].recording);
});
