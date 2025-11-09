import React, { useState, useRef, useEffect } from 'react';
import { type DreamData, type ChatMessage } from '../types';
import { SendIcon, NewDreamIcon } from './Icons';
import ChatMessageBubble from './ChatMessage';

interface DreamDisplayProps {
  dreamData: DreamData;
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  isChatLoading: boolean;
  onNewDream: () => void;
}

const DreamDisplay: React.FC<DreamDisplayProps> = ({ dreamData, chatHistory, onSendMessage, isChatLoading, onNewDream }) => {
  const [userInput, setUserInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (userInput.trim()) {
      onSendMessage(userInput.trim());
      setUserInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isChatLoading) {
      handleSend();
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
      <div className="p-4 sm:p-6 flex flex-col items-center overflow-y-auto max-h-[85vh]">
        <h3 className="text-xl font-bold text-indigo-300 mb-4">Your Dream's Reflection</h3>
        <div className="w-full aspect-square max-w-md bg-slate-900 rounded-lg shadow-lg overflow-hidden mb-6">
            <img src={dreamData.imageUrl} alt="AI generated representation of the dream" className="w-full h-full object-cover" />
        </div>
        <div className="prose prose-invert prose-sm sm:prose-base max-w-none w-full bg-slate-900/50 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-indigo-300 !mt-0">Psyche's Interpretation</h3>
            {dreamData.interpretation.split('\n').map((line, index) => {
                if (line.startsWith('###') || line.startsWith('##') || line.startsWith('# ')) {
                    const headingText = line.replace(/#/g, '').trim();
                    return <h4 key={index} className="!text-lg !font-semibold !text-slate-200 !mt-4 !mb-2">{headingText}</h4>;
                }
                return <p key={index}>{line}</p>;
            })}
        </div>
        <button onClick={onNewDream} className="mt-6 flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-full text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
            <NewDreamIcon />
            Record Another Dream
        </button>
      </div>
      <div className="flex flex-col bg-slate-900/70 border-t lg:border-t-0 lg:border-l border-slate-700 h-full max-h-[85vh]">
        <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-center">Ask About Your Dream</h3>
        </div>
        <div className="flex-grow p-4 overflow-y-auto">
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <ChatMessageBubble key={index} message={msg} />
            ))}
            {isChatLoading && (
                <div className="flex justify-start">
                    <div className="bg-slate-700 rounded-lg p-3 max-w-xs lg:max-w-md animate-pulse">
                        <span className="text-sm text-slate-300">...</span>
                    </div>
                </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
        <div className="p-4 border-t border-slate-700 flex items-center gap-2">
            <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., 'What does the forest mean?'"
                className="flex-grow bg-slate-800 border border-slate-600 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isChatLoading}
            />
            <button onClick={handleSend} disabled={isChatLoading} className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                <SendIcon />
            </button>
        </div>
      </div>
    </div>
  );
};

export default DreamDisplay;
