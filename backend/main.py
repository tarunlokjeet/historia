from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import httpx
import json
import os
import io
import tempfile
import asyncio
from datetime import datetime
from pathlib import Path
import logging
import whisper
import torch
import pyttsx3  # Using pyttsx3 instead of Coqui TTS
import soundfile as sf
import numpy as np
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Historia API", 
    description="AI Assistant for Philosophy and History with Voice Support",
    version="1.0.0"
)

# Add CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories for audio files
AUDIO_DIR = Path("audio_files")
AUDIO_DIR.mkdir(exist_ok=True)

# Pydantic models for request/response
class ChatMessage(BaseModel):
    message: str
    category: Optional[str] = "general"
    chat_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    category: str
    timestamp: datetime
    chat_id: Optional[str] = None

class ConversationHistory(BaseModel):
    messages: List[dict]

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "default"

class TranscriptionResponse(BaseModel):
    transcription: str
    confidence: float
    language: Optional[str] = None

# Configuration
OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "llama3.2:3b"  # Change to your preferred model

# Global variables for AI models (loaded on startup)
whisper_model = None
tts_engine = None

# Enhanced system prompts with more personality
SYSTEM_PROMPTS = {
    "philosophy": """You are Historia, a knowledgeable AI assistant who specializes in philosophy and history. 
    You have a passion for philosophical inquiry and love exploring deep questions about existence, ethics, 
    knowledge, and the human condition. 
    
    When discussing philosophy:
    - Draw from major philosophical traditions (Western, Eastern, Islamic, African, etc.)
    - Connect abstract concepts to practical life applications
    - Encourage critical thinking and present multiple perspectives
    - Reference key philosophers and their contributions
    - Use thought experiments and analogies to clarify complex ideas
    - Maintain an engaging, conversational tone while being intellectually rigorous
    
    Keep responses focused, insightful, and around 2-3 paragraphs unless the user asks for more detail.""",
    
    "history": """You are Historia, a passionate historian and AI assistant who brings the past to life. 
    You excel at making historical events, figures, and civilizations accessible and engaging.
    
    When discussing history:
    - Provide rich context about causes, consequences, and significance
    - Connect historical events to broader patterns and themes
    - Include diverse perspectives and voices from different cultures
    - Highlight the human stories behind major events
    - Draw connections between past and present
    - Use vivid details to make history come alive
    - Maintain historical accuracy while being engaging
    
    Keep responses informative yet captivating, around 2-3 paragraphs unless more detail is requested.""",
    
    "general": """You are Historia, an AI assistant with deep knowledge of philosophy and history. 
    You approach all topics with intellectual curiosity and wisdom gained from studying human thought 
    and experience across cultures and centuries.
    
    For any topic:
    - Draw insights from philosophical and historical perspectives when relevant
    - Encourage deeper thinking and exploration of underlying questions
    - Provide thoughtful, well-reasoned responses
    - Connect ideas across disciplines and time periods
    - Maintain a warm, engaging personality while being intellectually stimulating
    
    Keep responses thoughtful and conversational, around 2-3 paragraphs."""
}

# Initialize TTS engine function
def initialize_tts():
    """Initialize pyttsx3 TTS engine with proper settings"""
    try:
        engine = pyttsx3.init()
        
        # Set voice properties
        voices = engine.getProperty('voices')
        if voices:
            # Try to find a female voice
            for voice in voices:
                if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                    engine.setProperty('voice', voice.id)
                    break
            
        # Set speech rate and volume
        engine.setProperty('rate', 150)  # Speed of speech
        engine.setProperty('volume', 0.9)  # Volume (0.0 to 1.0)
        
        logger.info("TTS engine initialized successfully")
        return engine
    except Exception as e:
        logger.error(f"Failed to initialize TTS engine: {e}")
        return None

# Startup event to load AI models
@app.on_event("startup")
async def startup_event():
    global whisper_model, tts_engine
    logger.info("Loading AI models...")
    
    try:
        # Load Whisper model
        logger.info("Loading Whisper model...")
        whisper_model = whisper.load_model("base")
        logger.info("Whisper model loaded successfully")
        
        # Initialize TTS engine
        logger.info("Initializing TTS engine...")
        tts_engine = initialize_tts()
        if tts_engine:
            logger.info("TTS engine initialized successfully")
        else:
            logger.warning("TTS engine initialization failed")
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        # Continue without models - they'll be loaded on first use

