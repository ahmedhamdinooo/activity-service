# Activity Service

Activity Service is a Node.js pipeline for capturing user activity events, streaming them through Kafka, persisting them in MongoDB, and exposing those logs through a REST API. The service runs entirely inside Docker Compose so you get a reproducible local stack with Zookeeper, Kafka, MongoDB, the API (producer), and a background consumer worker.

```text
Producer (API) → Kafka Topic → Consumer Worker → MongoDB → REST API
```

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Environment Variables](#environment-variables)
5. [Run with Docker Compose](#run-with-docker-compose)
6. [REST API Examples](#rest-api-examples)
7. [Send a Test Message via kafka-console-producer](#send-a-test-message-via-kafka-console-producer)
8. [Local Development (Optional)](#local-development-optional)
9. [Troubleshooting](#troubleshooting)
10. [Related Files](#related-files)

## Project Overview

The service solves the “activity logging” problem when ingestion reliability is as important as query latency:

- Accept JSON activity events from client applications through `POST /api/activity`.
- Push each event into Kafka for buffering and fan-out.
- A dedicated consumer worker processes the Kafka topic and upserts documents into MongoDB.
- Operators and downstream services can read activity logs via `GET /api/logs` with pagination and simple filters (currently `userId`).

## Architecture

- **API / Producer** (`src/index.js` and `src/infrastructure/kafka/producer.js`): Express receives requests, performs lightweight validation, and publishes messages to Kafka.
- **Kafka Cluster**: Single broker (for local dev) with Zookeeper, defined in `docker-compose.yml`. The topic is configurable via `KAFKA_TOPIC`.
- **Consumer Worker** (`src/interfaces/jobs/consumerRunner.js` + `src/infrastructure/kafka/consumer.js`): Subscribes to the same topic, parses each event, and calls `processActivity`.
- **MongoDB Persistence** (`src/infrastructure/db` & `src/domain/models/Activity.js`): Stores each activity document, and powers the `getLogs` service used by the API.
- **REST API Layer** (`src/interfaces/http`): Exposes `/api/activity` and `/api/logs` routes.

## Prerequisites

- Docker Desktop 4.x (Docker Engine 24+) with Docker Compose v2
- 4 GB RAM available for containers
- Optional: Node.js 20+ and npm if you plan to run parts of the stack outside Docker

## Environment Variables

Create `.env` in the repository root:

```bash
PORT=enter the port
MONGO_URI=mongodb://mongo:27017/enter name of database
KAFKA_BROKER=put the container of kafka
KAFKA_TOPIC=
```

> If you rename services or expose Kafka externally, update `KAFKA_BROKER` accordingly.

## Run with Docker Compose

1. **Copy `.env`** (see above).
2. **Build & start services**:
   ```bash
   docker compose up --build -d
   ```
3. **Inspect status**:
   ```bash
   docker compose ps
   docker compose logs -f api
   docker compose logs -f consumer
   ```
4. **Access API**: `http://localhost:3000`
5. **Shutdown**:
   ```bash
   docker compose down
   ```

Compose services:

| Service     | Image / Build | Description                               |
| ----------- | ------------- | ----------------------------------------- |
| `zookeeper` | Confluent     | Required metadata store for Kafka         |
| `kafka`     | Confluent     | Single broker exposed on `9092`           |
| `mongo`     | mongo:6       | Stores `activities` collection            |
| `api`       | local build   | Express API + Kafka producer              |
| `consumer`  | local build   | Kafka consumer worker + Mongo persistence |

## REST API Examples

### `POST /api/activity`

Submit a new activity event (a Kafka message will be produced):

```bash
curl -X POST http://localhost:3000/api/activity \
  -H "Content-Type: application/json" \
  -d '{
        "userId": "u-123",
        "type": "LOGIN",
        "metadata": { "ip": "10.0.0.5", "device": "web" },
        "timestamp": "2024-11-18T09:30:00Z"
      }'
```

Response:

```json
{ "message": "Activity event sent to Kafka" }
```

### `GET /api/logs`

Query paginated activity logs with optional filters:

```bash
curl "http://localhost:3000/api/logs?userId=u-123&page=1&limit=20"
```

Example response:

```json
{
  "page": 1,
  "limit": 20,
  "total": 3,
  "totalPages": 1,
  "logs": [
    {
      "_id": "67503aa...",
      "userId": "u-123",
      "type": "LOGIN",
      "metadata": { "ip": "10.0.0.5", "device": "web" },
      "timestamp": "2024-11-18T09:30:00.000Z"
    }
  ]
}
```

## Send a Test Message via kafka-console-producer

You can bypass the API and push directly into Kafka:

```bash
# 1) Open an interactive shell in the Kafka container
docker compose exec kafka bash

# 2) Produce a JSON event
/usr/bin/kafka-console-producer \
  --broker-list localhost:9092 \
  --topic activity-events <<'EOF'
{"userId":"cli-user","type":"PAGE_VIEW","metadata":{"path":"/"}}
EOF

# 3) Exit the container shell
exit
```

The consumer logs (`docker compose logs -f consumer`) should show the ingested event, and MongoDB should contain it afterward.

## Local Development (Optional)

```bash
npm install
cp .env.example .env   # if available; otherwise create manually
npm run dev            # start Express API with nodemon
npm run consumer       # start Kafka consumer in another terminal
```

Ensure Kafka and MongoDB are reachable via the hosts specified in `.env`. For example, if you run Kafka locally, set `KAFKA_BROKER=localhost:9092`.

## Troubleshooting

- **Missing consumer entry point**  
  If `npm run consumer` exits immediately or Docker logs mention “Cannot find module `src/interfaces/jobs/consumerRunner.js`”, verify that the file exists and the path matches `package.json`. In Docker, rebuild after fixing: `docker compose build consumer`.

- **No leader for topic / `LEADER_NOT_AVAILABLE`**  
  The topic might not exist yet. Create it manually inside the Kafka container:

  ```bash
  docker compose exec kafka kafka-topics \
    --create --topic activity-events \
    --partitions 1 --replication-factor 1 \
    --bootstrap-server localhost:9092
  ```

  Restart producer/consumer afterward.

- **API stuck at startup**  
  `wait-for-kafka.js` blocks until Kafka responds. Check `docker compose logs -f kafka` and confirm `KAFKA_BROKER` equals the Compose service name (`kafka-1:9092`). Restart via `docker compose restart api`.

- **Consumer receives but Mongo has no data**  
  Check that `MONGO_URI` points to the Compose service (`mongodb://mongo:27017/activity-db`). Inspect data directly:

  ```bash
  docker compose exec mongo mongosh activity-db \
    --eval "db.activities.find().limit(5).pretty()"
  ```

- **`kafka-console-producer` cannot connect**  
  Use `--broker-list localhost:9092` _inside_ the Kafka container. If producing from the host, use `localhost:9092` only if you added `listeners`/`advertised.listeners` for host access; otherwise use the container name `kafka-1:9092`.

- **Port conflicts on 3000 / 9092 / 27017**  
  Update `docker-compose.yml` to map different host ports, e.g., `3001:3000`, and adjust your requests accordingly.

## Related Files

- `Dockerfile`: Builds the Node.js runtime (based on `node:20-bullseye`) and starts `src/index.js`.
- `docker-compose.yml`: Declares Zookeeper, Kafka, MongoDB, API, and Consumer services plus the Mongo volume.
- `wait-for-kafka.js`: Helper script used by API/consumer containers to delay boot until Kafka is reachable.

---

Happy logging with Activity Service! 🎯
