import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Uses the browser's built-in speech recognition (Chrome, Edge, Safari on
// iPhone). Free, nothing sent to our servers. Hidden where unsupported.

type Recognition = any;

const getRecognition = (): Recognition | null => {
  const w = window as any;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
};

interface Props {
  /** Called with each finished phrase; append it to your text. */
  onText: (text: string) => void;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
}

export const VoiceInputButton = ({ onText, className, size = "sm" }: Props) => {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(!!getRecognition());
    return () => recRef.current?.abort?.();
  }, []);

  if (!supported) return null;

  const start = () => {
    const rec = getRecognition();
    if (!rec) return;
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) onText(e.results[i][0].transcript.trim());
      }
    };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed") toast.error("Allow microphone access to describe the job by voice.");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stop = () => {
    recRef.current?.stop();
    setListening(false);
  };

  return (
    <Button
      type="button"
      variant={listening ? "accent" : "outline"}
      size={size}
      onClick={listening ? stop : start}
      className={className}
      aria-pressed={listening}
      aria-label={listening ? "Stop dictating" : "Describe the job by voice"}
    >
      {listening ? <Square className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
      <span className="ml-1.5">{listening ? "Stop" : "Speak"}</span>
    </Button>
  );
};

/** Append a dictated phrase to existing text with sensible spacing. */
export const appendDictation = (current: string, phrase: string) => {
  if (!phrase) return current;
  const sep = current && !/\s$/.test(current) ? " " : "";
  const cap = current.trim() === "" || /[.!?]\s*$/.test(current) ? phrase.charAt(0).toUpperCase() + phrase.slice(1) : phrase;
  return current + sep + cap;
};
