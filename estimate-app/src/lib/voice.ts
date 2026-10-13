"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type SR = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: any) => void) | null; onend: (() => void) | null; onerror: ((e: any) => void) | null;
  start(): void; stop(): void;
};

/** Browser speech-to-text (Chrome/Safari). `supported` is false elsewhere; typing still works. */
export function useDictation(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [live, setLive] = useState("");
  const [supported, setSupported] = useState(false);
  const rec = useRef<SR | null>(null);
  const finalRef = useRef("");
  const cb = useRef(onFinal);
  cb.current = onFinal;

  useEffect(() => {
    const w = window as any;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const start = useCallback(() => {
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const r: SR = new Ctor();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = true;
    finalRef.current = "";
    r.onresult = (e: any) => {
      let fin = "", interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t + " "; else interim += t;
      }
      finalRef.current = fin;
      setLive((fin + interim).trim());
    };
    r.onerror = () => setListening(false);
    r.onend = () => {
      setListening(false);
      const text = (finalRef.current || "").trim();
      setLive("");
      if (text) cb.current(text);
    };
    rec.current = r;
    setListening(true);
    r.start();
  }, []);

  const stop = useCallback(() => rec.current?.stop(), []);
  return { listening, live, supported, start, stop };
}
