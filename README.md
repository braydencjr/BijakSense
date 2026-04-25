<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7b00d9a4-f961-4cf9-a666-ca001efbe4e9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run the Backend

**Prerequisites:** Python 3.11+ (Python 3.11/3.12 recommended), PostgreSQL, Redis

1. Go to the backend folder:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
   - **Windows (PowerShell/Cmd):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\activate
     ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: If using Python 3.13 on Windows, you may need to update version pins in requirements.txt if builds fail.)*

4. Set environment variables:
   Create a `.env` file in the `backend/` directory based on `.env.example`.

5. Start the API server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
