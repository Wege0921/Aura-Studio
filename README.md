# AURA Yoga Web App

A comprehensive yoga and pilates booking web application for women-only studio management.

## Features

- 🧘‍♀️ Class scheduling and booking
- 💳 Package management and payments
- 👤 User authentication and profiles
- 📱 Mobile-first responsive design
- 📊 Admin dashboard and analytics
- 🔔 Notifications and reminders

## Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT tokens
- **File Uploads**: Multer

## Project Structure

```
aura-yoga-app/
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
├── database/          # Database schema and migrations
├── docs/             # Documentation
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL
- Git

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-deps
   ```

3. Set up environment variables (see .env.example files)

4. Set up database:
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. Start development servers:
   ```bash
   npm run dev
   ```

The frontend will run on http://localhost:3000
The backend will run on http://localhost:5000

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://username:password@localhost:5432/aura_yoga"
JWT_SECRET="your-jwt-secret"
NODE_ENV="development"
PORT=5000
```

### Frontend (.env)
```
REACT_APP_API_URL="http://localhost:5000"
REACT_APP_ENV="development"
```

## Development

- Frontend: React app with TypeScript and TailwindCSS
- Backend: Express API with TypeScript
- Database: Prisma ORM with PostgreSQL

## Deployment

Production deployment instructions coming soon...

## License

MIT License
