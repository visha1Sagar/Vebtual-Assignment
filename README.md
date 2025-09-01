# Email Template AI Generator

A web application that allows users to chat with an AI assistant to generate HTML email templates from product URLs with real-time streaming and live preview.

## Features

- **Chat Interface**: Interactive conversation with AI assistant
- **Product URL Processing**: Extract metadata from 1-10 product URLs
- **Real-time Streaming**: Watch HTML code generate in real-time
- **Live Preview**: See the email template render as it's being created
- **Copy to Clipboard**: Easy copying of final HTML code
- **Mock Mode**: Test the app without OpenAI API keys

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React
- **AI**: OpenAI GPT-3.5-turbo
- **Styling**: CSS with React Icons

## Setup

### Prerequisites

- Python 3.8+
- Node.js 14+
- OpenAI API key (optional for mock mode)

### Backend Setup

1. Navigate to the project root directory
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the backend:
   ```bash
   python app.py
   ```
   The backend will start on http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
   The frontend will start on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Enter your OpenAI API key (optional)
3. Describe your email campaign (tone, audience, etc.)
4. Provide 1-10 product URLs (one per line)
5. Watch the HTML code stream in real-time (only with api key)
6. See the live preview update as the template generates
7. Copy the final HTML when complete

