"use client";
import { useSyncExternalStore } from "react";
import type { State, Audit } from "./types";

const KEY = "bulldog.v1";
export const EMPTY: State = { docs: [], items: [], card: [], usage: [], findings: [], audit: [] };

let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

export function getState(): State {
  load();
  return state;
}

export function setState(fn: (s: State) => State) {
  const next = fn(getState());
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useStore(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getState,
    () => EMPTY
  );
}

export function uid(prefix = "id") {
  return prefix + "_" + Math.random().toString(36).slice(2, 10);
}

export function logAudit(s: State, actor: string, event: string, detail: string): State {
  const a: Audit = { id: uid("aud"), at: new Date().toISOString(), actor, event, detail };
  return { ...s, audit: [a, ...s.audit] };
}

export function resetAll() {
  setState(() => EMPTY);
}

export const money = (n: number) =>
  "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const money0 = (n: number) =>
  "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
