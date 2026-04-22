FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose the Vite dev server port
EXPOSE 5173

# Start the Vite dev server and expose it to the host
CMD ["npm", "run", "dev", "--", "--host"]
