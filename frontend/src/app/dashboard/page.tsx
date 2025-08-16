"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, MicOff, Loader2, Brain, BookOpen, AlertCircle, MessageSquare, Plus, Sparkles, Trash2, Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  category?: "philosophy" | "history" | "general";
  isStreaming?: boolean;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastUpdated: Date;
}

interface HealthStatus {
  status: string;
  services: {
    ollama?: { status: string; current_model?: string };
    whisper?: { status: string };
    tts?: { status: string };
  };
}

function Sidebar({ 
  history = [], 
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  onClearHistory,
  activeChatId 
}: {
  history: ChatHistoryItem[];
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onClearHistory: () => void;
  activeChatId: string | null;
}) {
  return (
    <aside className="h-full w-64 bg-gradient-to-b from-[#0a0a0a] to-[#000000] text-white flex flex-col border-r border-gray-800/70 shadow-2xl">
      <div className="p-4 border-b border-gray-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-emerald-400" size={20} />
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Historia
          </h1>
        </div>
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r cursor-pointer from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-lg text-white font-medium text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 w-full justify-center"
          title="New Chat"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        {(!history || history.length === 0) && (
          <div className="text-center mt-8 px-4">
            <MessageSquare className="mx-auto text-gray-600 mb-3" size={32} />
            <p className="text-sm text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-600 mt-1">Start a new chat to begin</p>
          </div>
        )}
        
        {history.map((chat) => (
          <div key={chat.id} className="group relative">
            <button
              onClick={() => onSelectChat(chat.id)}
              className={`flex items-center w-full text-left text-sm px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                chat.id === activeChatId
                  ? "bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border-l-2 border-emerald-400 shadow-lg shadow-emerald-500/5"
                  : "hover:bg-white/3 hover:shadow-md hover:scale-[1.02]"
              }`}
            >
              <MessageSquare
                className={`mr-3 transition-colors duration-200 flex-shrink-0 ${
                  chat.id === activeChatId
                    ? "text-emerald-400"
                    : "text-gray-600 group-hover:text-gray-400"
                }`}
                size={16}
              />
              <div className="flex-1 min-w-0">
                <span
                  className={`block truncate transition-colors duration-200 ${
                    chat.id === activeChatId
                      ? "text-white font-medium"
                      : "text-gray-400 group-hover:text-gray-200"
                  }`}
                >
                  {chat.title}
                </span>
                <span className="text-xs text-gray-600 block">
                  {chat.messages.length} messages
                </span>
              </div>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer rounded-md bg-red-600/20 hover:bg-red-600/40 text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
              title="Delete chat"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800/40">
        <div className="flex gap-2">
          <button
            onClick={onClearHistory}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer rounded-lg text-gray-400 hover:text-gray-200 text-sm transition-all duration-200"
            title="Clear all chats"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function HistoriaDashboard() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string>(() => Math.random().toString(36).substr(2, 9));
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [backendHealth, setBackendHealth] = useState<HealthStatus | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [useWebSpeechAPI, setUseWebSpeechAPI] = useState(true);
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  const API_BASE_URL = "http://localhost:8000";

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsProcessing(false);
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognition result:', transcript);
        setInput(transcript);
        inputRef.current?.focus();
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setApiError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
        setIsProcessing(false);
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
        setIsProcessing(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingDuration(0);
      };
      
      recognitionRef.current = recognition;
    } else {
      console.log('Web Speech API not supported, will use MediaRecorder fallback');
      setUseWebSpeechAPI(false);
    }
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const health = await response.json();
        setBackendHealth(health);
        setIsConnected(response.ok);
        setApiError(response.ok ? null : "Backend is unhealthy");
      } catch (error) {
        setIsConnected(false);
        setApiError(null); // Don't show error for demo mode
        setBackendHealth(null);
      }
    };

    checkHealth();
    const healthInterval = setInterval(checkHealth, 30000);
    return () => clearInterval(healthInterval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const generateMessageId = () => Math.random().toString(36).substr(2, 9);

  const detectCategory = (text: string): "philosophy" | "history" | "general" => {
    const philosophyKeywords = ["philosophy", "ethics", "morality", "existence", "consciousness", "stoicism", "kant", "aristotle", "plato", "epistemology", "metaphysics"];
    const historyKeywords = ["history", "war", "empire", "civilization", "ancient", "medieval", "renaissance", "revolution", "historical", "century"];
    
    const lowerText = text.toLowerCase();
    if (philosophyKeywords.some(keyword => lowerText.includes(keyword))) return "philosophy";
    if (historyKeywords.some(keyword => lowerText.includes(keyword))) return "history";
    return "general";
  };

  const simulateTypingEffect = (text: string, messageId: string) => {
    const words = text.split(' ');
    let currentText = '';
    
    const typeNextWord = (index: number) => {
      if (index >= words.length) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isStreaming: false } : msg
        ));
        if (isTTSEnabled) {
          setTimeout(() => playTTSAudio(text), 300);
        }
        return;
      }
      
      currentText += (index > 0 ? ' ' : '') + words[index];
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, text: currentText } : msg
      ));
      
      setTimeout(() => typeNextWord(index + 1), 30 + Math.random() * 70);
    };
    
    typeNextWord(0);
  };

  const playTTSAudio = async (text: string) => {
    if (!isTTSEnabled || !text.trim()) return;
    
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
        setIsPlaying(false);
      }
      
      setIsPlaying(true);
      
      // Use Web Speech API for TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Try to use a more pleasant voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Microsoft') ||
          voice.name.includes('Female') ||
          voice.lang === 'en-US'
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        
        speechSynthesis.speak(utterance);
        return;
      }

      // Fallback to backend TTS
      if (isConnected) {
        const response = await fetch(`${API_BASE_URL}/api/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;
          
          audio.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
          };
          
          audio.onerror = () => setIsPlaying(false);
          await audio.play();
        } else {
          setIsPlaying(false);
        }
      }
    } catch (error) {
      setIsPlaying(false);
      console.error('Error with TTS:', error);
    }
  };

  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isGeneratingResponse) return;

    const userMessage: Message = {
      id: generateMessageId(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
      category: detectCategory(input.trim())
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input.trim();
    setInput("");
    setIsGeneratingResponse(true);
    setApiError(null);

    try {
      if (isConnected) {
        // Use real backend
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: messageText,
            category: userMessage.category,
            chat_id: currentChatId
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          const assistantMessageId = generateMessageId();
          const assistantMessage: Message = {
            id: assistantMessageId,
            text: "",
            sender: "assistant",
            timestamp: new Date(),
            category: data.category,
            isStreaming: true
          };

          setMessages(prev => [...prev, assistantMessage]);
          simulateTypingEffect(data.response, assistantMessageId);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } else {
        // Demo mode responses
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const demoResponses = {
          philosophy: "Philosophy invites us to question our fundamental assumptions about existence, knowledge, and ethics. From ancient Stoics like Marcus Aurelius who taught us that 'you have power over your mind—not outside events,' to modern thinkers exploring consciousness and meaning, philosophical inquiry helps us live more examined lives. What specific philosophical question intrigues you most?",
          history: "History reveals the fascinating tapestry of human civilization—from the rise and fall of empires to the quiet revolutions of ideas that shaped our world. Each era offers lessons about human nature, power, and progress. The patterns of history often rhyme, as Mark Twain suggested, showing us both our potential for greatness and our recurring challenges.",
          general: "Every great question bridges philosophy and history, revealing how human thought has evolved across cultures and centuries. Whether exploring ethics, politics, or the meaning of existence, we can trace these conversations through time—from ancient dialogues in Athens to modern debates about technology and consciousness."
        };
        
        const response = demoResponses[userMessage.category] || demoResponses.general;
        
        const assistantMessageId = generateMessageId();
        const assistantMessage: Message = {
          id: assistantMessageId,
          text: "",
          sender: "assistant",
          timestamp: new Date(),
          category: userMessage.category,
          isStreaming: true
        };

        setMessages(prev => [...prev, assistantMessage]);
        simulateTypingEffect(response, assistantMessageId);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: generateMessageId(),
        text: "I apologize, but I'm having trouble connecting right now. Please check that the Historia backend is running and try again, or continue in demo mode.",
        sender: "assistant",
        timestamp: new Date(),
        category: "general"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    setApiError(null);
    
    try {
      // Try Web Speech API first if supported and preferred
      if (useWebSpeechAPI && recognitionRef.current) {
        setIsRecording(true);
        setRecordingDuration(0);
        
        // Start timer for visual feedback
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
        
        recognitionRef.current.start();
        return;
      }
      
      // Fallback to MediaRecorder API
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm' 
        });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setApiError('Failed to access microphone. Please check permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingDuration(0);
    
    if (recognitionRef.current && useWebSpeechAPI) {
      recognitionRef.current.stop();
      return;
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      if (!isConnected) {
        // Demo mode fallback
        await new Promise(resolve => setTimeout(resolve, 1500));
        const demoQuestions = [
          "What is the meaning of life according to Aristotle?",
          "Tell me about the fall of the Roman Empire",
          "Explain Stoic philosophy",
          "What can history teach us about leadership?",
          "How did ancient philosophers view happiness?"
        ];
        setInput(demoQuestions[Math.floor(Math.random() * demoQuestions.length)]);
        inputRef.current?.focus();
        return;
      }

      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');

      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setInput(data.transcription);
        inputRef.current?.focus();
      } else {
        throw new Error('Transcription failed');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setApiError('Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatRecordingDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const saveCurrentChatToHistory = () => {
    if (messages.length === 0 || !currentChatId) return;

    try {
      const firstUserMessage = messages.find(msg => msg.sender === "user");
      const chatTitle = firstUserMessage 
        ? firstUserMessage.text.slice(0, 40) + (firstUserMessage.text.length > 40 ? "..." : "")
        : "New Chat";
      
      const newChatItem: ChatHistoryItem = {
        id: currentChatId,
        title: chatTitle,
        messages: [...messages],
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      setChatHistory(prev => {
        const existingIndex = prev.findIndex(chat => chat.id === currentChatId);
        let updatedHistory;
        
        if (existingIndex >= 0) {
          // Update existing chat
          updatedHistory = [...prev];
          updatedHistory[existingIndex] = { 
            ...newChatItem, 
            createdAt: prev[existingIndex].createdAt 
          };
        } else {
          // Add new chat to beginning
          updatedHistory = [newChatItem, ...prev];
        }
        
        // Also save directly to localStorage as backup
        try {
          localStorage.setItem('historia-chat-history', JSON.stringify(updatedHistory));
          setLastSaved(new Date());
          console.log(`💾 Direct save: ${updatedHistory.length} chats`);
        } catch (error) {
          console.error('❌ Direct save failed:', error);
        }
        
        return updatedHistory;
      });
    } catch (error) {
      console.error('❌ Error in saveCurrentChatToHistory:', error);
    }
  };

  const handleNewChat = () => {
    saveCurrentChatToHistory();
    setMessages([]);
    setCurrentChatId(generateMessageId());
    setInput("");
    setApiError(null);
    stopTTS();
    inputRef.current?.focus();
  };

  const handleSelectChat = (chatId: string) => {
    if (messages.length > 0 && currentChatId !== chatId) {
      saveCurrentChatToHistory();
    }
    
    const selectedChat = chatHistory.find(chat => chat.id === chatId);
    if (selectedChat) {
      setCurrentChatId(chatId);
      setMessages([...selectedChat.messages]);
      stopTTS();
    }
  };

  const handleDeleteChat = (chatId: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setMessages([]);
      setCurrentChatId(generateMessageId());
      stopTTS();
    }
  };

  const handleClearHistory = () => {
    setChatHistory([]);
    setMessages([]);
    setCurrentChatId(generateMessageId());
    stopTTS();
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "philosophy": return <Brain size={14} className="text-purple-400" />;
      case "history": return <BookOpen size={14} className="text-amber-400" />;
      default: return null;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getConnectionStatus = () => {
    if (!isConnected) return { icon: AlertCircle, color: "text-amber-400", text: "Demo Mode" };
    if (backendHealth?.status === "healthy") return { icon: Wifi, color: "text-emerald-400", text: "Connected" };
    if (backendHealth?.status === "degraded") return { icon: AlertCircle, color: "text-yellow-400", text: "Degraded" };
    return { icon: WifiOff, color: "text-red-400", text: "Disconnected" };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a0a] to-[#000000] text-white overflow-hidden">
      <Sidebar 
        history={chatHistory}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onClearHistory={handleClearHistory}
        activeChatId={currentChatId}
      />
      
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <div className="border-b border-gray-800/50 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Chat with Historia</h2>
              <p className="text-sm text-gray-400">Philosophy & History AI Assistant</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <connectionStatus.icon className={connectionStatus.color} size={16} />
                <span className={connectionStatus.color}>{connectionStatus.text}</span>
              </div>

              <div className="flex items-center gap-2">
                {isPlaying ? (
                  <button
                    onClick={stopTTS}
                    className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all duration-200"
                    title="Stop speaking"
                  >
                    <VolumeX size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsTTSEnabled(!isTTSEnabled)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isTTSEnabled ? 'bg-emerald-600/20 text-emerald-400' : 'bg-gray-700/50 text-gray-400'
                    }`}
                    title={isTTSEnabled ? "Disable voice output" : "Enable voice output"}
                  >
                    {isTTSEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                )}
              </div>
              
              {isPlaying && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  Speaking...
                </div>
              )}
              
              {lastSaved && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                  Last saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}
              
              {isGeneratingResponse && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <Loader2 className="animate-spin" size={16} />
                  Historia is thinking...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">🏛️</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-300">Welcome to Historia</h3>
                <p className="text-gray-500 mb-6">
                  Ask me anything about philosophy, history, or the great ideas that shaped our world.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button 
                    onClick={() => setInput("Tell me about Stoic philosophy")}
                    className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm hover:bg-purple-600/30 transition-colors"
                  >
                    Stoic Philosophy
                  </button>
                  <button 
                    onClick={() => setInput("Explain the fall of the Roman Empire")}
                    className="px-3 py-1 bg-amber-600/20 text-amber-300 rounded-full text-sm hover:bg-amber-600/30 transition-colors"
                  >
                    Roman Empire
                  </button>
                  <button 
                    onClick={() => setInput("What is the meaning of life according to different philosophers?")}
                    className="px-3 py-1 bg-emerald-600/20 text-emerald-300 rounded-full text-sm hover:bg-emerald-600/30 transition-colors"
                  >
                    Meaning of Life
                  </button>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`group flex ${msg.sender === "user" ? "justify-end" : "justify-start"} px-4`}
            >
              <div
                className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-lg relative ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white"
                    : "bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 text-gray-100"
                }`}
              >
                <div className="flex items-start gap-2">
                  {msg.sender === "assistant" && (
                    <div className="text-2xl">🏛️</div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getCategoryIcon(msg.category)}
                      <span className="text-xs text-gray-400">
                        {formatTime(msg.timestamp)}
                      </span>
                      {msg.isStreaming && (
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                          <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse delay-100"></div>
                          <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse delay-200"></div>
                        </div>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </div>
                
                {msg.sender === "assistant" && !msg.isStreaming && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => playTTSAudio(msg.text)}
                      className="p-1 bg-black/20 hover:bg-black/40 rounded text-xs"
                      title="Read aloud"
                      disabled={isPlaying}
                    >
                      <Volume2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-800/50 p-4 backdrop-blur-sm">
          {apiError && (
            <div className="mb-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-center gap-2 text-red-300 text-sm max-w-4xl mx-auto">
              <AlertCircle size={16} />
              {apiError}
              <button 
                onClick={() => setApiError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <button
              onClick={handleMicClick}
              disabled={isProcessing}
              className={`p-3 rounded-xl transition-all duration-200 flex-shrink-0 relative ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 animate-pulse"
                  : isProcessing
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              title={
                isRecording ? "Stop recording (click to finish)" : 
                isProcessing ? "Processing audio..." : 
                "Click to start voice input"
              }
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isRecording ? (
                <MicOff size={20} />
              ) : (
                <Mic size={20} />
              )}
              
              {isRecording && recordingDuration > 0 && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded-md">
                  {formatRecordingDuration(recordingDuration)}
                </div>
              )}
            </button>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask Historia about philosophy, history, or life's big questions..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isGeneratingResponse}
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 disabled:opacity-50 pr-16"
                maxLength={500}
              />
              
              {isRecording && (
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse delay-100"></div>
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-1 right-2 text-xs text-gray-500">
                {input.length}/500
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isGeneratingResponse || input.length > 500}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-emerald-500/20 flex-shrink-0"
            >
              {isGeneratingResponse ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          
          <div className="text-center mt-3 text-xs text-gray-500">
            {isRecording ? (
              <span className="text-red-400">🎤 Recording {formatRecordingDuration(recordingDuration)} - Click mic to stop</span>
            ) : isProcessing ? (
              <span className="text-emerald-400">Processing your voice input...</span>
            ) : (
              <span>
                {useWebSpeechAPI ? "Click mic for voice input (Web Speech API)" : "Click mic for voice input (MediaRecorder)"}
                {!isConnected && " - Demo mode active"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}