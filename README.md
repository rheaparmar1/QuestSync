# Course Calendar

A web app for University of Waterloo students to parse course outlines and schedules into calendar files.

## Setup

### Prerequisites
- Node.js (for frontend)
- Python 3.8+ (for backend)
- Git

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file based on `.env.example` and add your Anthropic API key
6. Run the server: `uvicorn main:app --reload`

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Running the App
- Backend will run on `http://localhost:8000`
- Frontend will run on `http://localhost:5173` (or similar, check console)

## Features
- Upload course outline PDFs
- Upload Quest schedule screenshots
- Extract important dates and classes using Claude AI
- Generate .ics calendar files for Apple Calendar, Google Calendar, and Outlook

## Security
- Never commit `.env` files or API keys
- Always verify `.env` is in `.gitignore` before pushing