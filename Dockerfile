FROM node:22-bookworm

# Install system deps: ffmpeg + python + yt-dlp
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install yt-dlp && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the code
COPY . .

ENV PORT=4000
EXPOSE 4000

CMD ["npm", "start"]
