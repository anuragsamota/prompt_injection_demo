# Prompt Injection Demo

An interactive web-based demonstration of prompt injection attacks and defense mechanisms in LLM applications. This project showcases various prompt injection scenarios and implements safety mechanisms to detect and mitigate such attacks.

## Project Overview

This demo illustrates:
- **Direct prompt injection** - Attacking the system prompt directly
- **Indirect prompt injection** - Injecting through untrusted content
- **Obfuscated injection** - Using token smuggling and encoding techniques
- **Defense mechanisms** - Filters, validation, and safety gates to prevent attacks

The project provides an interactive UI for exploring these concepts in real-time.

## Tech Stack

### Frontend
- **React** 19.2.4 - UI framework
- **Vite** 8.0.0 - Build tool and dev server with HMR
- **Tailwind CSS** 4.2.1 - Utility-first CSS framework
- **daisyUI** 5.5.19 - Component library on top of Tailwind
- **React Router** 7.13.1 - Client-side routing
- **React Markdown** 10.1.0 - Markdown rendering for model outputs
- **Lucide React** 0.577.0 - Icon library
- **ESLint** 9.39.4 - Code linting
- **React Compiler** - Enabled for improved performance

### Backend
- **Node.js** - Runtime environment
- **Express** 5.2.1 - Web framework
- **Dotenv** 17.3.1 - Environment configuration
- **Nodemon** 3.1.14 - Auto-reload during development
- **pnpm** 10.32.1 - Package manager (monorepo support)

## Project Structure

```
prompt_injection_demo/
├── backend/                                 # Node.js/Express backend
│   ├── index.js                            # Entry point
│   ├── package.json                        # Backend dependencies
│   └── pnpm-lock.yaml                      # Lock file
│
└── frontend/
    └── prompt_injection_demo_frontend/     # React/Vite frontend
        ├── src/
        │   ├── main.jsx                    # App entry point
        │   ├── index.css                   # Global styles (Tailwind + daisyUI)
        │   ├── app/
        │   │   └── AppRouter.jsx           # Route definitions
        │   ├── components/
        │   │   ├── chat/                   # Chat UI components
        │   │   ├── sidebar/                # Navigation sidebar
        │   │   ├── ui/                     # Icon components
        │   │   └── common/                 # Shared components
        │   ├── pages/                      # Page components
        │   ├── layout/                     # Layout components
        │   ├── services/
        │   │   └── chatEngine.js           # API communication layer
        │   ├── state/
        │   │   └── uiContext.jsx           # Global UI state management
        │   ├── data/
        │   │   └── mockData.js             # Sample/mock data
        │   └── lib/
        │       └── utils.js                # Utility functions
        ├── docs/                           # Project documentation
        │   └── resources/
        │       ├── 00_stack_overview.md
        │       ├── 01_react_vite_baseline.md
        │       ├── 02_styling_tailwind_daisyui.md
        │       ├── 03_routing_and_linting.md
        │       ├── 04_prompt_injection_ui_considerations.md
        │       ├── 05_source_index.md
        │       ├── 06_phase1_blueprint.md
        │       └── 07_frontend_backend_contract.md
        ├── public/                         # Static assets
        ├── vite.config.js                  # Vite configuration
        ├── eslint.config.js                # ESLint configuration
        ├── package.json                    # Frontend dependencies
        └── pnpm-lock.yaml                  # Lock file
```

## Prerequisites

- **Node.js** 18.x or higher
- **pnpm** 10.32.1 or higher (run `npm install -g pnpm` if not installed)
- A code editor (VS Code recommended)

## Setup Instructions

### 1. Clone and Navigate to Project

```bash
cd prompt_injection_demo
```

### 2. Install Backend Dependencies

```bash
cd backend
pnpm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend/prompt_injection_demo_frontend
pnpm install
```

### 4. Environment Configuration (Backend)

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
```

Add any API keys or configuration needed for LLM integration.

## Running the Project

### Option 1: Run Backend and Frontend in Separate Terminals

**Terminal 1 - Backend:**
```bash
cd backend
pnpm run dev
```

The backend will start on `http://localhost:5000` (or the port specified in `.env`)

**Terminal 2 - Frontend:**
```bash
cd frontend/prompt_injection_demo_frontend
pnpm run dev
```

The frontend will start on `http://localhost:5173` (default Vite port)

### Option 2: Run Both Concurrently (from root directory)

From the root directory, you can set up a script to run both:
```bash
cd backend && pnpm run dev & cd ../frontend/prompt_injection_demo_frontend && pnpm run dev
```

## Development

### Frontend Development

```bash
cd frontend/prompt_injection_demo_frontend

# Start dev server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Run linting
pnpm run lint
```

