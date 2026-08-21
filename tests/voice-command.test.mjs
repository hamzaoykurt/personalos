import assert from "node:assert/strict";
import test from "node:test";
import { parseVoiceCommands } from "../lib/voice-command.ts";

test("sesli görev listesini ayrı maddelere böler", () => {
  assert.deepEqual(parseVoiceCommands("Görevler: raporu gönder, toplantıyı planla ve faturayı kontrol et."), [
    { title: "raporu gönder", destination: "task" },
    { title: "toplantıyı planla", destination: "task" },
    { title: "faturayı kontrol et", destination: "task" },
  ]);
});

test("proje alt görevlerini proje kaydına bağlar", () => {
  assert.deepEqual(parseVoiceCommands("Proje: Personal OS. Alt görevler: mobil testi yap, manifesti kontrol et."), [
    { title: "Personal OS", destination: "project", subtasks: ["mobil testi yap", "manifesti kontrol et"] },
  ]);
});

test("mevcut projeye söylenen alt görevi tanır", () => {
  assert.deepEqual(parseVoiceCommands("Personal OS projesine alt görev olarak arama butonunu düzelt ekle."), [
    { title: "Personal OS", destination: "project", subtasks: ["arama butonunu düzelt"], mergeIntoExisting: true },
  ]);
});

test("açık komutları doğru bölümlere yönlendirir", () => {
  assert.deepEqual(parseVoiceCommands("Not: karanlık temada kontrastı kontrol et. Alınacaklar: kahve, filtre."), [
    { title: "karanlık temada kontrastı kontrol et", destination: "note" },
    { title: "kahve", destination: "purchase" },
    { title: "filtre", destination: "purchase" },
  ]);
});
