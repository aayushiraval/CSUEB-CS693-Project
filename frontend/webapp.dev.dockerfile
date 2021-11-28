FROM node:latest as builder

# Create directory for frontend
RUN mkdir /frontend
WORKDIR /frontend

# Install npm modules before copying src code
# (so we have a Docker's caching layer for node_modules)
COPY package.json /frontend/package.json
COPY package-lock.json /frontend/package-lock.json
RUN npm --engine-strict=true ci

# Copy src code to image
COPY . /frontend

# Update the cache id
RUN python webapp_update_cache_id.py

# Run tests
RUN npm ci
RUN npm test

# Build dist that nginx will serve
RUN npm --engine-strict=true run build-dev

FROM nginx:latest

# Copy dist from build
COPY --from=builder /frontend/dist /usr/share/nginx/html

# Copy nginx.conf from src
COPY --from=builder /frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
