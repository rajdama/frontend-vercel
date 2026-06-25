# Lifestein Quote Tool

This is a quote tool for insurance quotes powered by CompuLife API.

## Development

To run the application locally:

```bash
# Install dependencies
npm install

# Run both the backend server and frontend development server
npm run start:all
```

## Deployment with Docker

This application can be deployed using Docker. The Dockerfile is configured to build the frontend and serve it from the backend.

### Using Docker Compose (Recommended)

The easiest way to run the application with Docker is using docker-compose:

```bash
# Build and start the container
docker-compose up -d

# Stop the container
docker-compose down
```

### Manual Docker Commands

If you prefer to use Docker directly:

```bash
# Build the Docker image
docker build -t lifestein-quote-tool .

# Run the Docker container
docker run -p 5000:5000 \
  -e COMPULIFE_DOMAIN=compulifeapi.com \
  -e COMPULIFE_AUTH_ID=your_auth_id \
  -e REMOTE_IP=your_remote_ip \
  lifestein-quote-tool
```

## Deployment on Render

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Create a new Web Service on Render
3. Connect your repository
4. Select "Docker" as the environment
5. Configure environment variables:
   - `PORT`: 5000 (or let Render assign it)
   - `COMPULIFE_DOMAIN`: compulifeapi.com
   - `COMPULIFE_AUTH_ID`: Your CompuLife Auth ID
   - `REMOTE_IP`: Your Remote IP
   - `FRONTEND_URL`: The URL of your deployed application (for CORS)
6. Deploy!

## Tech Stack

This project uses:

- **Frontend**: React with Vite for fast development
- **Styling**: TailwindCSS for utility-first CSS
- **Backend**: Express.js for the API server
- **API Integration**: Node-fetch for CompuLife API requests 