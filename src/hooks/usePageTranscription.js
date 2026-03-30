import { useState, useEffect, useRef, useCallback } from "react";


export default function usePageTranscription() {
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const [isListening, setIsListening] = useState(false);

  // current page marker
  const currentPageRef = useRef(null);

  // accumulated transcripts
  const transcriptsRef = useRef({});

  // buffer for interim results on current page
  const pageStartIdxRef = useRef(0);
  const allFinalTextRef = useRef("");

  // track if initialized
  const initializedRef = useRef(false);

  const initRecognition = useCallback(() => {
    if (initializedRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      // build final text 
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + " ";
        }
      }
      allFinalTextRef.current = finalText;

      // extract text for current page
      const pageKey = currentPageRef.current;
      if (pageKey !== null) {
        const pageText = finalText.substring(pageStartIdxRef.current).trim();
        transcriptsRef.current[pageKey] = pageText;
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("PageTranscription error:", event.error);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
        }
      }
    };

    recognitionRef.current = recognition;
    initializedRef.current = true;
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) initRecognition();
    if (!recognitionRef.current) return;

    if (!isListeningRef.current) {
      isListeningRef.current = true;
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch {
      }
    }
  }, [initRecognition]);


  const markPage = useCallback(
    (pageKey) => {
      if (currentPageRef.current !== null) {
        const prevText = allFinalTextRef.current
          .substring(pageStartIdxRef.current)
          .trim();
        transcriptsRef.current[currentPageRef.current] = prevText;
      }

      currentPageRef.current = pageKey;
      pageStartIdxRef.current = allFinalTextRef.current.length;

      if (!transcriptsRef.current[pageKey]) {
        transcriptsRef.current[pageKey] = "";
      }

      if (!isListeningRef.current) {
        startListening();
      }
    },
    [startListening]
  );


  const stopAndCollect = useCallback(() => {
    if (currentPageRef.current !== null) {
      const text = allFinalTextRef.current
        .substring(pageStartIdxRef.current)
        .trim();
      transcriptsRef.current[currentPageRef.current] = text;
    }

    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
      }
    }

    const result = { ...transcriptsRef.current };

    transcriptsRef.current = {};
    currentPageRef.current = null;
    pageStartIdxRef.current = 0;
    allFinalTextRef.current = "";

    return result;
  }, []);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
        }
      }
    };
  }, []);

  return {
    markPage,
    stopAndCollect,
    isListening,
  };
}