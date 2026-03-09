import { useCallback, useState } from "react";

const STORAGE_KEY = "naturavini_wine_notes";

function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNotes(notes: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // ignore
  }
}

export function useWineNotes() {
  const [notes, setNotes] = useState<Record<string, string>>(loadNotes);

  const getNote = useCallback((id: string) => notes[id] ?? "", [notes]);

  const setNote = useCallback((id: string, text: string) => {
    setNotes((prev) => {
      const next = { ...prev };
      if (text.trim()) {
        next[id] = text.trim();
      } else {
        delete next[id];
      }
      saveNotes(next);
      return next;
    });
  }, []);

  return { getNote, setNote };
}
