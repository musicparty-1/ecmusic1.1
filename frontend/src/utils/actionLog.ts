export type ActionType =
  | 'EVENT_CREATED' | 'EVENT_LAUNCHED' | 'EVENT_CLOSED' | 'EVENT_DUPLICATED'
  | 'SONG_ADDED' | 'SONG_DELETED' | 'SONG_PLAYED'
  | 'VOTE_LIMIT_CHANGED' | 'RECITAL_TOGGLED' | 'LOGIN' | 'LOGOUT';

export interface ActionEntry {
  id: string;
  type: ActionType;
  label: string;
  detail?: string;
  ts: number; // timestamp ms
}

const KEY = 'mp_action_log';
const MAX = 200;

export function logAction(type: ActionType, label: string, detail?: string) {
  const entry: ActionEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    label,
    detail,
    ts: Date.now(),
  };
  try {
    const raw = localStorage.getItem(KEY);
    const list: ActionEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    if (list.length > MAX) list.splice(MAX);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* storage lleno o privado */ }
  return entry;
}

export function getActionLog(): ActionEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function clearActionLog() {
  localStorage.removeItem(KEY);
}

export const ACTION_META: Record<ActionType, { icon: string; color: string }> = {
  EVENT_CREATED:      { icon: '🎉', color: '#22c55e' },
  EVENT_LAUNCHED:     { icon: '🚀', color: '#10b981' },
  EVENT_CLOSED:       { icon: '🔒', color: '#ef4444' },
  EVENT_DUPLICATED:   { icon: '📋', color: '#a78bfa' },
  SONG_ADDED:         { icon: '🎵', color: '#8b5cf6' },
  SONG_DELETED:       { icon: '🗑️', color: '#f87171' },
  SONG_PLAYED:        { icon: '▶️', color: '#06b6d4' },
  VOTE_LIMIT_CHANGED: { icon: '🔢', color: '#f59e0b' },
  RECITAL_TOGGLED:    { icon: '🎤', color: '#ec4899' },
  LOGIN:              { icon: '🔑', color: '#64748b' },
  LOGOUT:             { icon: '👋', color: '#64748b' },
};
