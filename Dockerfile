# Use a base image
FROM node:14-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install --production

COPY flag.txt /


# Copy the application code
COPY . .

RUN rm /app/flag.txt

# Create a low privileged user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set ownership and permissions for the application files
RUN chown -R appuser:appgroup /app
RUN chmod -R 755 /app

# Set the user to run the application
USER appuser

# Start the application
CMD ["node", "index.js"]
