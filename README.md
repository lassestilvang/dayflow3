# Dayflow - Daily Task & Calendar Planner

A modern, professional daily planner web application that consolidates tasks, events, and calendars into one intuitive interface.

## Features

### Core Features
- **Unified Calendar View** - Weekly, daily, and monthly views with time blocks
- **Task Management** - Organized by categories (Inbox, Work, Family, Personal, Travel)
- **Drag & Drop** - Move tasks between time slots and dates
- **Subtasks** - Support for nested task lists
- **Priority Levels** - High, medium, and low priority tasks
- **Due Dates & Scheduling** - Set due dates and specific times for tasks
- **Dark Theme** - Modern dark mode by default

### Integrations (Planned)
- **Calendar Sync** - Google Calendar, Outlook, Apple Calendar, Fastmail
- **Task Management** - Notion, ClickUp, Linear, Todoist
- **Collaboration** - Shared events and team features

### Advanced Features (Planned)
- **Natural Language Entry** - "Lunch with Sarah at 1 PM tomorrow"
- **Smart Scheduling** - AI-powered task scheduling suggestions
- **Recurring Tasks/Events** - Set up repeating items

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: Auth.js
- **Animations**: Framer Motion
- **Drag & Drop**: @dnd-kit
- **Testing**: Jest (unit) + Playwright (E2E)
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm package manager
- Neon PostgreSQL database (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dayflow-planner
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
   
   # Auth.js
   AUTH_SECRET="your-auth-secret-here"
   AUTH_URL="http://localhost:3000"
   
   # OAuth Providers (optional)
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""
   GITHUB_CLIENT_ID=""
   GITHUB_CLIENT_SECRET=""
   ```

4. **Set up the database**
   ```bash
   # Generate database migrations
   pnpm db:generate
   
   # Push schema to database
   pnpm db:push
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking
- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:e2e` - Run Playwright E2E tests
- `pnpm test:e2e:ui` - Run E2E tests with UI
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── calendar/          # Calendar components
│   ├── tasks/             # Task management components
│   ├── ui/                # shadcn/ui components
│   └── layout/            # Layout components
├── lib/                   # Utility libraries
│   ├── auth/              # Authentication configuration
│   ├── db/                # Database configuration
│   └── utils/             # Utility functions
├── store/                 # Zustand state management
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

## Testing

### Unit Tests
Run unit tests with Jest:
```bash
pnpm test
```

### E2E Tests
Run end-to-end tests with Playwright:
```bash
# First time setup
pnpm exec playwright install

# Run tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui
```

## Database Schema

The application uses the following main tables:

- **users** - User accounts and profiles
- **tasks** - Task items with categories, priorities, and scheduling
- **events** - Calendar events with attendees and locations
- **integrations** - External service connections
- **shared_events** - Event sharing and permissions

## Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Set production environment variables**

3. **Start the production server**
   ```bash
   pnpm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `pnpm test` and `pnpm test:e2e`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review existing issues and discussions

## Roadmap

- [ ] Calendar integrations (Google, Outlook, etc.)
- [ ] Task management integrations (Notion, ClickUp, etc.)
- [ ] Collaboration features
- [ ] Natural language task entry
- [ ] Mobile app
- [ ] Desktop app (Electron)
- [ ] Advanced analytics and reporting
- [ ] Team management features
- [ ] API for third-party integrations
