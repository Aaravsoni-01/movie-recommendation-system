# 🎬 CineTier — Full-Stack Movie Recommendation & Tier List System

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18+-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-SQLAlchemy-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

CineTier is a modern, full-stack web application designed for movie enthusiasts. It allows users to rate films into interactive drag-and-drop tier lists (**S/A/B/C/D**), explore production studios, navigate chronological release timelines, and receive personalized recommendations powered by content-based and collaborative filtering algorithms.

---

## ✨ Features

- **🏆 Interactive Tier Lists**: Drag-and-drop films into custom S/A/B/C/D tiers to curate your personal favorites.
- **🧠 Smart Recommendation Engine**: Suggests movies based on your rating patterns using TF-IDF genre keyword analysis and collaborative filtering.
- **🏢 Studio Explorer**: Browse iconic production houses (Marvel Studios, A24, Studio Ghibli, Warner Bros., Toho) and dive deep into their film catalogs and stats.
- **⏳ Chronological Timeline**: Journey through cinema history with an interactive horizontal timeline grouped by decade.
- **🎭 Mood-Based Recommendations**: Tell the app what you're feeling (*Funny, Scary, Thrilling, Epic, Heartwarming, Thoughtful*) for instant curated picks.
- **📊 Analytics Dashboard**: Visualize your watch habits with interactive genre distribution pie charts and rating breakdown bar graphs.
- **🔒 JWT Authentication**: Secure user login and registration to save and manage personal tier profiles.
- **🔌 OMDb & IMDb Integration**: Pre-seeded with 100+ iconic movies and ready to fetch live metadata from OMDb API.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite with SQLAlchemy ORM & Alembic migrations
- **Validation**: Pydantic v2
- **Auth**: JWT tokens (`python-jose`) + Bcrypt password hashing (`passlib`)
- **Machine Learning**: `scikit-learn` & `numpy` (Cosine similarity for recommendations)
- **External API**: Async HTTP client (`httpx`) connecting to OMDb API

### **Frontend**
- **Framework**: React 18 powered by Vite
- **Styling**: Tailwind CSS (Dark theme with custom glassmorphism utilities)
- **Drag & Drop**: `@dnd-kit/core` & `@dnd-kit/sortable`
- **Charts**: `Recharts`
- **Animations**: `Framer Motion`
- **Icons**: `Lucide React`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/Aaravsoni-01/movie-recommendation-system.git
cd movie-recommendation-system
```

### 2. Backend Setup
Create a virtual environment and install dependencies:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt
```

Set up your environment variables by copying `.env.example`:
```bash
cp .env.example .env
```
*(Optional: Add your free [OMDb API Key](http://www.omdbapi.com/apikey.aspx) inside `.env`)*

Start the FastAPI backend server:
```bash
uvicorn backend.main:app --reload
```
> The API server will run at **`http://localhost:8000`**. You can explore the interactive Swagger documentation at **`http://localhost:8000/docs`**.

---

### 3. Frontend Setup
Open a new terminal window, navigate to the `frontend` folder, and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
> The frontend web application will run at **`http://localhost:5173`**.

---

## 🐳 Docker Deployment (One-Command Setup)

You can launch the entire system using Docker & Docker Compose:

```bash
docker-compose up --build
```
This will containerize the backend and launch the application seamlessly.

---

## 📁 Project Structure

```text
movie-recommendation-system/
├── backend/
│   ├── models/          # SQLAlchemy Database Models (User, Movie, Tier, Watchlist)
│   ├── routers/         # REST API Endpoints (/auth, /movies, /tiers, /studios, /recommendations)
│   ├── schemas/         # Pydantic Request & Response Schemas
│   ├── services/        # Business Logic (ML Recommender, OMDb Fetcher, Chronological Sorter)
│   ├── scripts/         # Database Seeder (100+ iconic movies pre-loaded)
│   ├── config.py        # App Configuration & Environment Variables
│   ├── database.py      # SQLite Connection & Session Manager
│   └── main.py          # FastAPI Application Entry Point
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios API Client
│   │   ├── components/  # Reusable UI Components (MovieCard, TierRow, Navbar, Modal)
│   │   ├── context/     # React Auth Context
│   │   ├── pages/       # Application Views (Home, Tiers, Studios, Recommendations, Dashboard)
│   │   └── index.css    # Tailwind CSS & Glassmorphism Design System
│   ├── package.json     # Node Dependencies
│   └── vite.config.js   # Vite Configuration
├── Dockerfile           # Backend Container Build Configuration
├── docker-compose.yml   # Multi-Container Orchestration
└── requirements.txt     # Python Dependencies
```

---

## 🔑 Demo Credentials

When running locally for the first time, the database is automatically seeded with 100+ popular movies and a demo account:
- **Username**: `demo`
- **Password**: `demo123`

---

## 📝 License
This project is licensed under the MIT License. Feel free to use it for learning or portfolio purposes!
