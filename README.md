# Study Quiz AI (C version)

A terminal-based quiz app: paste your study notes into `notes.txt`, run the
program, and it asks Groq's free AI to write a 5-question multiple-choice
quiz based only on your notes. You answer in the terminal, get scored, and
see which topics to revise.

## How it works
1. `main.c` reads `notes.txt` and builds a JSON request.
2. It calls the `curl` command (installed by default on Windows 10/11, macOS,
   and most Linux systems) to send that request to Groq's API — this avoids
   needing a C networking library like libcurl.
3. It reads the AI's plain-text response and parses it into questions.
4. It runs the quiz in the terminal, tallies your score, and lists topics
   you got wrong.

## Setup

### 1. Install a C compiler
- **Windows**: install [MinGW-w64](https://www.mingw-w64.org/) or use the
  "Desktop development with C++" workload in Visual Studio. Alternatively,
  install [WSL](https://learn.microsoft.com/windows/wsl/install) and use its
  built-in gcc.
- **Mac**: open Terminal and run `xcode-select --install`.
- **Linux**: gcc is usually already installed; if not, `sudo apt install gcc`.

### 2. Get a free Groq API key (no credit card)
1. Go to console.groq.com and sign up with your email.
2. Click **API Keys > Create API Key**, name it, and copy it.

### 3. Set your API key as an environment variable
```
setx GROQ_API_KEY "your-key-here"      # Windows (restart terminal after)
export GROQ_API_KEY="your-key-here"    # Mac/Linux
```

### 4. Open the folder in VS Code
File > Open Folder > select this `study-quiz-c` folder.

### 5. Build it
Open a terminal in VS Code (Terminal > New Terminal) and run:
```
gcc main.c -o quiz          # Mac/Linux
gcc main.c -o quiz.exe      # Windows
```

### 6. Add your own notes (optional)
Edit `notes.txt` and replace the sample content with whatever you're
studying.

### 7. Run it
```
./quiz          # Mac/Linux
quiz.exe        # Windows
```

## Notes
- Model used: `llama-3.3-70b-versatile` via Groq's free tier — no cost.
- The quiz format the AI is asked to follow is plain text (not JSON), which
  keeps the C code much simpler than full JSON parsing.
- If something goes wrong, the program prints the raw API response so you
  can see exactly what happened — useful for debugging in an interview too.
