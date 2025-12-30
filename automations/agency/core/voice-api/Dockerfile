FROM node:20-alpine

WORKDIR /app

# Copy only the necessary files
COPY voice-api-resilient.cjs .
COPY package.json .

# Install minimal dependencies (none needed for this script)
RUN npm install --production 2>/dev/null || true

# Expose the API port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

# Run the server
CMD ["node", "voice-api-resilient.cjs", "--server", "--port=3004"]