**Frontend Features:**
- Hot Module Reloading (HMR) for instant UI updates
- React Compiler enabled for optimized performance
- Tailwind CSS + daisyUI for rapid component development
- React Router for multi-page scenarios

### Backend Development

```bash
cd backend

# Start dev server with auto-reload
pnpm run dev

# Start production server
pnpm run start
```

**Backend Features:**
- Nodemon watches for file changes and auto-restarts
- Express.js for routing and middleware
- Environment-based configuration

## Frontend Architecture

### State Management
- **UIContext** (`src/state/uiContext.jsx`) - Global UI state using React Context API
- **Persistence** (`src/state/persistence.js`) - State persistence utilities

### Chat Engine
- **chatEngine.js** - Handles communication with backend and streaming responses
- Provides `sendMessage` and `stopStreaming` methods for message handling

### Pages
- **ChatPage** - Main chat interface with attacks/defenses
- **SampleScenarioPage** - Predefined prompt injection scenarios
- **SamplesPage** - Example demonstrations

### Utilities
- **SystemPromptPanel** - View and edit system prompts
- **ConsolePanel** - Display debug information and outputs
- **MarkdownMessage** - Render model responses with markdown formatting

## Backend API Contract

Frontend communicates with backend via REST/Streaming APIs defined in [Frontend-Backend Contract](frontend/prompt_injection_demo_frontend/docs/resources/07_frontend_backend_contract.md).

Key endpoints (to be implemented):
- `POST /api/chat` - Send message and get response
- `POST /api/check-injection` - Analyze for prompt injection risk
- `GET /api/scenarios` - Fetch sample injection scenarios

## Styling

The project uses **Tailwind CSS 4** with **daisyUI 5** for component styling:

- Global styles in `src/index.css`
- Component-level utilities via Tailwind classes
- daisyUI theme variables for consistent design
- Avoid custom shorthand tokens; use Tailwind arbitrary values (e.g., `max-w-[1860px]`)

For more details, see [Tailwind + daisyUI Documentation](frontend/prompt_injection_demo_frontend/daisyui_llms_docs.md)

## Project Documentation

Detailed documentation is available in the [docs/resources](frontend/prompt_injection_demo_frontend/docs/resources) directory:

- **00_stack_overview.md** - Tech stack and project wiring
- **01_react_vite_baseline.md** - React + Vite setup details
- **02_styling_tailwind_daisyui.md** - Styling approach and guidelines
- **03_routing_and_linting.md** - Router and code quality setup
- **04_prompt_injection_ui_considerations.md** - Security UX patterns
- **05_source_index.md** - File structure and component inventory
- **06_phase1_blueprint.md** - First phase implementation plan
- **07_frontend_backend_contract.md** - API contract between frontend and backend

## Common Tasks

### Add a New Component

```bash
cd frontend/prompt_injection_demo_frontend
pnpm dlx shadcn@latest add @lucide-animated/<icon-name>
```

Then import from `src/components/ui/`

### Build Frontend for Production

```bash
cd frontend/prompt_injection_demo_frontend
pnpm run build
```

Output will be in `dist/` directory

### Lint Frontend Code

```bash
cd frontend/prompt_injection_demo_frontend
pnpm run lint
```

## Next Steps / Roadmap

1. Implement backend API endpoints
2. Integrate LLM provider API (OpenAI, Anthropic, etc.)
3. Build prompt injection detection logic
4. Create safety filtering pipelines
5. Add audit logging and monitoring
6. Implement scenario-based demonstrations
7. Add educational content and explanations

## Security Considerations

This is a **demonstration project** for educational purposes. When implementing prompt injection safety in production:

- Never trust user input without validation
- Implement strict input/output filtering
- Use separate execution environments for untrusted content
- Log and monitor all user interactions
- Follow OWASP guidelines for LLM security
- Conduct regular security audits

## Contributing

When contributing to this project:

- Follow the existing code style (ESLint enforced)
- Keep components focused and reusable
- Update documentation when adding features
- Use descriptive commit messages
- Test changes in both frontend and backend

## Troubleshooting

### Port Already in Use
If port 5000 (backend) or 5173 (frontend) is in use:
```bash
# Find and kill process on port (Linux/Mac)
lsof -i :5000  # for backend
lsof -i :5173  # for frontend

# Update backend port in .env
PORT=5001
```

### pnpm Lock File Issues
```bash
# Reinstall dependencies
rm pnpm-lock.yaml
pnpm install
```

### Vite HMR Issues
Clear Vite cache:
```bash
rm -rf frontend/prompt_injection_demo_frontend/node_modules/.vite
```

## License

[Add your license here]

## Contact

[Add contact information or team details]

---

**Last Updated:** March 2026  
**Status:** In Development
