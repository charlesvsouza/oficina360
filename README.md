# Oficina360 - Multi-tenant SaaS for Automotive Workshops

<p align="center">
  <img src="https://via.placeholder.com/150x50?text=Oficina360" alt="Oficina360" />
</p>

A complete multi-tenant SaaS application for managing automotive workshops with subscription billing, service orders, inventory, and financial management.

## Tech Stack

**Backend:**
- Node.js + NestJS
- Prisma ORM
- PostgreSQL
- JWT Authentication

**Frontend:**
- React + Vite
- TailwindCSS
- Zustand (State Management)
- React Router

**Infrastructure:**
- Docker + Docker Compose

## Features

### Subscription Plans

| Feature | BASIC | PREMIUM | MASTER |
|---------|-------|---------|--------|
| Customers | ✅ | ✅ | ✅ |
| Vehicles | ✅ | ✅ | ✅ |
| Service Orders | ✅ | ✅ | ✅ |
| Manual Financial | ✅ | ✅ | ✅ |
| Inventory | ❌ | ✅ | ✅ |
| Dashboard Analytics | ❌ | ✅ | ✅ |
| WhatsApp Notifications | ❌ | ✅ | ✅ |
| Service Approval Link | ❌ | ✅ | ✅ |
| Advanced Reports | ❌ | ❌ | ✅ |
| Automation Triggers | ❌ | ❌ | ✅ |

### Core Modules

- **Tenants** - Multi-tenant workshop management
- **Users** - Role-based access (Admin, Manager, Mechanic, Reception, Finance)
- **Customers** - Customer CRM
- **Vehicles** - Vehicle management with plate tracking
- **Service Orders** - Full OS lifecycle with timeline
- **Services Catalog** - Service pricing and duration
- **Inventory** - Parts and stock management (Premium+)
- **Financial** - Income/expense tracking
- **Subscriptions** - Plan-based access control

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+

### Development Setup

1. **Clone and install dependencies:**

```bash
# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd frontend
npm install
```

2. **Configure environment:**

```bash
cp backend/.env.example backend/.env
# Edit .env with your database credentials
```

3. **Start database:**

```bash
docker-compose up -d postgres
```

4. **Run migrations and seed:**

```bash
cd backend
npx prisma migrate dev
npm run prisma:seed
```

5. **Start development servers:**

```bash
# Backend (terminal 1)
cd backend && npm run start:dev

# Frontend (terminal 2)
cd frontend && npm run dev
```

### Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Manager | manager@demo.com | manager123 |
| Mechanic | mechanic@demo.com | mechanic123 |

## API Endpoints

### Authentication
- `POST /auth/register` - Register new tenant
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token

### Tenants
- `GET /tenants/me` - Get current tenant
- `PATCH /tenants/me` - Update tenant

### Users
- `GET /users` - List users
- `POST /users` - Create user (Admin)
- `PATCH /users/:id` - Update user

### Customers
- `GET /customers` - List customers
- `POST /customers` - Create customer
- `PATCH /customers/:id` - Update customer

### Vehicles
- `GET /vehicles` - List vehicles
- `POST /vehicles` - Create vehicle
- `PATCH /vehicles/:id` - Update vehicle

### Service Orders
- `GET /service-orders` - List OS
- `POST /service-orders` - Create OS
- `PATCH /service-orders/:id` - Update OS
- `POST /service-orders/:id/request-approval` - Request approval

### Inventory (Premium+)
- `GET /inventory/parts` - List parts
- `POST /inventory/parts` - Create part
- `POST /inventory/movements` - Stock movement

### Financial
- `GET /financial` - List transactions
- `POST /financial` - Create transaction
- `GET /financial/summary` - Financial summary

### Subscriptions
- `GET /subscriptions/current` - Current subscription
- `GET /subscriptions/plans` - Available plans
- `POST /subscriptions/change-plan` - Change plan

## Project Structure

```
oficina360/
├── backend/
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── tenants/       # Tenant management
│   │   ├── users/         # User management
│   │   ├── customers/     # Customer CRM
│   │   ├── vehicles/      # Vehicle management
│   │   ├── service-orders/# OS management
│   │   ├── services/      # Services catalog
│   │   ├── inventory/    # Inventory (Premium+)
│   │   ├── financial/    # Financial module
│   │   ├── subscriptions/# Subscription management
│   │   ├── common/       # Shared utilities
│   │   └── prisma/       # Prisma service
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.ts      # Seed script
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── store/       # Zustand stores
│   │   ├── App.tsx      # Main app
│   │   └── main.tsx     # Entry point
│   ├── index.html
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

MIT License - See LICENSE file for details.