# DeBook - Social Media Interaction Platform
Project Overview
This project is a microservices-based social media interaction platform that handles posts, user interactions (likes/comments), and real-time notifications. Built with event-driven architecture using Kafka for asynchronous communication between services.

Author: Nelson Iseru
Contact: +2349026915561 | nelsoniseru08@gmail.com

# Architecture
Microservices Pattern

[click](https://ibb.co/KpG4nHhC)


# Service Responsibilities
API Service: Handles user interactions (create posts, like, comment) and emits Kafka events

Notification Service: Listens to Kafka events and creates/manages notifications for users

# Technology Stack
Backend Framework
NestJS - Progressive Node.js framework for building efficient server-side applications

Documentation

TypeScript support, Dependency Injection, Modular architecture

Database
PostgreSQL - Advanced open-source relational database

[Documentation](https://docs.nestjs.com/)

TypeORM - ORM for TypeScript and JavaScript

[Documentation](https://www.postgresql.org/docs/)

Message Queue
Apache Kafka - Distributed event streaming platform

[Documentation](https://kafka.apache.org/41/getting-started/introduction/)

kafkajs - Kafka client for Node.js

[Documentation](https://kafka.js.org/)

Testing
Jest - JavaScript testing framework

[Documentation](https://jestjs.io/)

Supertest - HTTP assertion library
[Documentation](https://github.com/forwardemail/supertest/)


Containerization
Docker - Container platform

[Documentation](https://docs.docker.com/)

Docker Compose - Multi-container orchestration

[Documentation](https://docs.docker.com/compose/)

git clone repository-url
cd debook

# Environment Configuration

# ============================================
# API Service (api-service/.env)
# ============================================
PORT=3000
NODE_ENV=development

# ============================================
# Database Configuration (PostgreSQL)
# ============================================
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_postgres_username
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=debook
DATABASE_SYNCHRONIZE=false

# ============================================
# Kafka Configuration
# ============================================
KAFKA_BROKERS=localhost:9093
KAFKA_CLIENT_ID=debook-api-service
KAFKA_GROUP_ID=debook-group
KAFKA_INTERACTION_TOPIC=interaction.created
KAFKA_NOTIFICATION_TOPIC=notification.created

# ============================================
# Application Settings
# ============================================
LOG_LEVEL=debug
ENABLE_SWAGGER=true
API_PREFIX=api/v1




# ============================================
# notification-service/.env
# ============================================
PORT=3001
NODE_ENV=development

# ============================================
# Database Configuration (PostgreSQL)
# ============================================
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_postgres_username
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=debook
DATABASE_SYNCHRONIZE=false

# ============================================
# Kafka Configuration
# ============================================
KAFKA_BROKERS=localhost:9093
KAFKA_CLIENT_ID=debook-notification-service
KAFKA_GROUP_ID=debook-notification-group
KAFKA_INTERACTION_TOPIC=interaction.created

# ============================================
# Application Settings
# ============================================
LOG_LEVEL=debug
API_PREFIX=api/v1





# Update Docker Compose with Your Credentials
Create or edit docker-compose.yml:

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: debook-postgres
    environment:
      POSTGRES_DB: debook
      POSTGRES_USER: your_username_here
      POSTGRES_PASSWORD: your_password_here
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - debook-network

  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    container_name: debook-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"
    networks:
      - debook-network

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    container_name: debook-kafka
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"
      - "9093:9093"
    networks:
      - debook-network

  api-service:
    build:
      context: ./api-service
      dockerfile: Dockerfile
    container_name: debook-api-service
    depends_on:
      - postgres
      - kafka
    environment:
      - NODE_ENV=development
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_USER=your_username_here
      - DATABASE_PASSWORD=your_password_here
      - DATABASE_NAME=debook
      - KAFKA_BROKERS=kafka:9092
      - PORT=3000
    ports:
      - "3000:3000"
    networks:
      - debook-network

  notification-service:
    build:
      context: ./notification-service
      dockerfile: Dockerfile
    container_name: debook-notification-service
    depends_on:
      - kafka
    environment:
      - NODE_ENV=development
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_USER=your_username_here
      - DATABASE_PASSWORD=your_password_here
      - DATABASE_NAME=debook
      - KAFKA_BROKERS=kafka:9092
      - PORT=3001
    ports:
      - "3001:3001"
    networks:
      - debook-network

networks:
  debook-network:
    driver: bridge

volumes:
  postgres_data:
```

**Important**: Replace `your_username_here` and `your_password_here` with your actual PostgreSQL credentials.


# Run the command

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# for test
# API Service
cd api-service && npm run test

# Notification Service
cd ../notification-service && npm run test

# postman url
[link](https://documenter.getpostman.com/view/13945163/2sA3kXEfh4/)