# Weekend FC League - FIFA 25 Community League

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://www.weekendfc.online)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.0-3ECF8E?style=for-badge&logo=supabase)](https://supabase.com/)

## 🌟 Live Demo

**Weekend FC League is live at: [https://www.weekendfc.online](https://www.weekendfc.online)**

## 📖 Overview

Weekend FC League is a comprehensive FIFA 25 community league management system built for the Weekend FC community. It provides a complete solution for managing players, tournaments, fixtures, standings, and statistics in a modern, responsive web application.

## ✨ Features

### 🏆 **Tournament Management**
- Create and manage multiple tournaments
- Set start/end dates with date pickers
- Activate/deactivate tournaments globally
- Automatic fixture generation (round-robin)
- Support for odd/even player counts
- Tournament status tracking (DRAFT, ACTIVE, COMPLETED)

### 👥 **Player Management**
- Manual player creation with detailed profiles
- CSV import functionality for bulk player addition
- Player profiles with gamer tags and locations
- Active player tracking and roster management
- Player statistics and performance metrics

### ⚽ **Fixtures & Matches**
- Automatic round-robin fixture generation
- Weekend-only scheduling (spread evenly)
- Match result reporting and score tracking
- Fixture regeneration with randomization
- Export fixture lists
- Matchday organization

### 📊 **Statistics & Standings**
- Real-time league table with live data
- Top scorers, assists, and discipline tracking
- Automatic stat calculation from match results
- Manual stat editing for admins
- Player performance analytics
- Historical data tracking

### 🎮 **League Operations**
- Comprehensive admin dashboard
- Live overview with active tournament data
- Settings management and configuration
- User authentication and admin access
- Responsive design for all devices

### 📱 **User Experience**
- Modern dark theme design
- Mobile-responsive interface
- Intuitive navigation
- Real-time data updates
- Professional typography (Roboto headings, Courier New body)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Package Manager**: pnpm
- **Fonts**: Roboto (headings), Courier New (body text)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm package manager
- Supabase account and project
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/andex23/WEEKND-FC-LEAGUE.git
   cd WEEKND-FC-LEAGUE
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Database Setup**
   Run the provided SQL scripts in your Supabase SQL editor:
   - `scripts/fix-fixtures-constraints.sql` - Fixes database constraints
   - Additional schema setup as needed

5. **Run Development Server**
   ```bash
   pnpm dev
   ```

6. **Build for Production**
   ```bash
   pnpm build
   ```

## 🗄️ Database Schema

### Core Tables
- **players**: Player profiles and information
- **tournaments**: Tournament details and status
- **fixtures**: Match schedules and results
- **league_settings**: Global league configuration
- **player_stats**: Individual player statistics

### Key Relationships
- Tournaments have multiple fixtures
- Fixtures reference players for home/away teams
- Player stats are calculated from fixture results
- League settings control active tournament

## 🔧 API Endpoints

### Admin Routes
- `POST /api/admin/players` - Player CRUD operations
- `POST /api/admin/tournaments` - Tournament management
- `POST /api/admin/generate-fixtures` - Fixture generation
- `POST /api/admin/stats` - Statistics management
- `POST /api/admin/settings` - League settings

### Public Routes
- `GET /api/standings` - League standings
- `GET /api/fixtures` - Fixture information
- `GET /api/player-stats` - Player statistics

## 🎨 Design System

### Typography
- **Headings**: Roboto (700 weight, uppercase)
- **Body Text**: Courier New (monospace)
- **Navigation**: Consistent uppercase styling

### Color Scheme
- **Primary**: Dark theme with purple accents
- **Background**: Deep blacks and grays
- **Text**: High contrast whites and grays
- **Accents**: Purple highlights for interactive elements

### Responsive Design
- Mobile-first approach
- Breakpoint-based layouts
- Touch-friendly interactions
- Optimized for all screen sizes

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
vercel --prod
```

## 📱 Mobile Responsiveness

The application is fully responsive with:
- Mobile-optimized navigation
- Touch-friendly buttons and forms
- Responsive tables and layouts
- Adaptive spacing and typography
- Mobile-specific admin overlay

## 🔐 Security Features

- Supabase Row Level Security (RLS)
- Admin-only access to sensitive operations
- Secure API endpoints with proper validation
- Environment variable protection
- Service role key for admin operations

## 🧪 Testing

Test endpoints are available for debugging:
- `/api/test-db` - Database connection test
- `/api/test-env` - Environment variable check
- `/api/test-admin` - Admin client test
- `/api/test-admin-delete` - Delete operation test

## 📈 Performance

- Server-side rendering with Next.js
- Optimized database queries
- Efficient state management
- Lazy loading where appropriate
- Optimized bundle sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary to Weekend FC Community.

## 🆘 Support

For support and questions:
- **Discord**: [https://discord.gg/YZumc42p](https://discord.gg/YZumc42p)
- **Telegram**: Contact admin
- **Website**: [https://www.weekendfc.online](https://www.weekendfc.online)

## 🎯 Roadmap

- [ ] Advanced tournament formats
- [ ] Player transfer system
- [ ] Historical data archives
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Integration with EA FC APIs

---

**Built with ❤️ for the Weekend FC Community**

*Last updated: December 2024*
