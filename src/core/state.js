const listeners = [];
export const state = { mode: 'intro', target: null };

export function setMode(mode, target = null) {
  state.mode = mode;
  state.target = target;
  for (const fn of listeners) fn(state);
}

export function onModeChange(fn) { listeners.push(fn); }
