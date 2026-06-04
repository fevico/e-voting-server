# Step 1: Grab Node.js 20
FROM node:20

# Step 2: Create working directory
WORKDIR /app

# Step 3: Copy package files and install ALL dependencies (including typescript)
COPY package*.json ./
RUN npm install

# Step 4: Copy the rest of the application files
COPY . .

# Step 5: Build/Compile TypeScript to JavaScript (creates the /dist folder)
RUN npm run build

# Step 6: Expose the port matching your app configurations
EXPOSE 3030

# Step 7: Start the compiled app using the start script in package.json
CMD ["npm", "start"]