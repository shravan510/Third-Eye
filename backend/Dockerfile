FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose the API port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
