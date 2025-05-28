# Career Path Navigator

A modern web application that helps users discover personalized learning paths for their career goals. Built with Next.js, TypeScript, and Neo4j, this application leverages graph algorithms to generate optimized learning paths tailored to each user's existing skills and career objectives.

## 🚀 Features

- **Job Exploration**: Browse available job positions and their required skills
- **Personalized Learning Paths**: Generate custom learning paths based on your current skills
- **Interactive Skill Visualization**: Graph-based visualization of skill prerequisites and relationships
- **User Authentication**: Secure user accounts with Firebase Authentication
- **Skill Management**: Track your existing skills and learning progress
- **Orphan Skill Detection**: Identify skills without clear prerequisites and get suggestions
- **Real-time Path Generation**: Dynamic path calculation using advanced graph algorithms

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Strongly-typed JavaScript for better development experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **shadcn/ui**: Modern component library built on Radix UI
- **Zustand**: Lightweight state management
- **ReactFlow**: Interactive node-based graph visualization

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **FastAPI**: High-performance Python web framework for graph algorithms
- **Uvicorn**: Lightning-fast ASGI server

### Database & Authentication
- **Neo4j**: Graph database for storing skills and their relationships
- **Firebase Authentication**: Secure user authentication service

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.0 or higher
- **Python** 3.10 or higher
- **Neo4j** 5.x
- **npm** or **pnpm** package manager

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yassinejebbouri/career-path-navigator.git
cd career-path-navigator
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install
# or
pnpm install

# Install Python dependencies
cd python-service
pip install -r requirements.txt
cd ..
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Neo4j Database Configuration
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# Python Service Configuration
PYTHON_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_PYTHON_SERVICE_URL=http://localhost:8000

# Firebase Authentication
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

#### Neo4j Setup
1. Install and start Neo4j Desktop or Neo4j Server
2. Create a new database instance
3. Set the password to match your `.env.local` configuration
4. Ensure the database is running on the configured port

#### Seed the Database
Populate the database with initial data:

```bash
# Start the Next.js development server first
npm run dev

# In another terminal, seed the database
curl -X POST http://localhost:3000/api/seed
```

### 5. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and configure sign-in methods
3. Copy your Firebase configuration to the `.env.local` file

## 🚀 Running the Application

### Development Mode

1. **Start the Python Service**
   ```bash
   cd python-service
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start the Next.js Development Server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. **Access the Application**
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
career-path-navigator/
├── app/                          # Next.js App Router directory
│   ├── api/                      # API route handlers
│   │   ├── seed/                 # Database seeding endpoints
│   │   ├── health/               # Health check endpoints
│   │   └── python-service/       # Python service proxy
│   ├── jobs/                     # Job listing and detail pages
│   ├── learning-path/            # Learning path visualization
│   ├── login/                    # Authentication pages
│   ├── signup/                   # User registration
│   ├── welcome/                  # Welcome dashboard
│   ├── debug/                    # Development debugging tools
│   ├── layout.tsx                # Root layout component
│   ├── page.tsx                  # Home page (redirects to login)
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
│   ├── ui/                       # shadcn/ui components
│   ├── auth-provider.tsx         # Authentication context
│   ├── header.tsx                # Navigation header
│   ├── logo.tsx                  # Application logo
│   ├── skill-dialog.tsx          # Skill information modal
│   ├── skill-node.tsx            # ReactFlow skill node component
│   ├── learning-path-visualizer.tsx # Learning path visualization
│   └── orphan-skill-view.tsx     # Orphan skill display component
├── hooks/                        # Custom React hooks
│   ├── use-mobile.tsx            # Mobile detection hook
│   └── use-toast.ts              # Toast notification hook
├── lib/                          # Utility functions and services
│   ├── api.ts                    # API client functions
│   ├── auth.ts                   # Authentication utilities
│   ├── neo4j.ts                  # Neo4j database connection
│   ├── types.ts                  # TypeScript type definitions
│   ├── utils.ts                  # General utility functions
│   ├── firebase.ts               # Firebase configuration
│   └── skills-service.ts         # Skills management service
├── public/                       # Static assets
│   └── images/                   # Application images
├── python-service/               # FastAPI microservice
│   ├── main.py                   # FastAPI application
│   ├── models/                   # ML models directory
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Python service environment
├── styles/                       # Additional stylesheets
├── package.json                  # Node.js dependencies and scripts
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── next.config.mjs               # Next.js configuration
├── components.json               # shadcn/ui configuration
└── README.md                     # Project documentation
```

## 🔌 API Endpoints

### Next.js API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seed` | Seed Neo4j database with initial data |
| GET | `/api/neo4j` | Test Neo4j connection |
| GET | `/api/health` | Application health check |
| GET | `/api/health/neo4j` | Neo4j health check |
| GET | `/api/health/python-service` | Python service health check |
| POST | `/api/python-service` | Proxy to Python service |
| POST | `/api/setup` | Set up demo user |

### Python Service API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate-path` | Generate learning path for a job |
| GET | `/health` | Python service health check |



### Common Issues

1. **Neo4j Connection Failed**
   - Ensure Neo4j is running on the correct port
   - Check your credentials in `.env.local`
   - Verify firewall settings

2. **Python Service Not Accessible**
   - Make sure the Python service is running on port 8000
   - Check if all Python dependencies are installed
   - Verify the `PYTHON_SERVICE_URL` environment variable

3. **Firebase Authentication Issues**
   - Verify Firebase configuration in `.env.local`
   - Check Firebase project settings
   - Ensure authentication methods are enabled


