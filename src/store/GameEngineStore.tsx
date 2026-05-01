import { createContext, useContext, useState, ReactNode } from 'react';
import { DEFAULT_3D_GAME, DEFAULT_2D_GAME } from '../lib/templates';
import { generateGameCode } from '../services/aiService';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export type MobileTab = 'scene' | 'viewport' | 'code' | 'inspector';

export interface ConsoleLog {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  time: Date;
}

interface GameEngineState {
  code: string;
  setCode: (code: string) => void;
  projectName: string | null;
  setProjectName: (name: string | null) => void;
  isRunning: boolean;
  setIsRunning: (run: boolean) => void;
  isGenerating: boolean;
  messages: Message[];
  sendPrompt: (prompt: string) => Promise<void>;
  viewMode: 'viewport' | 'code';
  setViewMode: (mode: 'viewport' | 'code') => void;
  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;
  exportGame: () => void;
  loadTemplate: (type: '2D' | '3D') => void;
  logs: ConsoleLog[];
  addLog: (log: ConsoleLog) => void;
  clearLogs: () => void;
}

const GameEngineContext = createContext<GameEngineState | null>(null);

export function GameEngineProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<string>(DEFAULT_3D_GAME);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Welcome to Nexus Engine. Describe the game you want to build, or edit the code directly!' }
  ]);
  const [viewMode, setViewMode] = useState<'viewport' | 'code'>('viewport');
  const [mobileTab, setMobileTab] = useState<MobileTab>('viewport');
  const [logs, setLogs] = useState<ConsoleLog[]>([]);

  const addLog = (log: ConsoleLog) => {
    setLogs((prev) => [...prev, log]);
  };

  const clearLogs = () => setLogs([]);

  const sendPrompt = async (prompt: string) => {
    if (!prompt.trim() || isGenerating) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: prompt }];
    setMessages(newMessages);
    setIsGenerating(true);

    try {
      const generatedCode = await generateGameCode(prompt, code);
      setCode(generatedCode);
      setMessages([...newMessages, { role: 'assistant', content: 'Game code updated successfully. Check the viewport!' }]);
      setViewMode('viewport');
      setMobileTab('viewport'); // Switch to viewport on mobile when done generating
      
      // Auto-restart the game
      setIsRunning(false);
      setTimeout(() => setIsRunning(true), 100);
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: 'Failed to generate code. Check the console for details.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportGame = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus_game.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadTemplate = (type: '2D' | '3D') => {
    setCode(type === '2D' ? DEFAULT_2D_GAME : DEFAULT_3D_GAME);
    setMessages([...messages, { role: 'assistant', content: `Loaded empty ${type} template.` }]);
    setViewMode('viewport');
    setMobileTab('viewport');
  };

  return (
    <GameEngineContext.Provider value={{
      code, setCode,
      projectName, setProjectName,
      isRunning, setIsRunning,
      isGenerating,
      messages,
      sendPrompt,
      viewMode, setViewMode,
      mobileTab, setMobileTab,
      exportGame, loadTemplate,
      logs, addLog, clearLogs
    }}>
      {children}
    </GameEngineContext.Provider>
  );
}

export const useGameEngine = () => {
  const context = useContext(GameEngineContext);
  if (!context) throw new Error('useGameEngine must be used within GameEngineProvider');
  return context;
};
