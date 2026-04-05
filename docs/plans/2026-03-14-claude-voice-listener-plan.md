# Claude Voice Listener — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Python CLI tool that continuously listens via microphone, transcribes with local Whisper, and executes commands through Claude Code when it hears the wake word "claude".

**Architecture:** Single Python process with an audio capture loop feeding into local Whisper for transcription. Voice activity detection (VAD) segments speech into utterances. When "claude" is detected in the transcript, the command portion is sent to `claude -p` via subprocess. Response is printed to terminal and spoken via macOS `say`.

**Tech Stack:** Python 3.14, openai-whisper, sounddevice, numpy, webrtcvad, macOS `say`

---

### Task 1: Scaffold project

**Files:**
- Create: `~/Documents/GitHub/org/jonasjohansson/claude-voice-listener/pyproject.toml`
- Create: `~/Documents/GitHub/org/jonasjohansson/claude-voice-listener/src/claude_voice/__init__.py`
- Create: `~/Documents/GitHub/org/jonasjohansson/claude-voice-listener/src/claude_voice/main.py`

**Step 1: Create project directory and initialize git**

```bash
mkdir -p ~/Documents/GitHub/org/jonasjohansson/claude-voice-listener/src/claude_voice
cd ~/Documents/GitHub/org/jonasjohansson/claude-voice-listener
git init
```

**Step 2: Create pyproject.toml**

```toml
[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.backends._legacy:_Backend"

[project]
name = "claude-voice-listener"
version = "0.1.0"
description = "Voice-activated Claude Code assistant"
requires-python = ">=3.10"
dependencies = [
    "openai-whisper",
    "sounddevice",
    "numpy",
    "webrtcvad-wheels",
]

[project.scripts]
claude-voice = "claude_voice.main:main"

[tool.setuptools.packages.find]
where = ["src"]
```

**Step 3: Create empty __init__.py**

```python
# src/claude_voice/__init__.py
```

**Step 4: Create minimal main.py**

```python
# src/claude_voice/main.py

def main():
    print("Claude Voice Listener starting...")

if __name__ == "__main__":
    main()
```

**Step 5: Install in dev mode and verify**

```bash
pip install -e .
claude-voice
```

Expected: prints "Claude Voice Listener starting..."

**Step 6: Commit**

```bash
git add .
git commit -m "feat: scaffold claude-voice-listener project"
```

---

### Task 2: Audio capture with voice activity detection

**Files:**
- Create: `src/claude_voice/listener.py`
- Create: `tests/test_listener.py`

**Step 1: Write the test**

```python
# tests/test_listener.py
import numpy as np
from claude_voice.listener import is_speech

def test_silence_is_not_speech():
    silence = np.zeros(480, dtype=np.int16)
    assert is_speech(silence, sample_rate=16000) is False

def test_loud_signal_is_speech():
    noise = (np.random.randn(480) * 10000).astype(np.int16)
    assert is_speech(noise, sample_rate=16000) is True
```

**Step 2: Run test to verify it fails**

```bash
pip install pytest
pytest tests/test_listener.py -v
```

Expected: FAIL — `is_speech` not found.

**Step 3: Implement listener.py**

```python
# src/claude_voice/listener.py
import collections
import numpy as np
import sounddevice as sd
import webrtcvad

SAMPLE_RATE = 16000
FRAME_DURATION_MS = 30  # webrtcvad needs 10, 20, or 30ms frames
FRAME_SIZE = int(SAMPLE_RATE * FRAME_DURATION_MS / 1000)  # 480 samples
SILENCE_THRESHOLD = 1.5  # seconds of silence to end an utterance
SPEECH_THRESHOLD = 0.3   # seconds of speech to start recording

vad = webrtcvad.Vad(2)  # aggressiveness 0-3, 2 is balanced


def is_speech(audio_frame: np.ndarray, sample_rate: int = SAMPLE_RATE) -> bool:
    """Check if an audio frame contains speech using webrtcvad."""
    audio_bytes = audio_frame.astype(np.int16).tobytes()
    try:
        return vad.is_speech(audio_bytes, sample_rate)
    except Exception:
        return False


def listen_for_utterance() -> np.ndarray | None:
    """Block until a complete utterance is captured. Returns audio as int16 numpy array.

    Waits for speech to start, then records until silence is detected.
    Returns None if interrupted.
    """
    frames = []
    speech_frames = 0
    silence_frames = 0
    recording = False
    silence_limit = int(SILENCE_THRESHOLD * 1000 / FRAME_DURATION_MS)
    speech_limit = int(SPEECH_THRESHOLD * 1000 / FRAME_DURATION_MS)

    print("🎤 Listening...", flush=True)

    try:
        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype="int16",
            blocksize=FRAME_SIZE,
        ) as stream:
            while True:
                frame, _ = stream.read(FRAME_SIZE)
                frame = frame.flatten()
                speech = is_speech(frame)

                if not recording:
                    if speech:
                        speech_frames += 1
                        frames.append(frame)
                        if speech_frames >= speech_limit:
                            recording = True
                            print("🔴 Recording...", flush=True)
                    else:
                        speech_frames = 0
                        frames.clear()
                else:
                    frames.append(frame)
                    if speech:
                        silence_frames = 0
                    else:
                        silence_frames += 1
                        if silence_frames >= silence_limit:
                            break

        return np.concatenate(frames)

    except KeyboardInterrupt:
        return None
```

