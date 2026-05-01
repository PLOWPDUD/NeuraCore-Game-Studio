import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Play, Square, Code, MonitorPlay, Sparkles, FolderTree, 
  Settings, Send, Loader2, Maximize2, ChevronDown, Download, 
  PanelLeft, PanelRight, Box, Layers, Pickaxe, Menu 
} from 'lucide-react';
import { useGameEngine } from '../store/GameEngineStore';
import { cn } from '../lib/utils';
import Editor from '@monaco-editor/react';

export function GameEngineUI() {
  const { 
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
  } = useGameEngine();

  const [promptInput, setPromptInput] = useState('');
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<'ai' | 'console' | 'animation'>('ai');

  const parsedEntities = useMemo(() => {
    const entities: { name: string; type: string; icon: string }[] = [];
    const uniqueNames = new Set<string>();

    const patterns = [
      { regex: /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:new\s+)?THREE\.([a-zA-Z0-9_]+)/g, type: '3D Node', icon: '○' },
      { regex: /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:Matter\.)?Bodies\.([a-zA-Z0-9_]+)/g, type: '2D RigidBody', icon: '□' },
      { regex: /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:new\s+)?CANNON\.([a-zA-Z0-9_]+)/g, type: '3D RigidBody', icon: '●' },
      { regex: /function\s+([a-zA-Z0-9_]+)\s*\(/g, type: 'Function', icon: 'ƒ' }
    ];

    for (const { regex, type, icon } of patterns) {
      const matches = [...code.matchAll(regex)];
      for (const m of matches) {
        if (!uniqueNames.has(m[1])) {
          uniqueNames.add(m[1]);
          entities.push({ name: m[1], type: m[2] ? `${type} (${m[2]})` : type, icon });
        }
      }
    }

    return entities;
  }, [code]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CONSOLE_MSG') {
        addLog({
          id: Math.random().toString(36).substr(2, 9),
          type: event.data.level,
          message: event.data.payload,
          time: new Date()
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addLog]);

  const handleSend = () => {
    if (promptInput.trim()) {
      sendPrompt(promptInput);
      setPromptInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertPromptFocus = (text: string) => {
    setMobileTab('viewport'); 
    setPromptInput(text);
  };

  const getProcessedCode = (rawCode: string) => {
    // Auto-fix the mapSize property bug that might be saved in user's state
    let fixedCode = rawCode
      .replace(/dirLight\.shadow\.mapSize\.width\s*=\s*1024;\s*dirLight\.shadow\.mapSize\.height\s*=\s*1024;/g, 'dirLight.shadow.mapSize.set(1024, 1024);')
      .replace(/dirLight\.shadow\.mapSize\.width\s*=/g, '// mapSize.width =')
      .replace(/dirLight\.shadow\.mapSize\.height\s*=/g, '// mapSize.height =');

    const errorScript = `<script>
      (function() {
        const methods = ['log', 'error', 'warn', 'info'];
        methods.forEach(method => {
          const original = console[method];
          console[method] = function(...args) {
            const payload = args.map(a => {
              if (typeof a === 'object') {
                try {
                  return JSON.stringify(a);
                } catch (e) {
                  return String(a) + ' [Object]';
                }
              }
              return String(a);
            }).join(' ');
            window.parent.postMessage({ type: 'CONSOLE_MSG', level: method, payload }, '*');
            if (original) original.apply(console, args);
          };
        });
        window.onerror = function(msg, url, lineNo, columnNo, error) {
          window.parent.postMessage({ type: 'CONSOLE_MSG', level: 'error', payload: msg + ' at line ' + lineNo }, '*');
          const err = document.createElement('div');
          err.style.cssText = 'position: absolute; top: 10px; left: 10px; right: 10px; background: rgba(220, 38, 38, 0.95); color: white; padding: 12px; border-radius: 8px; z-index: 99999; font-family: monospace; border: 1px solid #f87171; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); pointer-events: none;';
          err.innerHTML = '<strong>⚠️ JavaScript Error</strong><br><br>' + msg + '<br><span style="font-size: 0.8em; opacity: 0.8;">Line: ' + lineNo + '</span>';
          document.body.appendChild(err);
          return false;
        };
      })();
    </script>`;
    
    if (fixedCode.includes('<head>')) {
      return fixedCode.replace('<head>', '<head>' + errorScript);
    }
    return errorScript + fixedCode;
  };

  const [homeName, setHomeName] = useState('');

  if (!projectName) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#020617] text-slate-300 font-sans items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03),transparent_50%)]" />
        
        <div className="z-10 bg-slate-900 border border-slate-700 p-8 rounded-xl shadow-2xl max-w-sm w-full mx-4 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
            <div className="w-8 h-8 bg-white rotate-45 rounded-sm"></div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">NEURACORE</h1>
          <p className="text-slate-400 text-sm mb-8 text-center">Enter a name for your new project to begin generating.</p>
          
          <input 
            type="text" 
            placeholder="Project Name..."
            value={homeName}
            onChange={e => setHomeName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            onKeyDown={e => {
              if (e.key === 'Enter' && homeName.trim()) {
                setProjectName(homeName.trim());
              }
            }}
          />
          
          <button 
            disabled={!homeName.trim()}
            onClick={() => setProjectName(homeName.trim())}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center shadow-lg"
          >
            Create Project <Play className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#020617] text-slate-300 font-sans overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-slate-800 bg-[#0a0f1e] flex items-center justify-between px-2 md:px-4 z-20 flex-shrink-0 relative">
        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-white rotate-45"></div>
            </div>
            <span className="font-bold text-white tracking-tight text-sm hidden sm:inline-block">NEURACORE <span className="text-indigo-400 font-normal">ENGINE</span> <span className="text-slate-500 text-xs ml-2 font-normal hidden lg:inline-block">- {projectName}</span></span>
          </div>
          <nav className="hidden md:flex gap-4 text-xs font-medium text-slate-400 relative">
            <div className="relative">
              <span onClick={() => setFileMenuOpen(!fileMenuOpen)} className="hover:text-white cursor-pointer transition-colors flex items-center">File <ChevronDown className="w-3 h-3 ml-1" /></span>
              {fileMenuOpen && (
                <div className="absolute top-full mt-2 left-0 w-36 bg-slate-900 border border-slate-700 rounded shadow-xl py-1 z-50">
                  <button onClick={() => { loadTemplate('2D'); setFileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-600 hover:text-white text-slate-300 transition-colors">New 2D Project</button>
                  <button onClick={() => { loadTemplate('3D'); setFileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-600 hover:text-white text-slate-300 transition-colors">New 3D Project</button>
                  <button onClick={() => { exportGame(); setFileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-700 text-slate-300 border-t border-slate-800 mt-1 pt-1 flex items-center transition-colors"><Download className="w-3 h-3 mr-1"/> Export HTML</button>
                </div>
              )}
            </div>
            <span onClick={() => insertPromptFocus('Edit the current script to...')} className="hover:text-white cursor-pointer transition-colors">Edit</span>
            <span onClick={() => insertPromptFocus('Add a new asset to the project...')} className="hover:text-white cursor-pointer transition-colors">Assets</span>
            <span className="hover:text-white cursor-pointer text-indigo-400 transition-colors">AI Generation</span>
            <span className="hover:text-white cursor-pointer transition-colors">Window</span>
          </nav>
          
          {/* Mobile Hamburger Menu */}
          <div className="md:hidden relative ml-2">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 text-slate-400 hover:text-white transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            {mobileMenuOpen && (
               <div className="absolute top-full mt-2 left-0 w-48 bg-slate-900 border border-slate-700 rounded shadow-xl py-1 z-50 flex flex-col">
                  {/* File Items */}
                  <div className="px-3 py-1 font-bold text-slate-500 text-[10px] uppercase">File</div>
                  <button onClick={() => { loadTemplate('2D'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-1.5 text-xs hover:bg-slate-800 text-slate-300">New 2D Project</button>
                  <button onClick={() => { loadTemplate('3D'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-1.5 text-xs hover:bg-slate-800 text-slate-300">New 3D Project</button>
                  <button onClick={() => { exportGame(); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-1.5 text-xs hover:bg-slate-800 text-slate-300 flex items-center"><Download className="w-3 h-3 mr-1"/> Export HTML</button>
                  <div className="border-t border-slate-800 my-1"></div>
                  <button onClick={() => { insertPromptFocus('Edit the current script to...'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-1.5 text-xs hover:bg-slate-800 text-slate-300">Edit</button>
                  <button onClick={() => { insertPromptFocus('Add a new asset to the project...'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-1.5 text-xs hover:bg-slate-800 text-slate-300">Assets</button>
                  <button onClick={() => { setMobileMenuOpen(false); }} className="w-full text-left px-4 py-1.5 text-xs hover:bg-slate-800 text-indigo-400">AI Generation</button>
                  <button className="w-full text-left px-4 py-1.5 text-xs hover:bg-slate-800 text-slate-300">Window</button>
               </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center space-x-1 p-0.5 bg-slate-900 rounded border border-slate-700">
            <button
              onClick={() => setViewMode('viewport')}
              className={cn(
                "flex items-center px-3 py-1 font-medium transition-all text-[10px] uppercase border-r border-slate-700 tracking-wider",
                viewMode === 'viewport' ? "bg-slate-800 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <MonitorPlay className="w-3 h-3 mr-2" /> Viewport
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={cn(
                "flex items-center px-3 py-1 font-medium transition-all text-[10px] uppercase tracking-wider",
                viewMode === 'code' ? "bg-slate-800 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <Code className="w-3 h-3 mr-2" /> Code
            </button>
          </div>

          <div className="flex bg-slate-900 rounded overflow-hidden border border-slate-700">
            <button className="px-3 py-1 hover:bg-slate-800 border-r border-slate-700 text-[10px]">◀</button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={cn(
                "px-4 py-1 font-bold text-white text-[10px] flex items-center transition-colors uppercase",
                isRunning 
                  ? "bg-red-600 hover:bg-red-500" 
                  : "bg-indigo-600 hover:bg-indigo-500"
              )}
            >
              {isRunning ? (
                <><Square className="w-3 h-3 mr-2 fill-current" /> STOP</>
              ) : (
                <><Play className="w-3 h-3 mr-2 fill-current" /> PLAY</>
              )}
            </button>
            <button className="px-3 py-1 hover:bg-slate-800 border-l border-slate-700 text-[10px]">❚❚</button>
          </div>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20"></div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Scene Hierarchy */}
        <aside className={cn(
          "w-full md:w-60 border-r border-slate-800 bg-[#050a18] flex-col flex-shrink-0",
          mobileTab === 'scene' ? 'flex' : 'hidden md:flex'
        )}>
          <div className="p-3 text-[10px] uppercase tracking-widest font-bold text-slate-500 border-b border-slate-800 flex-shrink-0 flex items-center justify-between">
            <span>Scene Tree</span>
            <Layers className="w-3 h-3" />
          </div>
          <div className="flex-1 p-2 font-mono text-[11px] overflow-y-auto">
            <div className="flex items-center gap-2 p-1 text-slate-500">▼ World_Root</div>
            {parsedEntities.map((entity, i) => (
              <div 
                key={i} 
                onClick={() => insertPromptFocus(`Modify ${entity.name}...`)} 
                className="flex items-center gap-2 p-1 pl-4 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                title={`${entity.name} (${entity.type})`}
              >
                <span className="w-3 text-center opacity-80">{entity.icon}</span>
                <span className="truncate flex-1 max-w-[120px]">{entity.name}</span>
                {entity.type.includes('RigidBody') && <span className="text-[8px] text-indigo-400 bg-indigo-900/30 px-1 rounded ml-auto flex-shrink-0">Physics</span>}
              </div>
            ))}
            {parsedEntities.length === 0 && (
              <div className="p-2 pl-4 text-slate-600 italic text-[10px]">No recognized constructs.</div>
            )}
          </div>
          <div className="p-3 bg-[#0a0f1e] border-t border-slate-800 flex flex-col h-40 flex-shrink-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Assets</span>
              <span onClick={() => insertPromptFocus('Import a new asset (e.g. 3D model, sound)...')} className="text-[10px] text-indigo-400 cursor-pointer hover:text-indigo-300">Import +</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-12 bg-slate-900 rounded border border-slate-800"></div>
              <div className="h-12 bg-slate-900 rounded border border-slate-800"></div>
              <div className="h-12 bg-slate-900 rounded border border-slate-800"></div>
              <div className="h-12 bg-slate-900 rounded border border-slate-800"></div>
              <div className="h-12 bg-slate-900 rounded border border-slate-800"></div>
            </div>
          </div>
        </aside>

        {/* Main Viewport and Console */}
        <section className={cn(
          "flex-1 flex flex-col relative bg-[#020617] shadow-inner min-w-0",
          (mobileTab === 'viewport' || mobileTab === 'code') ? 'flex' : 'hidden md:flex'
        )}>
          
          <div className="flex-1 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] flex flex-col overflow-hidden">
            <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
              <div className="bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded text-[11px] flex items-center gap-2 shadow-sm font-mono text-slate-300">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                RENDERER: WEBGL {viewMode === 'code' ? '(PAUSED)' : '2.0'}
              </div>
              <div className="bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded text-[11px] shadow-sm font-mono text-slate-300">
                60.0 FPS
              </div>
            </div>
            
            {viewMode === 'viewport' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                {isRunning ? (
                  <iframe
                    title="Game Viewport"
                    srcDoc={getProcessedCode(code)}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-downloads allow-pointer-lock"
                  />
                ) : (
                  <div className="text-slate-600 flex flex-col items-center">
                    <Square className="w-12 h-12 mb-4 opacity-50" />
                    <p className="font-mono text-xs">Engine Paused. Click Play to start.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0">
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => setCode(val || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                      wordWrap: 'on',
                      padding: { top: 48 }, // give room for top-left stats
                      scrollBeyondLastLine: false,
                    }}
                  />
              </div>
            )}
          </div>

          {/* Bottom AI Console Panel */}
          <div className="h-64 bg-[#0a0f1e]/90 backdrop-blur-xl border-t border-slate-800 p-4 flex flex-col flex-shrink-0">
            <div className="flex gap-4 mb-3 border-b border-slate-800 pb-2">
              <button 
                onClick={() => setBottomTab('ai')}
                className={cn("text-xs font-bold pb-1 transition-colors", bottomTab === 'ai' ? "text-white border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-300")}
              >
                AI CO-PILOT
              </button>
              <button 
                onClick={() => setBottomTab('console')}
                className={cn("text-xs font-bold pb-1 transition-colors", bottomTab === 'console' ? "text-white border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-300")}
              >
                CONSOLE {logs.length > 0 && `(${logs.length})`}
              </button>
              <button 
                onClick={() => setBottomTab('animation')}
                className={cn("text-xs font-bold pb-1 transition-colors", bottomTab === 'animation' ? "text-white border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-300")}
              >
                ANIMATION
              </button>
            </div>
            
            <div className="flex-1 bg-black/30 rounded p-3 font-mono text-xs flex flex-col border border-slate-800 shadow-inner overflow-hidden">
               {bottomTab === 'ai' && (
                 <>
                   <div className="flex-1 overflow-y-auto space-y-3 pb-3 pr-2">
                      {messages.map((msg, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          {msg.role === 'assistant' ? (
                            <span className="text-purple-400 flex-shrink-0">[SYSTEM]</span>
                          ) : (
                            <span className="text-indigo-400 flex-shrink-0">[USER]</span>
                          )}
                          <span className={msg.role === 'assistant' ? 'text-slate-400 opacity-90' : 'text-indigo-200'}>
                            {msg.content}
                          </span>
                        </div>
                      ))}
                      {isGenerating && (
                        <div className="flex gap-2 items-start">
                          <span className="text-purple-400 flex-shrink-0">[SYSTEM]</span>
                          <span className="text-slate-400 opacity-90 flex items-center">
                             <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Neural Core processing request...
                          </span>
                        </div>
                      )}
                   </div>

                   <div className="mt-2 flex gap-2 items-center bg-black/40 border border-slate-700/50 rounded overflow-hidden pl-2 relative flex-shrink-0">
                      <span className="text-indigo-400 text-xs font-bold">&gt;</span>
                      <input 
                        type="text" 
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isGenerating}
                        placeholder="Describe game mechanic, environment, or asset to generate..." 
                        className="flex-1 bg-transparent border-none outline-none text-white text-xs h-8 placeholder:text-slate-600 px-1 disabled:opacity-50"
                      />
                      <button 
                        onClick={handleSend}
                        disabled={isGenerating || !promptInput.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 px-4 h-8 text-[10px] font-bold text-white transition-colors disabled:bg-slate-800 disabled:text-slate-500"
                      >
                        GENERATE
                      </button>
                   </div>
                 </>
               )}

               {bottomTab === 'console' && (
                 <div className="flex-1 flex flex-col h-full bg-black/50 rounded overflow-hidden">
                   <div className="flex justify-between items-center p-2 border-b border-slate-800 bg-slate-900/50">
                     <span className="text-slate-400 font-bold">Runtime Logs</span>
                     <button onClick={clearLogs} className="text-slate-500 hover:text-white transition-colors">Clear</button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-2 space-y-1">
                     {logs.length === 0 ? (
                       <div className="text-slate-600 italic">No logs...</div>
                     ) : (
                       logs.map((log) => (
                         <div key={log.id} className="flex gap-2 items-start">
                           <span className="text-slate-600 flex-shrink-0">
                             {log.time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                           </span>
                           <span className={cn(
                             "flex-1 whitespace-pre-wrap break-all",
                             log.type === 'error' ? "text-red-400" :
                             log.type === 'warn' ? "text-yellow-400" :
                             "text-slate-300"
                           )}>
                             {log.message}
                           </span>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               )}

               {bottomTab === 'animation' && (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <Layers className="w-8 h-8 mb-2 opacity-50" />
                    <span>Animation Graph Viewer (Alpha) requires Node Setup</span>
                 </div>
               )}
            </div>
          </div>
        </section>

        {/* Inspector Sidebar */}
        <aside className={cn(
          "w-full md:w-72 border-l border-slate-800 bg-[#050a18] flex-col flex-shrink-0",
          mobileTab === 'inspector' ? 'flex' : 'hidden md:flex'
        )}>
          <div className="p-3 text-[10px] uppercase tracking-widest font-bold text-slate-500 border-b border-slate-800 flex-shrink-0 flex justify-between items-center">
            <span>Inspector</span>
            <Settings className="w-3 h-3" />
          </div>
          <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
            <div>
              <label className="text-[10px] text-slate-500 uppercase block mb-1">Transform</label>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900 rounded p-1 text-[10px] border border-slate-800 text-center font-mono">X: 0.00</div>
                <div className="bg-slate-900 rounded p-1 text-[10px] border border-slate-800 text-center font-mono">Y: 1.42</div>
                <div className="bg-slate-900 rounded p-1 text-[10px] border border-slate-800 text-center font-mono">Z: 0.00</div>
              </div>
            </div>
            
            <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-lg p-3">
              <label className="text-[10px] text-indigo-400 uppercase font-bold block mb-2">AI Script Properties</label>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Game Speed</span>
                  <input type="range" className="w-24 accent-indigo-500" defaultValue="50"/>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Gravity Scale</span>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-indigo-300 border border-slate-800">0.98</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="accent-indigo-500" />
                  <span className="text-xs">Enable Post-Processing</span>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <label className="text-[10px] text-slate-500 uppercase block mb-2">Component List</label>
              <div className="space-y-2">
                <div onClick={() => insertPromptFocus('Change the color or material of the MeshRenderer...')} className="bg-slate-900/50 p-2 rounded text-[11px] border border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-800 text-slate-300 transition-colors">
                  <span>MeshRenderer</span>
                  <Settings className="w-3 h-3 text-slate-500" />
                </div>
                <div onClick={() => insertPromptFocus('Adjust the BoxCollider3D size to...')} className="bg-slate-900/50 p-2 rounded text-[11px] border border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-800 text-slate-300 transition-colors">
                  <span>BoxCollider3D</span>
                  <Settings className="w-3 h-3 text-slate-500" />
                </div>
                <div onClick={() => insertPromptFocus('Modify the GameLogic script to...')} className="bg-indigo-950/40 p-2 rounded text-[11px] border border-indigo-500/30 flex justify-between items-center cursor-pointer hover:bg-indigo-900/60 text-indigo-300 transition-colors">
                  <span>GameLogic_Core.gen</span>
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-800 flex-shrink-0 bg-[#0a0f1e]">
            <button onClick={() => insertPromptFocus('Add a new script or component...')} className="w-full bg-indigo-600/80 hover:bg-indigo-500 py-2 rounded text-[10px] font-bold text-white transition-colors uppercase tracking-wider flex items-center justify-center gap-2">
              <Pickaxe className="w-3 h-3" /> ADD COMPONENT
            </button>
          </div>
        </aside>
      </main>

      {/* Footer Status Bar (Desktop) */}
      <footer className="hidden md:flex h-7 bg-[#020617] border-t border-slate-800 items-center justify-between px-3 text-[10px] text-slate-500 font-mono flex-shrink-0">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> Connected to AI Core</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Scene: root_instance</span>
        </div>
        <div className="flex gap-4">
          <span>VRAM: 1.2GB / 12GB</span>
          <span className="text-green-500">Latency: 14ms</span>
        </div>
      </footer>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex bg-[#0a0f1e] border-t border-slate-800 h-14 flex-shrink-0 pb-safe z-30">
        <button onClick={() => setMobileTab('scene')} className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-colors", mobileTab === 'scene' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300')}>
          <Layers className="w-5 h-5"/>
          <span className="text-[10px] font-bold">SCENE</span>
        </button>
        <button onClick={() => { setMobileTab('viewport'); setViewMode('viewport'); }} className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-colors", mobileTab === 'viewport' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300')}>
          <Box className="w-5 h-5"/>
          <span className="text-[10px] font-bold">VIEWPORT</span>
        </button>
        <button onClick={() => { setMobileTab('code'); setViewMode('code'); }} className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-colors", mobileTab === 'code' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300')}>
          <Code className="w-5 h-5"/>
          <span className="text-[10px] font-bold">CODE</span>
        </button>
        <button onClick={() => setMobileTab('inspector')} className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-colors", mobileTab === 'inspector' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300')}>
          <Settings className="w-5 h-5"/>
          <span className="text-[10px] font-bold">INSPECTOR</span>
        </button>
      </div>
    </div>
  );
}
