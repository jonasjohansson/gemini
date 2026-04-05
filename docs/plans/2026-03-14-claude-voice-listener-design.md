# Claude Voice Listener — Design

## Overview

A standalone Python tool that continuously listens via microphone, transcribes speech locally with Whisper, and when it detects the wake word "claude" in the transcript, sends the command to Claude Code via subprocess. Responds with both terminal output and macOS `say` TTS. Fully free and offline.

## Architecture

```
Microphone → Audio Buffer (chunked)
    ↓
Whisper (local, "base" model)
    ↓
Transcript text
    ↓
Wake word filter ("claude" in text?)
    ├── No  → discard, keep listening
    └── Yes → extract command after "claude"
                 ↓
           subprocess: claude --print "command"
                 ↓
           Capture output
                 ↓
           Print to terminal + say output
                 ↓
           ← back to listening
```

## Components

### 1. Audio capture (`listener.py`)
- `sounddevice` library for mic input
- Records in chunks, uses voice activity detection (VAD) via `webrtcvad` or energy threshold
- Detects speech start/stop to create discrete utterances

### 2. Transcription (`transcriber.py`)
- Local Whisper, `base` model (~150MB, good speed/accuracy balance)
- Runs on each speech segment after silence detected

### 3. Wake word filtering + command execution (`commander.py`)
- String match: if "claude" in transcript, extract everything after it as the command
- `subprocess.run(["claude", "--print", command])` for execution
- Captures stdout

### 4. TTS response (`speaker.py`)
- macOS `say` command for voice feedback
- Print full response to terminal

### 5. CLI entry point (`main.py`)
- Orchestrates the listen → transcribe → filter → execute → speak loop
- Ctrl+C to stop

## Dependencies

All free/local:
- `openai-whisper` — transcription
- `sounddevice` + `numpy` — audio capture
- `webrtcvad` — voice activity detection
- macOS `say` — TTS (built-in)

## Project Structure

```
claude-voice-listener/
├── pyproject.toml
├── README.md
└── src/
    └── claude_voice/
        ├── __init__.py
        ├── listener.py
        ├── transcriber.py
        ├── commander.py
        ├── speaker.py
        └── main.py
```

## Usage

```bash
pip install -e .
python -m claude_voice.main
```

```
🎤 Listening...
You: "hey claude, add buy groceries to my airtable todos"
📝 Heard: "add buy groceries to my airtable todos"
⚡ Running command...
✅ Done. Added "buy groceries" to your Airtable todos.
🎤 Listening...
```

## Approach

Approach A: Standalone script + subprocess. Each voice command spawns a fresh Claude Code session via `claude --print`. Simple, decoupled, easy to debug. Can evolve to MCP server or persistent session later.
