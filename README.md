# Fuel EU Maritime Compliance Module

A full-stack application for managing Fuel EU Maritime compliance, including route management, compliance tracking, banking operations, and pooling functionality.

## 🏗️ Architecture

This project follows **Hexagonal Architecture** (Ports & Adapters / Clean Architecture) principles:

- **Core Domain**: Business logic and domain models
- **Application Layer**: Use cases and business workflows
- **Ports**: Interfaces defining contracts
- **Adapters**: Implementations (HTTP, persistence, UI)

### Backend Structure

```
backend/
├── src/
│   ├── core/
│   │   ├── domain/          # Domain models
│   │   ├── application/     # Use cases
│   │   └── ports/           # Repository interfaces
│   └── adapters/
│       ├── http/            # Express routes
│       └── persistence/     # Mock repositories
```

### Frontend Structure

```
frontend/
├── src/
│   ├── core/
│   │   ├── domain/          # Domain models
│   │   ├── application/     # Use cases
│   │   └── ports/           # Service interfaces
│   └── adapters/
│       ├── infrastructure/  # HTTP clients
│       └── ui/              # React components
```

## 🚀 Setup & Run Instructions

### Prerequisites

- Node.js 18+ and npm
- TypeScript 5.3+

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

   The backend will start on `http://localhost:3001`

4. Build for production:
   ```bash
   npm run build
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:3000`

4. Build for production:
   ```bash
   npm run build
   npm run preview
   ```

## 📡 API Endpoints

### Routes

- `GET /api/routes` - Get all routes
- `POST /api/routes/:routeId/baseline` - Set baseline for a route
- `GET /api/routes/comparison?routeId=xxx&year=YYYY` - Get comparison data

### Compliance

- `GET /api/compliance/cb?year=YYYY` - Get compliance balance
- `GET /api/compliance/adjusted-cb?year=YYYY` - Get adjusted compliance balance per ship

### Banking

- `POST /api/banking/bank` - Bank positive compliance balance
  ```json
  {
    "year": 2024,
    "amount": 100000
  }
  ```

- `POST /api/banking/apply` - Apply banked surplus to deficit
  ```json
  {
    "year": 2024,
    "amount": 50000
  }
  ```

### Pools

- `POST /api/pools` - Create a pool with member ships
  ```json
  {
    "year": 2024,
    "memberShipIds": ["ship-001", "ship-002"]
  }
  ```

## 🧪 Testing

### Backend Type Checking

```bash
cd backend
npm run type-check
```

### Frontend Type Checking

```bash
cd frontend
npm run type-check
```

## 📊 Features

### 1. Routes Tab
- View all routes with filtering by vessel type, fuel type, and year
- Set baseline for routes
- Display route metrics (GHG intensity, fuel consumption, distance, emissions)

### 2. Compare Tab
- Compare baseline vs current route data
- Calculate percent difference
- Visualize GHG intensity with bar charts
- Check compliance against target (89.3368 gCO₂e/MJ)

### 3. Banking Tab
- View current compliance balance (CB)
- Bank positive CB for future use
- Apply banked surplus to cover deficits
- Real-time CB updates

### 4. Pooling Tab
- View adjusted compliance balance per ship
- Select ships to create pools
- Validate pool creation (sum of adjusted CBs must be ≥ 0)
- Display pool summary and created pools

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- TypeScript
- Mock persistence layer (ready for PostgreSQL integration)

### Frontend
- React 18
- TypeScript
- TailwindCSS
- Recharts for data visualization
- React Router for navigation
- Axios for HTTP requests

## 📝 Example API Requests

### Get All Routes
```bash
curl http://localhost:3001/api/routes
```

### Set Baseline
```bash
curl -X POST http://localhost:3001/api/routes/route-001/baseline \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "ghgIntensity": 85.5,
    "fuelConsumption": 5000000,
    "distance": 1200,
    "totalEmissions": 427500000
  }'
```

### Get Compliance Balance
```bash
curl http://localhost:3001/api/compliance/cb?year=2024
```

### Bank Surplus
```bash
curl -X POST http://localhost:3001/api/banking/bank \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "amount": 100000
  }'
```

## 🔮 Future Enhancements

- PostgreSQL database integration
- Authentication and authorization
- Unit and integration tests
- Docker containerization
- CI/CD pipeline
- Real-time updates via WebSockets
- Export functionality (CSV, PDF)
- Advanced analytics and reporting

## 📸 Screenshots

_Placeholder for screenshots of the application_

## 📄 License

ISC

