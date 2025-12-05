FROM node:22-bullseye

# Install system deps: ffmpeg + curl
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp standalone Linux binary (bundles its own Python)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
    -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the code
COPY . .

ENV PORT=4000
EXPOSE 4000

CMD ["npm", "start"]
