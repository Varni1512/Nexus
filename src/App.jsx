import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, ExternalLink } from 'lucide-react';

function VoiceMate() {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);

  useEffect(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
      } else {
        setError('Speech recognition is not supported in this browser');
      }
    } catch (err) {
      setError('Failed to initialize speech recognition');
      console.error('Speech Recognition Error:', err);
    }
  }, []);

  const speak = useCallback((text) => {
    if (isMuted) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech Synthesis Error:', err);
    }
  }, [isMuted]);

  const handleCommand = useCallback((command) => {
    const lowerCommand = command.toLowerCase().trim();
    console.log('Processing command:', lowerCommand);

    // Handle website opening commands
    if (lowerCommand.includes('open')) {
      const sites = {
        instagram: 'https://instagram.com',
        facebook: 'https://facebook.com',
        whatsapp: 'https://web.whatsapp.com',
        twitter: 'https://twitter.com',
        linkedin: 'https://linkedin.com',
        youtube: 'https://youtube.com'
      };

      for (const [site, url] of Object.entries(sites)) {
        if (lowerCommand.includes(site)) {
          window.open(url, '_blank');
          speak(`Opening ${site}`);
          setFeedback(`Opening ${site}...`);
          return;
        }
      }
    }

    // Handle "thank you" command - just stops listening without closing
    if (lowerCommand.includes('thank you')) {
      speak("You're welcome! I'm here whenever you need me!");
      setFeedback("Ready for your next command...");
      setIsListening(false);
      return;
    }

    // Handle song requests
    if (lowerCommand.includes('play')) {
      const songQuery = lowerCommand.replace('play', '').trim();
      if (songQuery) {
        const youtubeMusicUrl = `https://music.youtube.com/search?q=${encodeURIComponent(songQuery)}`;
        window.open(youtubeMusicUrl, '_blank');
        speak(`Playing ${songQuery} on YouTube Music`);
        setFeedback(`Playing "${songQuery}" on YouTube Music...`);
        return;
      }
    }

    // Handle any other question with Google search
    if (lowerCommand.length > 0) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(lowerCommand)}`;
      window.open(searchUrl, '_blank');
      speak(`Searching for ${lowerCommand}`);
      setFeedback(`Searching Google for "${lowerCommand}"...`);
      return;
    }

    speak("I'm sorry, I didn't understand that command");
    setFeedback("Command not recognized");
  }, [speak]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported');
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current.stop();
        speak('Stopped listening');
      } else {
        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setError('');
          speak('Yes Boss...');
        };

        recognitionRef.current.onresult = (event) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          console.log('Transcript:', transcriptText);
          setTranscript(transcriptText);

          if (event.results[current].isFinal) {
            handleCommand(transcriptText);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Recognition error:', event.error);
          setError(`Error: ${event.error}`);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          if (isListening) {
            recognitionRef.current.start();
          }
        };

        recognitionRef.current.start();
      }
    } catch (err) {
      console.error('Toggle listening error:', err);
      setError('Failed to toggle voice recognition');
      setIsListening(false);
    }
  }, [isListening, speak, handleCommand]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-teal-800 text-white p-4">
      <div className="max-w-3xl w-full mx-auto"> {/* Increased width */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-10 shadow-xl w-full"
        >

          <h1 className="text-4xl font-bold text-center mb-8">Nexus</h1>

          <div className="flex flex-col items-center gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <button
                onClick={toggleListening}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                  }`}
              >
                {isListening ? (
                  <Mic className="w-12 h-12" />
                ) : (
                  <MicOff className="w-12 h-12" />
                )}
              </button>

              {isListening && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute -inset-2 rounded-full border-2 border-red-500 opacity-50"
                />
              )}
            </motion.div>

            {error && (
              <div className="w-full max-w-lg bg-red-500/20 rounded-lg p-4 text-center">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            <div className="w-full max-w-lg bg-white/5 rounded-lg p-4 min-h-[100px]">
              <p className="text-gray-300 mb-2">Transcript:</p>
              <p className="text-lg">{transcript || 'Say something...'}</p>
            </div>

            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-lg"
              >
                {feedback}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default VoiceMate;