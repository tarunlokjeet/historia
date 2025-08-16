"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Sparkles, Brain, BookOpen, Mic, Volume2, Wifi, ArrowRight } from "lucide-react";

export default function HeroSection() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a0a0a] to-[#000000] text-white px-6 sm:px-12 relative overflow-hidden">
      {/* Animated Background Elements - matching dashboard style */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-5">
          <div className="w-full h-full border border-white/20 rounded-full animate-spin-slow"></div>
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-white/10 rounded-full animate-spin-reverse"></div>
        </div>
      </div>

      {/* Top Navbar - matching dashboard header style */}
      <div className="flex justify-center items-center py-6 relative z-10 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-400/20 to-cyan-600/20 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-emerald-400" size={24} />
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Historia
            </div>
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="flex flex-col items-center text-center flex-grow justify-center relative z-10 max-w-6xl mx-auto">
        {/* Badge - matching dashboard style */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-full mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-gray-300 text-sm font-medium">AI-Powered Philosophy & History Assistant</span>
        </div>

        {/* Main Title - enhanced gradient matching dashboard colors */}
        <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
            Chat with Historia
          </span>
          <br />
          <span className="text-white/90 text-3xl sm:text-4xl lg:text-5xl font-normal">
            Your Voice-Enabled AI Guide
          </span>
        </h1>

        {/* Subtitle - matching dashboard text colors */}
        <p className={`text-lg sm:text-xl lg:text-2xl text-gray-400 max-w-4xl mb-12 leading-relaxed transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Experience philosophy and history through{' '}
          <span className="text-emerald-300 font-semibold">natural voice conversations</span>.
          Speak your questions and hear wisdom from the ages with advanced AI processing.
        </p>

        {/* Features Grid - exactly matching dashboard card style */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="group bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🎙️</div>
              <Mic className="text-emerald-400 group-hover:scale-110 transition-transform duration-300" size={20} />
            </div>
            <h3 className="text-white font-semibold mb-2">Voice Conversations</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Speak naturally using Whisper STT and hear responses with Coqui TTS technology</p>
          </div>
          
          <div className="group bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🏛️</div>
              <Brain className="text-purple-400 group-hover:scale-110 transition-transform duration-300" size={20} />
            </div>
            <h3 className="text-white font-semibold mb-2">Deep Knowledge</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Explore philosophy, history, and classical wisdom with specialized AI expertise</p>
          </div>
          
          <div className="group bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">💭</div>
              <BookOpen className="text-cyan-400 group-hover:scale-110 transition-transform duration-300" size={20} />
            </div>
            <h3 className="text-white font-semibold mb-2">Interactive Learning</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Engage in dynamic discussions, ask follow-up questions, and explore complex ideas together</p>
          </div>
        </div>

        {/* Example Questions - matching dashboard suggestion pills */}
        <div className={`mb-12 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-gray-400 text-sm mb-4">Try asking Historia about:</p>
          <div className="flex flex-wrap gap-3 justify-center max-w-4xl">
            <div className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-full text-sm hover:bg-purple-600/30 transition-colors cursor-pointer">
              "Tell me about Stoic philosophy"
            </div>
            <div className="px-4 py-2 bg-amber-600/20 border border-amber-500/30 text-amber-300 rounded-full text-sm hover:bg-amber-600/30 transition-colors cursor-pointer">
              "Explain the fall of the Roman Empire"
            </div>
            <div className="px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-full text-sm hover:bg-emerald-600/30 transition-colors cursor-pointer">
              "What is the meaning of life?"
            </div>
          </div>
        </div>

        {/* CTA Button - exactly matching dashboard button style */}
        <div className={`transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button
            onClick={handleGetStarted}
            className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-lg rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-emerald-500/20 flex items-center gap-3"
          >
            <span>Begin Your Journey</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform duration-300" size={20} />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 blur opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
          </button>
        </div>

        {/* Tech Stack Indicator - matching dashboard service status style */}
        <div className={`mt-16 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex flex-wrap items-center justify-center gap-4 text-gray-400 text-sm">
            <span className="text-gray-500">Powered by:</span>
            <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/30 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              <span>Whisper STT</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/30 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              <span>Ollama LLM</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/30 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              <span>Coqui TTS</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin 15s linear infinite reverse;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}