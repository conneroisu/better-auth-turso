# Next.js Better Auth + Turso Example

A complete Next.js application demonstrating authentication using Better Auth with the Turso database adapter.

## Features

- 🔐 **Email & Password Authentication** - Sign up and sign in with email
- 🛡️ **Protected Routes** - Dashboard requires authentication
- 🗄️ **Turso Database** - Uses the better-auth-turso adapter
- 🎨 **Modern UI** - Clean interface with Tailwind CSS
- 📱 **Responsive Design** - Works on desktop and mobile
- ⚡ **React Hooks** - Seamless authentication state management
- 🔄 **Session Management** - Automatic session handling

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Optional: Turso account for remote database (uses local SQLite by default)
- Better Auth CLI for database migrations: `npm install -g @better-auth/cli`

### Installation

1. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   BETTER_AUTH_SECRET=your-secret-key-here
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
   
   # Optional: Use Turso remote database
   # TURSO_DATABASE_URL=libsql://your-database.turso.io
   # TURSO_AUTH_TOKEN=your-auth-token
   ```

3. **Generate database schema (optional):**
   ```bash
   bun run db:generate
   # or
   npm run db:generate
   ```
   
   This creates a `schema.sql` file with all required tables. For local development, tables are created automatically.

4. **Run the development server:**
   ```bash
   bun dev
   # or
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...all]/     # Better Auth API routes
│   ├── dashboard/             # Protected dashboard page
│   ├── signin/                # Sign in page
│   ├── signup/                # Sign up page
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/                # Reusable components (future)
└── lib/
    ├── auth.ts                # Better Auth server configuration
    └── auth-client.ts         # Better Auth client hooks
```

## How It Works

### Authentication Flow

1. **Server Setup** (`src/lib/auth.ts`):
   - Configures Better Auth with Turso adapter
   - Sets up email/password authentication
   - Configures session management

2. **API Routes** (`src/app/api/auth/[...all]/route.ts`):
   - Handles all authentication endpoints
   - Uses Next.js API routes with Better Auth

3. **Client Integration** (`src/lib/auth-client.ts`):
   - Provides React hooks for authentication
   - Manages client-side authentication state

4. **Protected Routes**:
   - Dashboard requires authentication
   - Automatic redirects for unauthenticated users

### Database Integration

The app uses the `tursoAdapter` from `better-auth-turso`:

- **Local Development**: Uses SQLite file (`file:./local.db`)
- **Production**: Can use Turso remote database
- **Auto-migration**: Tables are created automatically
- **Type Safety**: Full TypeScript support

## Environment Configuration

### Local Development (Default)

Uses local SQLite database - no external dependencies needed:

```env
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
```

### Production with Turso

For production deployment with Turso database:

```env
BETTER_AUTH_SECRET=your-production-secret
BETTER_AUTH_URL=https://your-domain.com
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

## Available Scripts

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun start` - Start production server
- `bun lint` - Run ESLint
- `bun test` - Run tests
- `bun type-check` - TypeScript type checking
- `bun run db:generate` - Generate database schema SQL file
- `bun run db:migrate` - Apply database migrations (for compatible adapters)

## Testing

The example includes automated tests that verify:

- Authentication flow (sign up, sign in, sign out)
- Protected route access
- Database integration
- Session management

Run tests with:
```bash
bun test
```

## Database Migrations

This example demonstrates how to use the Better Auth CLI for database management:

### Schema Generation

Generate the SQL schema for your database:

```bash
bun run db:generate
```

This creates a `schema.sql` file with all required tables:
- `user` - User accounts and profiles
- `session` - User sessions  
- `account` - OAuth and credential accounts
- `verification` - Email/phone verification tokens

### Local Development

For local SQLite development, tables are created automatically when the app starts. No manual migration needed.

### Production Deployment

For production Turso databases:

1. **Generate schema:**
   ```bash
   bun run db:generate
   ```

2. **Apply to Turso database:**
   ```bash
   turso db shell your-database < schema.sql
   ```

### Adding Plugins

When adding Better Auth plugins (like 2FA, organization management), regenerate the schema:

```bash
# Add plugin to auth.ts
bun run db:generate  # Regenerate schema with new tables
```

See `migrate.md` for detailed migration workflows and best practices.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app is a standard Next.js application and can be deployed to:
- Netlify
- Railway
- DigitalOcean App Platform
- Any Node.js hosting provider

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**:
   - Make sure all dependencies are installed: `bun install`
   - Check that the adapter is properly linked in development

2. **Authentication not working**:
   - Verify `BETTER_AUTH_SECRET` is set
   - Check that URLs match between server and client config
   - Ensure API routes are accessible

3. **Database connection issues**:
   - For local development, the SQLite file will be created automatically
   - For Turso, verify your `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`

### Debug Mode

Enable debug logging by setting in `.env.local`:
```env
NODE_ENV=development
```

This will show detailed logs for all database operations.

## Learn More

- [Better Auth Documentation](https://better-auth.com)
- [Turso Documentation](https://docs.turso.tech)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)