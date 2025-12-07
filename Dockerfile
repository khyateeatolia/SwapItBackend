# Use Deno image
FROM denoland/deno:latest

# Set working directory
WORKDIR /app

# Copy dependency files first for better caching
COPY deno.json deno.lock* ./

# Copy the rest of the application
COPY . .

# Cache dependencies
RUN deno cache src/concept-server.ts

# Expose the port
EXPOSE 8000

# Run the server
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--allow-sys", "-c", "deno.json", "src/concept-server.ts"]
