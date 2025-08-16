# Historia - AI Voice Assistant

A web-based voice-enabled AI assistant focused on philosophy and history conversations.

## Features

- 🎤 Voice input using Whisper speech-to-text
- 🤖 Local LLM inference with Ollama
- 🔊 Text-to-speech with Coqui TTS
- 💬 Chat interface with history
- 📱 Responsive web design

## Tech Stack

### Frontend
- Next.js
- React
- Tailwind CSS (if using)

### Backend
- FastAPI
- Whisper (OpenAI)
- Ollama
- Coqui TTS

## Local Development

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Install Ollama separately
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Deployment

- Frontend: Deployed on Vercel
- Backend: Deployed on Railway

## Environment Variables

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL

### Backend
- Add any API keys or configuration as needed

## License

MIT License