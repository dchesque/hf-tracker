# Supabase Authentication Setup

This document explains how to set up Supabase authentication with magic links for the hf-tracker application.

## Migration Required

Before testing the authentication, you need to run the profiles migration in your Supabase project.

### Steps to Run Migration:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `xqxxpjjaayvjmmqdorcj`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration**
   - Click "+ New query"
   - Copy and paste the entire content from: `supabase/migrations/005_create_profiles_table.sql`
   - Click "Run" or press `Ctrl+Enter`

4. **Verify the Migration**
   - Go to "Database" → "Tables"
   - You should see a new table called `profiles`
   - Check that the RLS policies are enabled

## Authentication Flow

### Magic Link (Passwordless)

1. User enters email on `/login` or `/signup`
2. Supabase sends a 6-digit OTP code to the email
3. User enters the code
4. Upon verification, user is authenticated and redirected to `/dashboard`

### Password Reset

1. User clicks "Forgot password?" on `/login`
2. User enters email on `/forgot-password`
3. Supabase sends a password reset link
4. User clicks the link and is redirected to `/auth/reset-password`

## Configuration

### Email Templates (Optional)

You can customize the email templates in Supabase:

1. Go to "Authentication" → "Email Templates"
2. Customize:
   - **Magic Link**: The OTP code email
   - **Password Reset**: The password reset email
   - **Confirm Signup**: (if using password-based signup)

### Redirect URLs

Make sure these URLs are allowed in Supabase:

1. Go to "Authentication" → "URL Configuration"
2. Add to "Redirect URLs":
   ```
   http://localhost:3003/auth/callback
   http://localhost:3000/auth/callback
   http://localhost:3001/auth/callback
   http://localhost:3002/auth/callback
   ```

## Testing Authentication

### Test Magic Link Login:

1. Visit http://localhost:3003/login
2. Enter your email
3. Check your email for the 6-digit code
4. Enter the code
5. You should be redirected to `/dashboard`

### Test Sign Up:

1. Visit http://localhost:3003/signup
2. Enter name and email (password field is ignored for magic link)
3. Check email for code
4. Verify and access dashboard

### Test Password Reset:

1. Visit http://localhost:3003/forgot-password
2. Enter your email
3. Check email for reset link
4. Click link to reset password

## Protected Routes

The following routes require authentication:
- `/dashboard`
- `/oportunidades`
- `/posicoes`
- `/historico`
- `/profile`
- `/subscription`
- `/configuracoes`

Unauthenticated users will be redirected to `/login`.

## Auth Functions Available

Located in `lib/supabase/auth.ts`:

- `signInWithMagicLink(email)` - Send OTP code
- `verifyOtp(email, token)` - Verify OTP code
- `signUpWithEmail(data)` - Create account with magic link
- `sendPasswordResetEmail(email)` - Send password reset
- `signOut()` - Sign out user
- `getCurrentUser()` - Get current user
- `getCurrentSession()` - Get current session
- `getUserProfile()` - Get user profile from profiles table
- `updateProfile(data)` - Update user profile

## Troubleshooting

### Magic Link Not Sending

1. Check Supabase logs in Dashboard → Authentication → Logs
2. Verify email settings in Dashboard → Project Settings → Email
3. Make sure email provider is configured correctly

### OTP Code Not Working

1. Codes expire after 60 seconds by default
2. Make sure the code is exactly 6 digits
3. Check for typos

### Redirect Not Working

1. Verify callback URL is in allowed list
2. Check middleware.ts is running
3. Check browser console for errors

## Database Schema

### profiles table

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

When a user signs up:
1. Supabase creates entry in `auth.users`
2. Trigger automatically creates entry in `public.profiles`
3. User data synced between tables
