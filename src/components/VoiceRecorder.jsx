import React, { useState, useEffect, useRef } from 'react';
import { IconButton, Tooltip, Badge, Typography, Box } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';

const VoiceRecorder = ({ onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [seconds, setSeconds] = useState(0);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event) => {
      let currentText = '';
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);
    };

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleToggleRecord = () => {
    if (isRecording) {
      recognitionRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      if (transcript.trim()) {
        onSave(transcript, seconds);
        setTranscript("");
        setSeconds(0);
      }
    } else {
      setTranscript("");
      setSeconds(0);
      recognitionRef.current.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {isRecording && (
        <Typography 
          variant="body2" 
          sx={{ 
            fontFamily: 'monospace', 
            color: 'error.main', 
            fontWeight: 'bold',
            animation: 'pulse 1.5s infinite' 
          }}
        >
          {formatTime(seconds)}
        </Typography>
      )}
      <Tooltip title={isRecording ? "Stop & Save" : "Start Recording"}>
        <IconButton color={isRecording ? "error" : "inherit"} onClick={handleToggleRecord}>
          <Badge variant="dot" color="error" invisible={!isRecording}>
            {isRecording ? <StopIcon /> : <MicIcon />}
          </Badge>
        </IconButton>
      </Tooltip>
      <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
    </Box>
  );
};

export default VoiceRecorder;