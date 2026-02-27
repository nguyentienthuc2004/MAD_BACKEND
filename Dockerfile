FROM node:18-alpine

# set working directory
WORKDIR /app

# copy package.json trước để cache layer
COPY package*.json ./

# cài dependencies
RUN npm install

# copy source code
COPY . .

# expose port
EXPOSE 3000

# chạy app
CMD ["npm", "run", "dev"]
