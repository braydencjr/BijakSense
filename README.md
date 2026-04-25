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

4. Set environment variables:
   Create a `.env` file in the `backend/` directory based on `.env.example`.

5. Start the API server:
   `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

## Data Ingestion

The system uses historical market price data (100M+ records) from DOSM. Follow these steps to populate your database:

1. **Download Data**:
   ```bash
   cd backend
   ./scripts/download_dataset.sh
   ```
   *Note: This downloads ~4GB of Parquet files covering 2022-2026.*

2. **Import to PostgreSQL**:
   ```bash
   python scripts/import_parquet.py
   ```
   *Note: Ensure your `DATABASE_URL` is correctly set in `backend/.env` before running.*

## Credits and License

This project utilizes the **PriceCatcher: Transactional Records** dataset provided by:
- **Ministry of Domestic Trade**
- **Department of Statistics Malaysia (DOSM)**

The data is sourced from [OpenDOSM](https://open.dosm.gov.my/data-catalogue/pricecatcher) and is made available under the **Creative Commons Attribution 4.0 International License (CC BY 4.0)**.
