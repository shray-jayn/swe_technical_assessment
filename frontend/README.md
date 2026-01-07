# Frontend - Vehicle Management Dashboard

A modern Next.js 16 application for managing and viewing vehicle information. Built with TypeScript, Tailwind CSS, and shadcn/ui components.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Building for Production](#building-for-production)
- [Deployment to Vercel](#deployment-to-vercel)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.x or higher)
- **npm** (version 9.x or higher) or **yarn** or **pnpm**
- A running backend API server (see backend README for setup)

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

## Environment Variables

The application requires environment variables to configure the API endpoint.

### Creating Environment Files

1. Create a `.env.local` file in the `frontend` directory (this file is gitignored):
```bash
# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

2. For production, create a `.env.production` file:
```bash
# .env.production
NEXT_PUBLIC_BACKEND_URL=https://your-production-api-url.com
```

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API base URL | `http://localhost:8000` | No |

**Note:** In Next.js, only environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Make sure your backend URL doesn't contain sensitive credentials.

### Example `.env.local` File

```env
# Backend API URL
# For local development, point to your local backend server
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# For production deployments, use your deployed backend URL
# NEXT_PUBLIC_BACKEND_URL=https://your-backend.vercel.app
```

## Local Development

1. Make sure your backend server is running (see backend README).

2. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

The page will automatically reload when you make changes to the code.

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server (requires build first)
- `npm run lint` - Run ESLint to check code quality

## Building for Production

To build the application for production:

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

To preview the production build locally:

```bash
npm run build
npm run start
```

## Deployment to Vercel

Vercel is the recommended platform for deploying Next.js applications. This project includes a `vercel.json` configuration file for optimal deployment settings including SPA routing support.

### Vercel Configuration (`vercel.json`)

The project includes a `vercel.json` file that configures:

- **Security Headers**: Adds security headers for XSS protection, frame options, and content type options
- **SPA Routing Support**: Can be extended with rewrites for explicit SPA routing configuration (Next.js handles routing automatically)

The `vercel.json` file is located in the root directory and contains:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Note:** For Next.js applications, SPA routing is automatically handled by Next.js's App Router. The `vercel.json` file provides security headers and can be extended with additional Vercel-specific configurations like redirects or rewrites if needed.

### Prerequisites for Vercel Deployment

- A [Vercel account](https://vercel.com/signup) (free tier available)
- Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Your backend API deployed and accessible via HTTPS

### Step-by-Step Deployment

#### Option 1: Deploy via Vercel Dashboard (Recommended for beginners)

1. **Push your code to GitHub/GitLab/Bitbucket**
   - Make sure your frontend code is in a Git repository
   - Push it to GitHub, GitLab, or Bitbucket

2. **Import your project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository
   - Select the repository containing your frontend code

3. **Configure project settings**
   - **Root Directory**: If your frontend is in a subdirectory, set it to `frontend`
   - **Framework Preset**: Should auto-detect as "Next.js"
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
   - **Note**: The `vercel.json` file will be automatically detected and used for deployment configuration

4. **Configure Environment Variables**
   - In the "Environment Variables" section, add:
     - Variable: `NEXT_PUBLIC_BACKEND_URL`
     - Value: Your production backend API URL (e.g., `https://your-backend.vercel.app`)
   - Select all environments (Production, Preview, Development)

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - You'll get a deployment URL (e.g., `https://your-app.vercel.app`)

#### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Navigate to the frontend directory**:
```bash
cd frontend
```

4. **Deploy**:
```bash
vercel
```

5. **Follow the prompts**:
   - Link to an existing project or create a new one
   - Configure settings as needed

6. **Set environment variables**:
```bash
vercel env add NEXT_PUBLIC_BACKEND_URL
```
   - Enter your backend API URL when prompted
   - Select all environments

7. **Deploy to production**:
```bash
vercel --prod
```

### Post-Deployment Configuration

1. **Verify Environment Variables**
   - Go to your project settings in Vercel Dashboard
   - Navigate to "Environment Variables"
   - Ensure `NEXT_PUBLIC_BACKEND_URL` is set correctly
   - Redeploy if you changed any variables

2. **Custom Domain (Optional)**
   - In project settings, go to "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

3. **Test Your Deployment**
   - Visit your deployment URL
   - Test all functionality to ensure it connects to your backend API

### Environment Variables on Vercel

To add or update environment variables in Vercel:

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to "Settings" → "Environment Variables"
4. Add or edit variables:
   - **Name**: `NEXT_PUBLIC_BACKEND_URL`
   - **Value**: Your backend API URL
   - **Environments**: Select Production, Preview, and/or Development
5. Click "Save"
6. Redeploy your application for changes to take effect

**Important:** After changing environment variables, you must redeploy for the changes to apply. You can trigger a redeploy from the "Deployments" tab.

### Vercel.json Configuration

The `vercel.json` file in the root directory provides deployment configuration:

#### SPA Routing

Next.js automatically handles SPA routing through its App Router system. When deployed on Vercel:

- **Client-side navigation**: Handled automatically by Next.js
- **Direct URL access**: Next.js serves the correct page for each route
- **Browser refresh**: Works correctly on all routes (e.g., `/vehicles/ABC123`)
- **Deep linking**: All routes are accessible via direct URLs

The `vercel.json` file can be extended with rewrites if you need custom routing behavior, but for standard Next.js apps, the framework handles routing automatically.

#### Security Headers

The configuration includes security headers:
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser XSS filter

#### Customizing vercel.json

You can customize the `vercel.json` file to add:
- **Redirects**: For URL redirects
- **Headers**: Additional security or caching headers
- **Rewrites**: Custom routing rules
- **Functions**: Serverless function configuration

**Example: Adding SPA Routing Rewrites**

If you need explicit SPA routing configuration (e.g., for static exports or custom routing), you can add rewrites to `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Note:** The rewrite pattern `"source": "/((?!api/).*)"` routes all requests except API routes to the root, enabling SPA behavior. For standard Next.js apps, this is usually not necessary as Next.js handles routing automatically.

For more information, see the [Vercel Configuration Documentation](https://vercel.com/docs/project-configuration).

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── vehicles/          # Vehicle-related pages
│       └── [vin]/         # Dynamic route for vehicle details
│           └── page.tsx
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── vehicle-dashboard.tsx
│   ├── vehicle-gallery.tsx
│   └── theme-provider.tsx
├── lib/                  # Utility functions and API client
│   ├── api.ts           # API client functions
│   ├── types.ts         # TypeScript type definitions
│   └── utils.ts         # Utility functions
├── public/              # Static assets
├── .env.local          # Local environment variables (gitignored)
├── vercel.json         # Vercel deployment configuration (SPA routing, headers)
├── next.config.ts      # Next.js configuration
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Technologies Used

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **Lucide React** - Icon library

## Troubleshooting

### Build Errors

If you encounter build errors:
- Ensure all dependencies are installed: `npm install`
- Clear the `.next` directory and rebuild: `rm -rf .next && npm run build`
- Check that all environment variables are set correctly

### API Connection Issues

- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Ensure your backend server is running and accessible
- Check CORS settings on your backend if accessing from a different domain
- For Vercel deployments, ensure your backend URL uses HTTPS

### Port Already in Use

If port 3000 is already in use:
```bash
# Use a different port
npm run dev -- -p 3001
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
