// Audio helpers — Howler-backed, mute by default until user opts in.
// PLACEHOLDER: public/sounds/levelup.mp3 needs to be produced (~600ms soft "ding").

import { Howl } from "howler";

const MUTE_KEY = "anomalo:audio:muted";

let levelupSound: Howl | null = null;

const getLevelup = (): Howl | null => {
  if (typeof window === "undefined") return null;
  if (!levelupSound) {
    levelupSound = new Howl({
      src: ["/sounds/levelup.mp3"],
      volume: 0.4,
      preload: true,
      onloaderror: () => {
        // file may not be present yet (placeholder asset) — fail silent
      },
    });
  }
  return levelupSound;
};

export const playLevelUp = () => {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MUTE_KEY) === "true") return;
  const s = getLevelup();
  if (s) s.play();
};

export const isAudioMuted = () => {
  if (typeof window === "undefined") return true;
  // default: muted on first visit (user must opt in)
  const v = localStorage.getItem(MUTE_KEY);
  return v === null ? true : v === "true";
};

export const setAudioMuted = (muted: boolean) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(MUTE_KEY, muted ? "true" : "false");
};
