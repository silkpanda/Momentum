# Momentum Web App - API Configuration

## Summary

The Momentum web application has been successfully configured to communicate with the deployed API on Render.

## Changes Made

### 1. Environment Configuration
- **Created `.env.local`**: Contains the Render API URL
  ```
  INTERNAL_API_URL=https://momentum-api-vpkw.onrender.com/api/v1
  ```
- **Created `.env.example`**: Template for local development
- **Note**: `.env.local` is gitignored for security

### 2. Updated Configuration File
- **File**: `lib/config.ts`
- **Changes**: 
  - Added `API_BASE_URL` export that reads from `INTERNAL_API_URL` environment variable
  - Falls back to `http://localhost:3001/api/v1` for local development
  - Added `CLIENT_API_URL` for potential client-side usage

### 3. Fixed All BFF Routes
Updated all Backend-for-Frontend (BFF) routes to use `API_BASE_URL` from config instead of hardcoded URLs:

#### Auth Routes
- ✅ `app/web-bff/auth/login/route.ts`
- ✅ `app/web-bff/auth/signup/route.ts`
- ✅ `app/web-bff/auth/me/route.ts`

#### Page Data Routes
- ✅ `app/web-bff/tasks/page-data/route.ts`
- ✅ `app/web-bff/store/page-data/route.ts`
- ✅ `app/web-bff/quests/page-data/route.ts`
- ✅ `app/web-bff/routines/page-data/route.ts`
- ✅ `app/web-bff/meals/page-data/route.ts`
- ✅ `app/web-bff/family/page-data/route.ts`
- ✅ `app/web-bff/family/members/page-data/route.ts`

#### Action Routes
- ✅ `app/web-bff/tasks/[id]/complete/route.ts`
- ✅ `app/web-bff/store/[id]/purchase/route.ts`
- ✅ `app/web-bff/routines/route.ts`
- ✅ `app/web-bff/routines/[id]/[action]/route.ts`
- ✅ `app/web-bff/quests/route.ts`
- ✅ `app/web-bff/quests/[id]/[action]/route.ts`

#### Meal Routes
- ✅ `app/web-bff/meals/restaurants/route.ts`
- ✅ `app/web-bff/meals/recipes/route.ts`
- ✅ `app/web-bff/meals/plans/route.ts`

#### Family Routes
- ✅ `app/web-bff/family/members/route.ts`
- ✅ `app/web-bff/family/members/[id]/route.ts`

## How to Use

### For Production (Render API)
The webapp is now configured to use the Render API by default via `.env.local`.

### For Local Development
To switch back to local API:
1. Edit `.env.local`
2. Change `INTERNAL_API_URL` to:
   ```
   INTERNAL_API_URL=http://localhost:3001/api/v1
   ```

### Running the Web App
```bash
cd momentum-web
npm run dev
```

The app will now communicate with: `https://momentum-api-vpkw.onrender.com/api/v1`

## Next Steps

1. **Restart the dev server** if it's currently running to pick up the new environment variables
2. **Test the webapp** to ensure it can communicate with the Render API
3. **Monitor for CORS issues** - if you encounter CORS errors, you may need to update the API's CORS configuration to allow requests from your webapp's domain

## Important Notes

- The `.env.local` file is gitignored and won't be committed to version control
- Each developer/environment can have their own `.env.local` file
- For deployment, set the `INTERNAL_API_URL` environment variable in your hosting platform
- The webapp uses a BFF (Backend-for-Frontend) pattern, so all API calls go through Next.js API routes first

## Troubleshooting

### If the webapp can't connect to the API:
1. Check that the Render API is running: https://momentum-api-vpkw.onrender.com/api/v1
2. Verify the `.env.local` file exists and has the correct URL
3. Restart the Next.js dev server
4. Check browser console for CORS or network errors

### If you see "Cannot find module '@/lib/config'":
- Make sure you're in the `momentum-web` directory
- Run `npm install` to ensure all dependencies are installed
- Check that `lib/config.ts` exists