**Step 4: Run tests**

```bash
pytest tests/test_listener.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/claude_voice/listener.py tests/test_listener.py
git commit -m "feat: add audio capture with voice activity detection"
```

---

### Task 3: Whisper transcription

**Files:**
- Create: `src/claude_voice/transcriber.py`
- Create: `tests/test_transcriber.py`

**Step 1: Write the test**

```python
# tests/test_transcriber.py
from claude_voice.transcriber import transcribe
import numpy as np

def test_silence_transcribes_to_empty():
    silence = np.zeros(16000, dtype=np.int16)  # 1 second of silence
    result = transcribe(silence)
    assert isinstance(result, str)
    # Whisper may return empty or whitespace for silence
    assert len(result.strip()) < 20  # no meaningful speech detected
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/test_transcriber.py -v
```

Expected: FAIL — `transcribe` not found.

**Step 3: Implement transcriber.py**

```python
# src/claude_voice/transcriber.py
import numpy as np
import whisper

_model = None


def _get_model():
    global _model
    if _model is None:
        print("⏳ Loading Whisper model (first time may take a minute)...", flush=True)
        _model = whisper.load_model("base")
        print("✅ Whisper model loaded.", flush=True)
    return _model


def transcribe(audio: np.ndarray, sample_rate: int = 16000) -> str:
    """Transcribe audio using local Whisper model.

    Args:
        audio: int16 numpy array of audio samples
        sample_rate: sample rate of audio (default 16000)

    Returns:
        Transcribed text string
    """
    model = _get_model()
    # Whisper expects float32 normalized to [-1, 1]
    audio_float = audio.astype(np.float32) / 32768.0
    result = model.transcribe(audio_float, fp16=False)
    return result["text"].strip()
```

**Step 4: Run tests**

```bash
pytest tests/test_transcriber.py -v
```

Expected: PASS (will download base model on first run, ~150MB)

**Step 5: Commit**

```bash
git add src/claude_voice/transcriber.py tests/test_transcriber.py
git commit -m "feat: add Whisper transcription wrapper"
```

---

### Task 4: Wake word detection and command extraction

**Files:**
- Create: `src/claude_voice/commander.py`
- Create: `tests/test_commander.py`

**Step 1: Write the tests**

```python
# tests/test_commander.py
from claude_voice.commander import extract_command

def test_extracts_command_after_claude():
    assert extract_command("hey claude add milk to the list") == "add milk to the list"

def test_extracts_command_after_hey_claude():
    assert extract_command("hey claude what time is it") == "what time is it"

def test_returns_none_without_wake_word():
    assert extract_command("just talking about random stuff") is None

def test_case_insensitive():
    assert extract_command("Hey CLAUDE do something") == "do something"

def test_claude_at_end_returns_none():
    assert extract_command("I was talking to claude") is None

def test_strips_whitespace():
    assert extract_command("claude   fix the bug  ") == "fix the bug"
```

**Step 2: Run tests to verify they fail**

```bash
pytest tests/test_commander.py -v
```

Expected: FAIL — `extract_command` not found.

**Step 3: Implement commander.py**

