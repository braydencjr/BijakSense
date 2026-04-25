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

### Market Data
This project utilizes the **PriceCatcher: Transactional Records** dataset provided by:
- **Ministry of Domestic Trade**
- **Department of Statistics Malaysia (DOSM)**

The data is sourced from [OpenDOSM](https://open.dosm.gov.my/data-catalogue/pricecatcher) and is made available under the **Creative Commons Attribution 4.0 International License (CC BY 4.0)**.

### Weather and Climate Data
AI-powered weather analysis and price predictions are powered by the [Open-Meteo API](https://open-meteo.com/).

### Model Training Data
The predictive machine learning models were trained using the **[Agrometeorological indicators from 1979 to present](https://cds.climate.copernicus.eu/datasets/sis-agrometeorological-indicators)** dataset. This provides high-resolution surface meteorological data essential for modeling agricultural yields and market price fluctuations.
- **Source**: Contains modified Copernicus Climate Change Service information [2026] via ECMWF/EU.
- **License**: [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **Disclaimer**: Data is provided "as is" without warranty; neither ECMWF nor the EU are liable for its use, accuracy, or any resulting damages.
- **No Endorsement**: This project is not sponsored, approved, or endorsed by ECMWF or the European Union.
