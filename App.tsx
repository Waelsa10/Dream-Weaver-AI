import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DreamState, type DreamData, type ChatMessage } from './types';
import { generateDreamAnalysis, getChatResponse } from './services/geminiService';
import VoiceRecorder from './components/VoiceRecorder';
import DreamDisplay from './components/DreamDisplay';
import LoadingAnalysis from './components/LoadingAnalysis';
import { StarsIcon } from './components/Icons';

// SpeechRecognition might be prefixed in some browsers
// FIX: Cast window to `any` to access non-standard SpeechRecognition APIs and type recognition instance as `any` to avoid name collision.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any | null = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
}

const App: React.FC = () => {
  const [dreamState, setDreamState] = useState<DreamState>(DreamState.IDLE);
  const [dreamData, setDreamData] = useState<DreamData | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  
  const finalTranscriptRef = useRef('');

  const resetState = () => {
    setDreamState(DreamState.IDLE);
    setDreamData(null);
    setChatHistory([]);
    setError(null);
    setTranscript('');
    finalTranscriptRef.current = '';
  };

  const handleStartRecording = () => {
    if (!recognition) {
      setError("Speech recognition is not supported in your browser.");
      setDreamState(DreamState.ERROR);
      return;
    }
    setTranscript('');
    finalTranscriptRef.current = '';
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscriptChunk = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptChunk += transcriptChunk;
        } else {
          interimTranscript += transcriptChunk;
        }
      }
      finalTranscriptRef.current += finalTranscriptChunk;
      setTranscript(finalTranscriptRef.current + interimTranscript);
    };
    recognition.start();
    setDreamState(DreamState.RECORDING);
  };

  const handleStopRecording = useCallback(async () => {
    if (recognition) {
        recognition.stop();
    }
    setDreamState(DreamState.ANALYZING);

    const finalTranscript = finalTranscriptRef.current.trim();
    if (finalTranscript.length < 10) {
        setError("Dream recording is too short. Please try again and describe your dream in more detail.");
        setDreamState(DreamState.ERROR);
        return;
    }

    try {
      const result = await generateDreamAnalysis(finalTranscript);
      setDreamData({ transcript: finalTranscript, ...result });
      setDreamState(DreamState.COMPLETE);
    } catch (e) {
      console.error(e);
      setError("Failed to analyze the dream. The spirits are troubled. Please try again.");
      setDreamState(DreamState.ERROR);
    }
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!dreamData) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: message }];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    try {
      const modelResponse = await getChatResponse(dreamData.transcript, dreamData.interpretation, newHistory);
      setChatHistory([...newHistory, { role: 'model', text: modelResponse }]);
    } catch (e) {
      console.error(e);
      setChatHistory([...newHistory, { role: 'model', text: "I'm sorry, I lost my train of thought. Could you ask that again?" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderContent = () => {
    switch (dreamState) {
      case DreamState.RECORDING:
        return <VoiceRecorder isRecording={true} stopRecording={handleStopRecording} transcript={transcript} />;
      case DreamState.ANALYZING:
        return <LoadingAnalysis />;
      case DreamState.COMPLETE:
        if (dreamData) {
          return <DreamDisplay
            dreamData={dreamData}
            chatHistory={chatHistory}
            onSendMessage={handleSendMessage}
            isChatLoading={isChatLoading}
            onNewDream={resetState}
            />;
        }
        return null;
      case DreamState.ERROR:
        return (
          <div className="text-center p-8 flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold text-red-400 mb-4">An Error Occurred</h2>
            <p className="text-slate-300 mb-6">{error}</p>
            <button
              onClick={resetState}
              className="px-6 py-3 bg-indigo-600 rounded-full text-white font-semibold hover:bg-indigo-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      case DreamState.IDLE:
      default:
        return <VoiceRecorder isRecording={false} startRecording={handleStartRecording} />;
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
        <header className="text-center py-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center gap-3">
            <StarsIcon/> Dream Weaver AI
          </h1>
          <p className="text-slate-400 mt-2">Record your dream, unveil its meaning.</p>
        </header>
        <div className="bg-slate-800/50 rounded-2xl shadow-2xl shadow-indigo-900/20 border border-slate-700 flex-grow flex flex-col min-h-[60vh]">
          {renderContent()}
        </div>
        <footer className="text-center py-4 text-xs text-slate-500">
            Powered by Gemini
        </footer>
      </div>
    </main>
  );
};

export default App;