```python
# src/claude_voice/commander.py
import re
import subprocess


def extract_command(transcript: str) -> str | None:
    """Extract command from transcript if wake word 'claude' is present.

    Returns the text after 'claude' as the command, or None if no wake word found.
    """
    match = re.search(r'\bclaude\b\s+(.+)', transcript, re.IGNORECASE)
    if match:
        command = match.group(1).strip()
        return command if command else None
    return None


def execute_command(command: str) -> str:
    """Execute a command via claude CLI and return the response."""
    print(f"⚡ Running: {command}", flush=True)
    try:
        result = subprocess.run(
            ["claude", "-p", command],
            capture_output=True,
            text=True,
            timeout=120,
        )
        output = result.stdout.strip()
        if result.returncode != 0 and result.stderr:
            output = f"Error: {result.stderr.strip()}"
        return output if output else "(no response)"
    except subprocess.TimeoutExpired:
        return "Command timed out after 120 seconds."
    except FileNotFoundError:
        return "Error: 'claude' CLI not found. Make sure Claude Code is installed."
```

**Step 4: Run tests**

```bash
pytest tests/test_commander.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/claude_voice/commander.py tests/test_commander.py
git commit -m "feat: add wake word detection and Claude CLI execution"
```

---

### Task 5: Text-to-speech output

**Files:**
- Create: `src/claude_voice/speaker.py`
- Create: `tests/test_speaker.py`

**Step 1: Write the test**

```python
# tests/test_speaker.py
from claude_voice.speaker import truncate_for_speech

def test_short_text_unchanged():
    assert truncate_for_speech("Done, added to list.") == "Done, added to list."

def test_long_text_truncated():
    long_text = "word " * 200
    result = truncate_for_speech(long_text)
    assert len(result) < 300
    assert result.endswith("...")
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/test_speaker.py -v
```

Expected: FAIL — `truncate_for_speech` not found.

**Step 3: Implement speaker.py**

```python
# src/claude_voice/speaker.py
import subprocess

MAX_SPEECH_CHARS = 200


def truncate_for_speech(text: str, max_chars: int = MAX_SPEECH_CHARS) -> str:
    """Truncate text to a reasonable length for TTS."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + "..."


def speak(text: str) -> None:
    """Speak text using macOS say command."""
    short = truncate_for_speech(text)
    try:
        subprocess.Popen(
            ["say", short],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except FileNotFoundError:
        pass  # not on macOS, skip TTS
```

**Step 4: Run tests**

```bash
pytest tests/test_speaker.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/claude_voice/speaker.py tests/test_speaker.py
git commit -m "feat: add text-to-speech via macOS say"
```

---

### Task 6: Wire up main loop

**Files:**
- Modify: `src/claude_voice/main.py`

**Step 1: Implement the main loop**

```python
# src/claude_voice/main.py
import signal
import sys

from claude_voice.listener import listen_for_utterance
from claude_voice.transcriber import transcribe
from claude_voice.commander import extract_command, execute_command
from claude_voice.speaker import speak


def main():
    print("🎙️  Claude Voice Listener")
    print("   Say 'claude' followed by your command.")
    print("   Press Ctrl+C to stop.\n")

    # Preload whisper model
    from claude_voice.transcriber import _get_model
    _get_model()

    while True:
        try:
            audio = listen_for_utterance()
            if audio is None:
                break

            transcript = transcribe(audio)
            if not transcript:
                continue

            print(f"💬 Heard: \"{transcript}\"", flush=True)

            command = extract_command(transcript)
            if command is None:
                print("   (no wake word detected, ignoring)", flush=True)
                continue

            print(f"📝 Command: \"{command}\"", flush=True)
            response = execute_command(command)
            print(f"\n✅ Response:\n{response}\n", flush=True)
            speak(response)

        except KeyboardInterrupt:
            print("\n👋 Stopping listener.")
            break


if __name__ == "__main__":
    main()
```

**Step 2: Test manually**

```bash
claude-voice
```

Expected: Shows startup message, loads Whisper model, starts listening. Say "hey claude what is two plus two" and it should transcribe, detect wake word, run `claude -p`, print and speak the response.

**Step 3: Commit**

```bash
git add src/claude_voice/main.py
git commit -m "feat: wire up main voice listener loop"
```

---

### Task 7: End-to-end manual test and polish

**Files:**
- Modify: `src/claude_voice/main.py` (if needed)

**Step 1: Run all unit tests**

```bash
pytest tests/ -v
```

Expected: All pass.

**Step 2: Run end-to-end manual test**

```bash
claude-voice
```

Test these scenarios:
1. Say nothing — should stay in listening mode
2. Say random words without "claude" — should print transcript and ignore
3. Say "hey claude, what is the capital of France" — should execute and respond
4. Say "claude, add a todo to airtable" — should execute via Claude with MCP tools
5. Press Ctrl+C — should exit cleanly

**Step 3: Fix any issues found during testing**

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: claude-voice-listener v0.1.0 ready"
```