@app.get("/")
async def root():
    return {
        "message": "Historia API is running",
        "version": "1.0.0",
        "features": ["Chat with Ollama", "Speech-to-Text", "Text-to-Speech"],
        "endpoints": ["/api/chat", "/api/transcribe", "/api/synthesize", "/health"]
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(),
        "services": {}
    }
    
    # Check Ollama
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                health_status["services"]["ollama"] = {
                    "status": "connected",
                    "models_available": len(models),
                    "current_model": MODEL_NAME
                }
            else:
                health_status["services"]["ollama"] = {"status": "error", "code": response.status_code}
                health_status["status"] = "degraded"
    except Exception as e:
        health_status["services"]["ollama"] = {"status": "disconnected", "error": str(e)}
        health_status["status"] = "degraded"
    
    # Check AI models
    health_status["services"]["whisper"] = {"status": "loaded" if whisper_model else "not_loaded"}
    health_status["services"]["tts"] = {"status": "loaded" if tts_engine else "not_loaded"}
    
    return health_status

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_ollama(chat_message: ChatMessage):
    """Enhanced chat endpoint with better error handling and streaming support"""
    try:
        # Get appropriate system prompt based on category
        system_prompt = SYSTEM_PROMPTS.get(chat_message.category, SYSTEM_PROMPTS["general"])
        
        # Enhanced prompt formatting
        full_prompt = f"""<|system|>
{system_prompt}

<|user|>
{chat_message.message}

<|assistant|>"""
        
        # Call Ollama API with enhanced parameters
        async with httpx.AsyncClient(timeout=120.0) as client:
            ollama_request = {
                "model": MODEL_NAME,
                "prompt": full_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.8,
                    "top_p": 0.9,
                    "top_k": 40,
                    "repeat_penalty": 1.1,
                    "num_predict": 800,  # Allow longer responses
                    "stop": ["<|user|>", "<|system|>"]  # Stop sequences
                }
            }
            
            logger.info(f"Sending request to Ollama: {chat_message.category} - {chat_message.message[:50]}...")
            
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=ollama_request
            )
            
            if response.status_code != 200:
                logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=500, detail=f"Ollama API error: {response.status_code}")
            
            ollama_response = response.json()
            ai_response = ollama_response.get("response", "").strip()
            
            if not ai_response:
                raise HTTPException(status_code=500, detail="Empty response from Ollama")
            
            # Clean up the response (remove any remaining tags)
            ai_response = ai_response.replace("<|assistant|>", "").replace("<|user|>", "").strip()
            
            logger.info(f"Successfully generated response: {len(ai_response)} characters")
            
            return ChatResponse(
                response=ai_response,
                category=chat_message.category,
                timestamp=datetime.now(),
                chat_id=chat_message.chat_id
            )
            
    except httpx.TimeoutException:
        logger.error("Request timeout to Ollama")
        raise HTTPException(status_code=504, detail="Request timeout - Ollama may be busy or the model is loading")
    except httpx.ConnectError:
        logger.error("Cannot connect to Ollama")
        raise HTTPException(status_code=503, detail="Cannot connect to Ollama. Make sure it's running on localhost:11434")
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@app.post("/api/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(audio_file: UploadFile = File(...)):
    """Transcribe audio using Whisper"""
    global whisper_model
    
    if not audio_file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    try:
        # Load Whisper model if not already loaded
        if whisper_model is None:
            logger.info("Loading Whisper model...")
            whisper_model = whisper.load_model("base")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Transcribe with Whisper
        logger.info("Transcribing audio...")
        result = whisper_model.transcribe(temp_path)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        transcription = result["text"].strip()
        confidence = result.get("confidence", 0.0)
        language = result.get("language", "en")
        
        logger.info(f"Transcription successful: {transcription[:50]}...")
        
        return TranscriptionResponse(
            transcription=transcription,
            confidence=confidence,
            language=language
        )
        
    except Exception as e:
        logger.error(f"Error in transcription: {str(e)}")
        # Clean up temp file if it exists
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")

def generate_speech_file(text: str, file_path: str):
    """Generate speech using pyttsx3 and save to file"""
    global tts_engine
    try:
        if tts_engine is None:
            tts_engine = initialize_tts()
        
        if tts_engine:
            tts_engine.save_to_file(text, file_path)
            tts_engine.runAndWait()
            return True
        return False
    except Exception as e:
        logger.error(f"Error generating speech: {e}")
        return False

@app.post("/api/synthesize")
async def synthesize_speech(tts_request: TTSRequest):
    """Convert text to speech using pyttsx3"""
    global tts_engine
    
    if len(tts_request.text) > 1000:
        raise HTTPException(status_code=400, detail="Text too long (max 1000 characters)")
    
    try:
        # Initialize TTS engine if not already loaded
        if tts_engine is None:
            logger.info("Initializing TTS engine...")
            tts_engine = initialize_tts()
            if not tts_engine:
                raise HTTPException(status_code=500, detail="TTS engine not available")
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        audio_filename = f"historia_tts_{timestamp}.wav"
        audio_path = AUDIO_DIR / audio_filename
        
        # Generate speech in a thread to avoid blocking
        logger.info(f"Generating speech for: {tts_request.text[:50]}...")
        
        def tts_thread():
            try:
                tts_engine.save_to_file(tts_request.text, str(audio_path))
                tts_engine.runAndWait()
            except Exception as e:
                logger.error(f"TTS thread error: {e}")
        
        # Run TTS in thread and wait for completion
        thread = threading.Thread(target=tts_thread)
        thread.start()
        thread.join(timeout=30)  # 30 second timeout
        
        if thread.is_alive():
            raise HTTPException(status_code=500, detail="TTS generation timeout")
        
        # Check if file was created
        if not audio_path.exists():
            raise HTTPException(status_code=500, detail="Failed to generate audio file")
        
        logger.info(f"Speech generated successfully: {audio_path}")
        
        # Return the audio file
        return FileResponse(
            path=audio_path,
            media_type="audio/wav",
            filename=audio_filename,
            headers={"Content-Disposition": f"attachment; filename={audio_filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error in speech synthesis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating speech: {str(e)}")

@app.post("/api/chat/stream")
async def chat_stream(chat_message: ChatMessage):
    """Streaming chat endpoint for real-time responses"""
    try:
        system_prompt = SYSTEM_PROMPTS.get(chat_message.category, SYSTEM_PROMPTS["general"])
        full_prompt = f"{system_prompt}\n\nHuman: {chat_message.message}\n\nAssistant:"
        
        async def generate_stream():
            async with httpx.AsyncClient(timeout=120.0) as client:
                ollama_request = {
                    "model": MODEL_NAME,
                    "prompt": full_prompt,
                    "stream": True,
                    "options": {
                        "temperature": 0.8,
                        "top_p": 0.9,
                        "num_predict": 800
                    }
                }
                
                async with client.stream(
                    "POST",
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json=ollama_request
                ) as response:
                    if response.status_code != 200:
                        yield f"data: {json.dumps({'error': 'Ollama API error'})}\n\n"
                        return
                    
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                if "response" in data:
                                    yield f"data: {json.dumps({'content': data['response']})}\n\n"
                                if data.get("done", False):
                                    yield f"data: {json.dumps({'done': True})}\n\n"
                                    break
                            except json.JSONDecodeError:
                                continue
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
        
    except Exception as e:
        logger.error(f"Error in streaming chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Utility endpoints
@app.get("/api/models")
async def get_available_models():
    """Get list of available Ollama models"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=500, detail="Could not fetch models")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/audio/{filename}")
async def delete_audio_file(filename: str):
    """Delete generated audio file"""
    try:
        audio_path = AUDIO_DIR / filename
        if audio_path.exists():
            os.unlink(audio_path)
            return {"message": "File deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_api_stats():
    """Get API statistics"""
    audio_files = list(AUDIO_DIR.glob("*.wav"))
    return {
        "audio_files_count": len(audio_files),
        "audio_directory_size_mb": sum(f.stat().st_size for f in audio_files) / (1024 * 1024),
        "whisper_loaded": whisper_model is not None,
        "tts_loaded": tts_engine is not None,
        "cuda_available": torch.cuda.is_available() if 'torch' in globals() else False
    }

# Background task to clean up old audio files
async def cleanup_old_audio_files():
    """Clean up audio files older than 1 hour"""
    import time
    current_time = time.time()
    for audio_file in AUDIO_DIR.glob("*.wav"):
        if current_time - audio_file.stat().st_mtime > 3600:  # 1 hour
            try:
                os.unlink(audio_file)
                logger.info(f"Cleaned up old audio file: {audio_file}")
            except Exception as e:
                logger.error(f"Error cleaning up {audio_file}: {e}")

@app.on_event("startup")
async def schedule_cleanup():
    """Schedule periodic cleanup of audio files"""
    async def periodic_cleanup():
        while True:
            await asyncio.sleep(3600)  # Run every hour
            await cleanup_old_audio_files()
    
    # Start the cleanup task in the background
    asyncio.create_task(periodic_cleanup())

if __name__ == "__main__":
    import uvicorn
    
    # Check if models need to be downloaded
    print("Starting Historia API server...")
    print("Note: AI models will be downloaded on first use if not already available")
    print("Whisper: ~140MB, pyttsx3 TTS: No additional downloads needed")
    
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )