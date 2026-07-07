# Reframe

Reframe is a focused video brief tool built by HalftoneMotion. A client sends a reference video. Instead of watching the whole thing and taking manual notes, you paste the YouTube URL or drop in a video file, and Reframe returns a structured creative brief.

## Getting Started

### 1. Clone and Install
```bash
git clone https://github.com/Udx3012/Reframe.git
cd Reframe
npm install
```

### 2. Set up environment variables
Create a `.env` file from the template:
```bash
cp .env.example .env
```

And define:
- `GEMINI_API_KEY`
- `YOUTUBE_API_KEY`

### 3. Run development server
```bash
npm run dev
```
