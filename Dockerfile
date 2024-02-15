# Use the latest Node.js image as the base image
FROM node:latest
# Set the working directory within the container
WORKDIR /app
# Copy package.json and package-lock.json to the container
COPY package*.json ./
# Run 'npm install' to install project dependencies
RUN npm install
# Install PM2 globally
RUN npm install pm2 -g
# Copy the entire project to the container
COPY . .
# Set the environment variable 'PORT' to 3000
ENV PORT 3000
# Expose the specified port
EXPOSE ${PORT}
# Define the command to run when the container starts
CMD ["pm2", "start", "app.js"]
