# Better Auth + Turso Next.js Example

A complete Next.js application demonstrating authentication using Better Auth with the Turso database adapter.

## Features

- ✅ **Authentication**: Email/password and OAuth (GitHub)
- ✅ **Protected Routes**: Middleware-based route protection
- ✅ **Modern UI**: Built with Tailwind CSS and Radix UI
- ✅ **TypeScript**: Full type safety throughout
- ✅ **Database**: Turso edge database with local development support
- ✅ **Session Management**: Secure session handling
- ✅ **Responsive Design**: Mobile-first responsive layout

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the environment file and configure:

```bash
cp .env.example .env.local
```

For local development, the default configuration uses a local SQLite file. For production, configure your Turso database credentials.

### 3. Generate Database Schema

```bash
npm run db:generate
```

### 4. Setup Database

```bash
npm run db:setup
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

### Required

```env
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

### Turso Database (Production)

```env
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

### Optional OAuth Providers

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Database Configuration

### Local Development

By default, the application uses a local SQLite file (`dev.db`) for development. This requires no additional setup.

### Production with Turso

1. Create a Turso database:
   ```bash
   turso db create your-database-name
   ```

2. Get your database URL:
   ```bash
   turso db show your-database-name --url
   ```

3. Create an auth token:
   ```bash
   turso db tokens create your-database-name
   ```

4. Update your environment variables with the URL and token.

## Project Structure

```
examples/nextjs/
├── app/                    # Next.js app directory
│   ├── api/auth/          # Authentication API routes
│   ├── dashboard/         # Protected dashboard page
│   ├── signin/           # Sign in page
│   ├── signup/           # Sign up page
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── auth/             # Authentication components
│   └── ui/               # UI components
├── lib/                  # Utility libraries
│   ├── auth.ts           # Better Auth configuration
│   ├── auth-client.ts    # Client-side auth utilities
│   └── utils.ts          # General utilities
├── middleware.ts         # Next.js middleware for route protection
└── scripts/             # Setup scripts
```

## Authentication Flow

1. **Sign Up**: Users can create accounts with email/password
2. **Sign In**: Email/password or OAuth (GitHub) sign in
3. **Session Management**: Automatic session handling with secure cookies
4. **Protected Routes**: Middleware redirects unauthenticated users
5. **Sign Out**: Clean session termination

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The application can be deployed to any platform supporting Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

Make sure to:
1. Set all required environment variables
2. Run database setup after deployment
3. Configure your BETTER_AUTH_URL to match your domain

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript check
- `npm run db:generate` - Generate database schema
- `npm run db:setup` - Setup database with schema

### Adding OAuth Providers

To add more OAuth providers, update the auth configuration in `lib/auth.ts`:

```typescript
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
},
```

### Customizing UI

The UI components are built with:
- **Tailwind CSS** for styling
- **Radix UI** for headless components
- **Lucide React** for icons

Customize the theme in `tailwind.config.js` and component styles in `app/globals.css`.

## Troubleshooting

### Database Connection Issues

1. **Local Development**: Ensure the SQLite file has proper permissions
2. **Turso Production**: Verify your `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
3. **Schema Issues**: Run `npm run db:generate` and `npm run db:setup`

### Authentication Issues

1. **CORS Errors**: Check your `BETTER_AUTH_URL` configuration
2. **Session Issues**: Verify your `BETTER_AUTH_SECRET` is set
3. **OAuth Issues**: Confirm client ID/secret and callback URLs

### Build Issues

1. **Type Errors**: Run `npm run type-check` to identify issues
2. **Missing Dependencies**: Run `npm install` to ensure all packages are installed
3. **Environment Variables**: Ensure all required vars are set in production

## Learn More

- [Better Auth Documentation](https://better-auth.com)
- [Turso Documentation](https://docs.turso.tech)
- [Next.js Documentation](https://nextjs.org/docs)

## License

This example is provided under the MIT License.