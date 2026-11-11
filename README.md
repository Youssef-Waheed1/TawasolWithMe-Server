Backend API for TawasolWithMe with user authentication, profile management, and social posts.

## Tech stack
- Node.js
- Express
- MongoDB with Mongoose
- `bcryptjs`
- `config`
- `cors`
- `express-validator`
- `jsonwebtoken`
- `multer`
- `normalize-url`

## Key features
- User registration and login with password hashing and JWT authentication.
- Authenticated profile creation and updates, including experience, education, and profile image upload.
- Authenticated post creation, listing, retrieval, and deletion, with likes and comments.
- Profile lookup and account deletion, including associated profile, posts, and user data.

## Run steps
1. Install dependencies from the repository root:
   ```bash
   npm install
   ```
2. Configure the MongoDB connection and JWT secret in the project's `config/default.json`.
3. Start the server:
   ```bash
   npm start
   ```
   For development with automatic restarts, run:
   ```bash
   npm run server
   ```

The server uses the `PORT` environment variable when set; otherwise, it listens on port `3000`.
