"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type SR = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: any) => void) | null; onend: (() => void) | null; onerror: ((e: any) => void) | null;
  start(): void; stop(): void;
};

/**
 * Browser speech-to-text (Chrome/Safari). Phone browsers end a session on any pause,
 * so we keep restarting until the user taps stop and stitch the pieces together.
 * `supported` is false elsewhere; typing still works.
 */
export function useDictation(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [live, setLive] = useState("");
  const [supported, setSupported] = useState(false);
  const rec = useRef<SR | null>(null);
  const want = useRef(false);       // user hasn't tapped stop
  const acc = useRef("");           // text from sessions that already ended
  const sess = useRef("");          // final text of the current session
  const empties = useRef(0);        // consecutive sessions with no speech
  const cb = useRef(onFinal);
  cb.current = onFinal;

  useEffect(() => {
    const w = window as any;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const begin = useCallback(() => {
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const r: SR = new Ctor();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = true;
    sess.current = "";
    r.onresult = (e: any) => {
      let fin = "", interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t + " "; else interim += t;
      }
      sess.current = fin;
      setLive((acc.current + fin + interim).trim());
    };
    r.onerror = (e: any) => {
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") want.current = false;
    };
    r.onend = () => {
      const got = sess.current.trim();
      if (got) { acc.current += got + " "; empties.current = 0; } else empties.current++;
      if (want.current && empties.current < 3) {
        try { begin(); return; } catch { /* fall through and finish */ }
      }
      want.current = false;
      setListening(false);
      const text = acc.current.trim();
      acc.current = "";
      setLive("");
      if (text) cb.current(text);
    };
    rec.current = r;
    r.start();
  }, []);

  const start = useCallback(() => {
    want.current = true; acc.current = ""; empties.current = 0;
    setListening(true);
    begin();
  }, [begin]);

  const stop = useCallback(() => { want.current = false; rec.current?.stop(); }, []);
  return { listening, live, supported, start, stop };
}
