# Supabase Setup Guide for ICAMS Project

This guide will help you connect your ICAMS project to a real Supabase database.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in your project details:
   - **Name**: ICAMS (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose the closest region to your users
5. Click "Create new project" and wait for it to be set up (takes 1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll find:
   - **Project URL**: Copy this value
   - **anon/public key**: Copy this value (this is your `anon` key)

## Step 3: Set Up Environment Variables

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Copy the contents from `.env.example` and fill in your values:

```env
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Never commit your `.env` file to version control. It should already be in `.gitignore`.

## Step 4: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" to execute the SQL
5. You should see success messages for all table creations

## Step 5: Verify Tables Were Created

1. Go to **Table Editor** in your Supabase dashboard
2. You should see these tables:
   - `users`
   - `assets`
   - `maintenance_requests`
   - `feedback`
   - `notifications`

## Step 6: Install Dependencies

The Supabase client library should already be installed. If not, run:

```bash
npm install @supabase/supabase-js
```

## Step 7: Update Your Components

Now you can replace `localStorage` calls with Supabase database calls. Here's an example for `AssetManagement.tsx`:

### Before (using localStorage):
```typescript
const loadAssets = () => {
  const assetsData = localStorage.getItem('assets');
  if (assetsData) {
    setAssets(JSON.parse(assetsData));
  }
};
```

### After (using Supabase):
```typescript
import { getAssets } from '../../lib/database/assets';

const loadAssets = async () => {
  try {
    const data = await getAssets();
    setAssets(data);
  } catch (error) {
    console.error('Failed to load assets:', error);
    // Handle error (show toast notification, etc.)
  }
};
```

## Available Database Functions

### Users (`src/lib/database/users.ts`)
- `getUsers()` - Get all users
- `getUserById(id)` - Get user by ID
- `getUserByLoginId(loginId)` - Get user by login ID
- `createUser(user)` - Create a new user
- `updateUser(id, updates)` - Update a user
- `deleteUser(id)` - Delete a user

### Assets (`src/lib/database/assets.ts`)
- `getAssets()` - Get all assets
- `getAssetById(id)` - Get asset by ID
- `getAssetByAssetId(assetId)` - Get asset by asset ID
- `createAsset(asset)` - Create a new asset
- `updateAsset(id, updates)` - Update an asset
- `deleteAsset(id)` - Delete an asset

### Maintenance Requests (`src/lib/database/maintenance.ts`)
- `getMaintenanceRequests()` - Get all maintenance requests
- `getMaintenanceRequestById(id)` - Get request by ID
- `getMaintenanceRequestsByStaffId(staffId)` - Get requests by staff ID
- `createMaintenanceRequest(request)` - Create a new request
- `updateMaintenanceRequest(id, updates)` - Update a request
- `deleteMaintenanceRequest(id)` - Delete a request

### Feedback (`src/lib/database/feedback.ts`)
- `getFeedback()` - Get all feedback
- `getFeedbackById(id)` - Get feedback by ID
- `getFeedbackByStaffId(staffId)` - Get feedback by staff ID
- `createFeedback(feedback)` - Create new feedback
- `updateFeedback(id, updates)` - Update feedback
- `deleteFeedback(id)` - Delete feedback

### Notifications (`src/lib/database/notifications.ts`)
- `getNotifications()` - Get all notifications
- `getNotificationsByUserId(userId)` - Get notifications for a user
- `getUnreadNotificationsByUserId(userId)` - Get unread notifications
- `createNotification(notification)` - Create a notification
- `markNotificationAsRead(id)` - Mark as read
- `markAllNotificationsAsRead(userId)` - Mark all as read
- `deleteNotification(id)` - Delete a notification

## Security Considerations

1. **Row Level Security (RLS)**: The schema includes commented-out RLS policies. Enable them in production to secure your data.

2. **Authentication**: Currently, the project uses simple password authentication. For production, consider:
   - Using Supabase Auth for proper authentication
   - Hashing passwords (never store plain text passwords)
   - Implementing proper user sessions

3. **API Keys**: The `anon` key is safe to use in client-side code, but you should:
   - Set up proper RLS policies
   - Use service role key only on the server side (never expose it)

## Testing the Connection

1. Start your development server: `npm run dev`
2. Check the browser console for any connection errors
3. Try logging in with the demo credentials
4. Verify data is being saved to Supabase by checking the Table Editor

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure your `.env` file exists in the project root
- Verify the variable names are correct: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your development server after creating/updating `.env`

### "relation does not exist" error
- Make sure you ran the SQL schema file in Supabase SQL Editor
- Check that all tables were created successfully

### Connection errors
- Verify your Supabase URL and anon key are correct
- Check your internet connection
- Ensure your Supabase project is active (not paused)

## Next Steps

1. Replace all `localStorage` calls with Supabase database calls
2. Add error handling and loading states
3. Implement real-time subscriptions for live updates
4. Set up proper authentication with Supabase Auth
5. Configure Row Level Security policies

For more information, visit the [Supabase Documentation](https://supabase.com/docs).

