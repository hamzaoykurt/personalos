import assert from "node:assert/strict";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html", host: "localhost" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Personal OS command center", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Personal OS/);
  assert.match(html, />Bugün\.</);
  assert.match(html, /Hızlı yakala/);
  assert.match(html, />Devam et</);
  assert.match(html, /Bu hafta/);
  assert.match(html, /Görevler/);
  assert.match(html, /Her yerde ara/);
  assert.doesNotMatch(html, /Bugün ne önemli\?|Aklındakini burada bırak/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("ships product-specific metadata and social preview", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /Hayat, Proje &amp; Bilgi Sistemi/);
  assert.match(html, /og\.png/);
  assert.match(html, /summary_large_image/);
});

test("server-renders every primary Personal OS section", async () => {
  const expectations = {
    "/projects": /ÜRETİM MERKEZİ/,
    "/tasks": /GÜNLÜK OPERASYON/,
    "/calendar": /ORTAK AJANDA/,
    "/career": /REACTIVATION/,
    "/work": /İŞ ALANI/,
    "/notes": /BİLGİ ARŞİVİ/,
    "/archive": /TAMAMLANANLAR/,
    "/settings": /Kayıt durumu/,
  };
  for (const [path, expectation] of Object.entries(expectations)) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), expectation, path);
  }
});

test("opens the diction recorder directly from its deep link", async () => {
  const response = await render("/career?area=diction");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Kayda başla/);
  assert.match(html, /Kayıt arşivi/);
});

test("starter preview directory is removed", async () => {
  const { access } = await import("node:fs/promises");
  await assert.rejects(access(new URL("app/_sites-preview/SkeletonPreview.tsx", templateRoot)));
  await assert.rejects(access(new URL("app/_sites-preview/preview.css", templateRoot)));
});
