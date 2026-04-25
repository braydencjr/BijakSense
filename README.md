<div align="center">
  <img src="src/assets/logo.jpg" width="450" alt="BijakSense Logo" />
  <h1>BijakSense</h1>
  <p><strong>The Wise AI Decision Co-pilot for SEA SME Merchants</strong></p>
  <p>Empowering local businesses with multi-agent intelligence, real-time market data, and automated supply chain optimization.</p>
</div>

[![PRD](https://img.shields.io/badge/Documentation-PRD-brightgreen?style=for-the-badge&logo=read-the-docs&logoColor=white)](https://drive.google.com/file/d/1C0eiduOcYLEJVILck6CaEqqk3O8ZCMpc/view?usp=drive_link)

[![SAD](https://img.shields.io/badge/Documentation-SAD-brightgreen?style=for-the-badge&logo=read-the-docs&logoColor=white)](https://drive.google.com/file/d/10QViZrUGrdzFMteeqZa1dWqcLq0MdUD0/view?usp=drive_link)

[![QAT](https://img.shields.io/badge/Documentation-QAT-brightgreen?style=for-the-badge&logo=read-the-docs&logoColor=white)](https://drive.google.com/file/d/1NAcysdx1-dl-sQK7LTKLyGyeSz8rvXsp/view?usp=drive_link)

---

## Table of Contents
- [Overview](#overview)
- [Problem Overview](#problem-overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Multi-Agent System](#multi-agent-system)
- [Future Roadmap](#future-roadmap)
- [Team](#team)
- [Acknowledgements](#acknowledgements)

## Overview
BijakSense is a comprehensive AI-powered platform designed to act as a "wise co-pilot" for Small and Medium Enterprises (SMEs) in Southeast Asia, particularly Malaysia. By unifying real-time geospatial intelligence, robust machine learning predictions, and an Agent-to-Agent (A2A) LLM architecture, BijakSense transforms raw market and climate data into actionable business strategies.

## Problem Overview
SME merchants operating in SEA face a highly volatile landscape:
- **Supply Chain Fragility**: Sudden weather events (like seasonal monsoons) disrupt local agriculture and logistics, causing unpredictable spikes in raw material costs.
- **Blind Market Competition**: Merchants often lack visibility into what competitors are charging or where foot traffic is highest, leading to poor pricing strategies and sub-optimal branch expansion decisions.
- **Data Overload**: While datasets (like DOSM Open Data) exist, they are too massive and complex for a small business owner to analyze manually. They need synthesized, actionable insights, not just dashboards.

## Key Features
- **Intelligence Map**: Dynamic, real-time visualization of your business landscape. Monitor supply chain disruptions, weather events, and viral consumer trends as they happen.
- **Automated Inventory Planning**: Take the guesswork out of procurement. Our AI monitors commodity price fluctuations and lead times so you are always updated and informed.
- **Market Opportunity Detection**: Stay ahead of the competition. Detect regional trends (like the next viral food trend) before they hit your turf.
- **Conversational Co-pilot**: A unified chat interface where you can consult our AI agent suite on any business decisions.

## Architecture
BijakSense employs a **Hybrid Insight Engine** that integrates two powerful paradigms:
1. **Deterministic Machine Learning**: A Scikit-Learn Random Forest model ingests 100M+ rows of DOSM historical price data and real-time Open-Meteo weather data to forecast 30-day commodity price trajectories.
2. **Generative AI Narrative**: The ML outputs are fed into a Large Language Model (Gemini / Ilmu AI) which acts as an analyst, converting numerical predictions into conversational, actionable business advice.

This decoupling ensures that even if the LLM API experiences downtime, the system falls back to structured, ML-derived insights seamlessly.

## Tech Stack
### Frontend
- **Framework**: React 19, TypeScript
- **Build & Routing**: Vite 6, React Router v7
- **Styling**: Tailwind CSS v4, Lucide React, Framer Motion
- **Maps & Charts**: React-Leaflet, Recharts

### Backend
- **Framework**: FastAPI (Python 3.11+), Uvicorn
- **Database & ORM**: PostgreSQL, SQLAlchemy 2.0 (Asyncpg), Alembic
- **Caching & Tasks**: Redis, Celery
- **AI & ML**: Scikit-Learn 1.6.1, Pandas, PyArrow, Anthropic API, Google GenAI SDK

## Project Structure
```text
BijakSense/
├── backend/
│   ├── agents/         # A2A LLM Specialist Agents
│   ├── artifacts/      # Serialized ML Models (.joblib)
│   ├── models/         # SQLAlchemy DB Models
│   ├── routers/        # FastAPI Endpoints (Analysis, Chat, etc.)
│   ├── scripts/        # Data Ingestion (Parquet -> Postgres)
│   └── utils/          # ML Predictors, API Clients (GLM, Weather)
├── src/
│   ├── assets/         # Images and SVGs
│   ├── components/     # Reusable React UI Components
│   ├── data/           # Frontend Mock Data Fallbacks
│   ├── lib/            # Utilities (Caching, Utils)
│   └── pages/          # Application Views (Map, Planner, Chat)
├── package.json        # Frontend Dependencies
└── README.md           # Documentation
```

## Quick Start
**Prerequisites:** Node.js, Python 3.11+, PostgreSQL, Redis

### 1. Data Ingestion (Backend)
The system uses historical market price data (100M+ records) from DOSM.
```bash
cd backend
./scripts/download_dataset.sh  # Downloads ~4GB of Parquet files
python scripts/import_parquet.py # Imports data into PostgreSQL
```

### 2. Start the Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
# Ensure your .env is configured (see below)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start the Frontend
In a new terminal at the project root:
```bash
npm install
npm run dev
```

## Environment Variables
Create a `.env` file in the `backend/` directory using `.env.example` as a template:
```env
ZAI_API_KEY=YOUR_API_KEY
ZAI_BASE_URL=https://api.ilmu.ai/anthropic
ZAI_MODEL=ilmu-glm-5.1
GEMINI_API_KEY=GEMINI_API_KEY
TAVILY_API_KEY=TAVILY_API_KEY
GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY
DATABASE_URL=postgresql+asyncpg://merchantmind:password@localhost:5432/merchantmind
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## API Reference
- `GET /api/analysis/inventory`: Runs the Random Forest model across merchant inventory and generates an LLM-powered supply chain strategy narrative.
- `GET /api/analysis/predict/{item_code}`: Returns the pure ML forecast for a specific commodity.
- `GET /api/signals/regional`: Fetches simulated regional macro-economic and weather alerts for the map.
- `POST /api/chat`: Interacts with the Multi-Agent orchestrator.

## Multi-Agent System
BijakSense operates on an **Agent-to-Agent (A2A)** architecture, where multiple specialist LLM agents collaborate to solve your problems:

- **Market Analyst**: Scours the web and local data to identify consumer demand shifts, competitor pricing strategies, and emerging saturation risks.
- **Inventory Planner**: Analyzes market prices (MYR) and weather-related logistics risks to optimize your stock levels.
- **Ops Advisor**: Provides practical advice on staffing, operating hours, and daily logistics based on predicted foot traffic and local events.
- **Orchestrator**: Consults with the specialists, weighs their individual perspectives, and synthesizes a single, actionable plan.

## Future Roadmap
- **POS Integration**: Direct sync with Square or local SEA Point-of-Sale systems for real-time inventory deduction.
- **Supplier Bidding Network**: Automated generation of RFPs (Requests for Proposal) sent directly to local wholesalers when inventory runs low.
- **Mobile Application**: A React Native companion app for on-the-go alerts.

## Team
Developed by team **git force push** with love.
| Team Member | Contribution |
|------------|-------------|
| Brayden Chong Jie Rui | Led the team and designed the overall system architecture, ensuring all components worked cohesively. Developed the Orchestrator to route signals and user queries to the appropriate agents, and built the Market Analyst Agent for trend detection, competitor analysis, and pricing recommendations. |
| Ong Yean | Implemented core machine learning and signal processing logic, transforming external data into structured inputs. Developed the Inventory Planner Agent to handle supply forecasting, cost analysis, and restocking recommendations. |
| Cheah Yi Chern | Developed the Operations Advisor Agent, focusing on staffing decisions and event-based operational adjustments. Contributed to backend integration to ensure smooth communication between services and APIs. |
| Goh Sheng Fung | Developed the Location Scout Agent to analyze foot traffic, infrastructure changes, and expansion opportunities. Implemented logic to convert geographic signals into actionable business insights. |
| Chin Yiu Ern | Built the frontend interface, including the dashboard, Intelligence Map, and AI chat experience. Conducted quality assurance testing to ensure system stability, visual consistency, and demo readiness. |

## Acknowledgements

### Market Data
This project utilizes the **PriceCatcher: Transactional Records** dataset provided by:
- **Ministry of Domestic Trade**
- **Department of Statistics Malaysia (DOSM)**

The data is sourced from [OpenDOSM](https://open.dosm.gov.my/data-catalogue/pricecatcher) and is made available under the **Creative Commons Attribution 4.0 International License (CC BY 4.0)**.

### Weather and Climate Data
Real-time weather analysis and live insights are powered by the [Open-Meteo API](https://open-meteo.com/). For the underlying price prediction models, we utilized the **[Agrometeorological indicators from 1979 to present](https://cds.climate.copernicus.eu/datasets/sis-agrometeorological-indicators)** dataset from the Copernicus Climate Data Store. 

This project contains modified Copernicus Climate Change Service information [2026] via ECMWF/EU and is licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/). All data is provided "as is" without warranty; neither ECMWF nor the European Union are liable for its use, accuracy, or any resulting damages. This project is an independent work and is not sponsored, approved, or endorsed by ECMWF or the European Union.

ML analysis for inventory price prediction: [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1jFSBd-lcWbhvCQhxSMKEvpeRSL_9Amg4?usp=sharing)
