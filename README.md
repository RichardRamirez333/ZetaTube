# ZETAtube

A full-featured YouTube clone built with React, TypeScript, Node.js, Express, and MongoDB.

## Features

- Video upload & playback with custom player (quality, speed, volume, fullscreen)
- User authentication (JWT) & profile management
- Subscriptions with notification preferences (bell)
- Comments with replies, edit, delete, like
- Playlists & Watch Later
- Search with filters (category, duration, sort)
- Channel pages with tabs (Videos, Playlists, About)
- Theatre mode & autoplay
- Responsive design (desktop, tablet, mobile)
- Dark theme

## Tech Stack

| Layer     | Technology            |
|-----------|-----------------------|
| Frontend  | React + Vite + TypeScript |
| Backend   | Node.js + Express     |
| Database  | MongoDB + Mongoose    |
| Auth      | JWT + bcryptjs        |
| Styling   | CSS with custom properties |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/zetatube.git
cd zetatube

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Variables

Create `server/.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zetatube
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

Create `client/.env` (for production):

```
VITE_API_URL=https://your-api-url.com/api
```

### Run Locally

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

Open http://localhost:3000

## Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas (free tier)

## License

Copyright © 2026 Shelby__x1

All Rights Reserved.

This project and its source code are protected by copyright law. Unauthorized reproduction, distribution, or modification of this code is strictly prohibited without prior written consent from the owner.

## Contact

- **Instagram:** [@shelby__x1](https://instagram.com/shelby__x1)
- **Email:** [1thomas8shelby1@gmail.com](mailto:1thomas8shelby1@gmail.com)
- **Email:** [bak.lamcharki2008@gmail.com](mailto:bak.lamcharki2008@gmail.com)
- **Phone:** +212 700-616212

---

Built with ❤️ by **Shelby__x1**
"# ZetaTube" 
