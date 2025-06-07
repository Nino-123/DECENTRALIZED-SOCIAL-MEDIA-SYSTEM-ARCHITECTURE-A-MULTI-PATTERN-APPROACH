# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the production-ready static files
RUN npm run build

# Stage 2: Serve the static files with a lightweight web server
FROM nginx:stable-alpine

# Copy the built files from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# The container will expose port 80 by default
EXPOSE 80

# When the container starts, nginx will start automatically.
CMD ["nginx", "-g", "daemon off;"]
