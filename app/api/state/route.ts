import { env } from "cloudflare:workers";
import { createSeedState } from "@/lib/seed";
import type { PersonalOSState } from "@/lib/types";

const createStateTable = `CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

async function ensureStateTable() {
  if (!env.DB) throw new Error("DB binding is unavailable");
  await env.DB.prepare(createStateTable).run();
}

export async function GET() {
  try {
    await ensureStateTable();
    const row = await env.DB.prepare("SELECT payload, updated_at FROM app_state WHERE id = ?")
      .bind(1)
      .first<{ payload: string; updated_at: string }>();

    if (row) {
      return Response.json({ state: JSON.parse(row.payload), updatedAt: row.updated_at });
    }

    const state = createSeedState();
    await env.DB.prepare(
      "INSERT INTO app_state (id, payload, version, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
    )
      .bind(1, JSON.stringify(state), state.version)
      .run();

    return Response.json({ state, updatedAt: new Date().toISOString() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Durum yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { state?: PersonalOSState };
    const state = body.state;
    if (!state || state.version !== 1 || !Array.isArray(state.projects) || !Array.isArray(state.tasks)) {
      return Response.json({ error: "Geçersiz uygulama durumu" }, { status: 400 });
    }

    await ensureStateTable();
    await env.DB.prepare(
      `INSERT INTO app_state (id, payload, version, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         payload = excluded.payload,
         version = excluded.version,
         updated_at = CURRENT_TIMESTAMP`,
    )
      .bind(1, JSON.stringify(state), state.version)
      .run();

    return Response.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Durum kaydedilemedi" },
      { status: 500 },
    );
  }
}

