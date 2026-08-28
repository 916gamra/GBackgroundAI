// ─────────────────────────────────────────────────────────────────────────────
// Render smoke test: mounts the real <App/> tree with react-dom/server inside
// node (no browser) and asserts the whole component graph evaluates without
// throwing. Run with `npm run smoke`. This catches broken wiring/imports that
// type-checking cannot see (undefined components, bad lazy() shapes, top-level
// DOM access in module scope, …).
// ─────────────────────────────────────────────────────────────────────────────
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => Array.from(store.keys())[i] ?? null,
  get length() { return store.size; }
};
(globalThis as any).sessionStorage = (globalThis as any).localStorage;
(globalThis as any).window = globalThis;
(globalThis as any).document = {
  documentElement: { style: { setProperty() {} }, setAttribute() {}, removeAttribute() {} },
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, click() {} }),
  head: { appendChild() {} },
  getElementById: () => ({ }),
  addEventListener() {}, removeEventListener() {}
};
(globalThis as any).navigator = { clipboard: { writeText: async () => {} }, speechSynthesis: { getVoices: () => [], cancel() {}, speak() {}, addEventListener() {}, removeEventListener() {} } };
(globalThis as any).BroadcastChannel = class { constructor(_: string) {} postMessage() {} close() {} addEventListener() {} removeEventListener() {} onmessage = null; };
(globalThis as any).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
(globalThis as any).requestAnimationFrame = (cb: any) => setTimeout(() => cb(performance.now()), 0);
(globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
(globalThis as any).AudioContext = class { createAnalyser() { return { connect() {}, fftSize: 0, frequencyBinCount: 8, getByteFrequencyData(a: any) { a.set([1, 2, 3]); } }; } createMediaStreamSource() { return { connect() {}, disconnect() {} }; } get state() { return 'suspended'; } resume() { return Promise.resolve(); } };
(globalThis as any).Image = class { onload = null; onerror = null; set src(_v: string) {} };

import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App';

const html = renderToString(React.createElement(App));
if (!html || html.length < 500) { console.error('FAIL: empty render'); process.exit(1); }
const checks: Array<[string, boolean]> = [
  ['renders the shell', html.includes('GBG AI')],
  ['renders avatar engine', html.includes('svg')],
  ['renders welcome view', /Welcome|ابدأ|Start/i.test(html)],
  ['splash present', html.includes('Beast v15')]
];
let bad = 0;
for (const [name, ok] of checks) { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); }
console.log(`rendered ${html.length} chars`);
process.exit(bad ? 1 : 0);
