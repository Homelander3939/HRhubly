# Application Credentials

This document lists the default credentials for accessing the HR Assessment Platform.

## Demo Business Admin Login

### Business Name
```
demo
```

### Admin User (Primary)
```
Username: admin
Password: [Value of ADMIN_PASSWORD in .env]
```
Current value: `y41XWiphGhGsYutuTX9dJQ`

### Demo User (gensweaty)
```
Username: gensweaty
Password: [Value of GENSWEATY_PASSWORD in .env, or ADMIN_PASSWORD if not set]
```
Current value: `demo123456` (if GENSWEATY_PASSWORD is set in .env)

## Environment Variables

The passwords are configured in the `.env` file:

- `ADMIN_PASSWORD`: Password for the default admin user
- `GENSWEATY_PASSWORD`: Password specifically for the gensweaty demo user (optional, defaults to ADMIN_PASSWORD)

## Resetting Passwords

If you forget your password or need to reset it:

1. Update the password in the `.env` file
2. Run the password reset script:
   ```bash
   npm run reset-gensweaty-password
   ```
3. Or delete the user and restart the application to recreate with new password

## Login URL

Access the business admin login at:
```
https://your-domain.com/login
```

The business name will be auto-detected if you're on a subdomain or in a preview environment.

## Troubleshooting Login Issues

If you're getting "Invalid credentials" errors:

1. **Verify you're using the correct password**
   - Check the `.env` file for `GENSWEATY_PASSWORD` or `ADMIN_PASSWORD`
   - The password is case-sensitive

2. **Verify you're using the correct business name**
   - For demo user: use `demo`
   - The business name should be lowercase

3. **Check the server logs**
   - Look for messages about password verification
   - The logs will show which business and username was attempted

4. **Reset the password**
   - Run `npm run reset-gensweaty-password` to reset to the current .env value
   - Or update the `.env` file and restart the application

## Security Note

⚠️ **Important**: Change the default passwords in production! The default passwords are only meant for development and demo purposes.
