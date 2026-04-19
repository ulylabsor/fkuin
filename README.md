# Dashboard SDM FK UIN Raden Fatah Palembang

Sistem manajemen data kepegawaian untuk fakultas kedokteran UIN Raden Fatah Palembang.

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Frontend**: React.js + Vite + Tailwind CSS
- **Authentication**: JWT

## Prerequisites

- Node.js 18+
- MySQL 8.0+

## Setup

### 1. Database Setup

```bash
# Login ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE sdm_fk_uin;
EXIT;
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Edit file `.env` sesuai konfigurasi MySQL Anda:

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sdm_fk_uin
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
```

Jalankan backend:

```bash
npm run dev
# atau
npm start
```

Server akan berjalan di `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## Default Login

- **Username**: admin
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current admin

### Data Management
- `GET /api/dosen-sarjana` - List semua dosen sarjana
- `GET /api/pembimbing-klinik` - List semua pembimbing klinik
- `GET /api/tendik` - List semua tendik
- `POST /api/dosen-sarjana` - Tambah dosen sarjana
- `PUT /api/dosen-sarjana/:id` - Update dosen sarjana
- `DELETE /api/dosen-sarjana/:id` - Hapus dosen sarjana

### Statistics
- `GET /api/stats` - Get statistik dashboard

## Project Structure

```
sdmfk/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # API controllers
│   ├── middleware/      # Auth middleware
│   ├── routes/         # API routes
│   └── server.js       # Entry point
├── frontend/
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── components/ # React components
│   │   ├── context/    # Auth context
│   │   └── pages/      # Page components
│   └── ...
└── README.md
```

## Features

- Login admin dengan JWT
- Dashboard overview dengan statistik
- CRUD untuk 3 kategori personel:
  - Dosen Sarjana (26 data)
  - Pembimbing Klinik (13 data)
  - Tendik & Laboran (21 data)
- Checklist dokumen kelengkapan
- Progress tracking per persone
- Search dan filter data
