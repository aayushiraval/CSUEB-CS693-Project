FROM node:10.16.0 as builder

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

# Build dist that nginx will serve
RUN npm --engine-strict=true run build-local

CMD ["npm", "start"]