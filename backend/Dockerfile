FROM node:18-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source
COPY . .

# Generate Prisma client & compile TypeScript
RUN npx prisma generate
RUN npm run build

EXPOSE 4000

# Run compiled JS in production
CMD ["npm", "start"]
