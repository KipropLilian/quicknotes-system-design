
# QuickNotes System Architecture

## Functional requirements

- Users can authenticate and access only their own notes.
- Users can create, read, update and delete notes.
- Each note has a required title of at most 100 characters and an optional body.
- Users can organise notes with tags.
- Users can search, paginate and sort their notes.
- The system reports validation and server errors clearly.

## Non-functional requirements

- Scale to one million registered users.
- Maintain availability through redundancy and health checks.
- Protect private notes in transit and at rest.
- Keep common note-list requests responsive through caching and indexing.
- Back up data and test recovery procedures.
- Monitor errors, latency, resource usage and queue failures.

## Load estimates for one million users

### Assumptions

- One million registered users.
- 10% are active daily: 100,000 daily active users.
- Each active user reads 50 note/feed pages per day.
- Each active user creates one note per day.
- Average stored note content and metadata total 2 KB per note.
- 86,400 seconds per day and 365 days per year.
- Average request rates are spread over 24 hours; peak traffic is estimated at 5 times average.
- Estimates exclude indexes, replicas, backups, logs and operational overhead.

### Reads per second

Daily reads = 100,000 × 50 = 5,000,000.

Average reads per second = 5,000,000 ÷ 86,400 = **57.87 reads/second**.

Estimated peak reads = 57.87 × 5 = **289.35 reads/second**.

### Writes per second

Daily note writes = 100,000 × 1 = 100,000.

Average writes per second = 100,000 ÷ 86,400 = **1.16 writes/second**.

Estimated peak writes = 1.16 × 5 = **5.79 writes/second**.

### Storage per year

Annual notes = 100,000 × 365 = 36,500,000 notes.

At 2 KB per note, annual content storage is approximately 73,000,000 KB, or **73 GB per year** using decimal units.

Actual storage will be higher after accounting for indexes, replicas, backups and any attachments. Attachments should use object storage and be estimated separately.

The workload is read-heavy under these assumptions, so caching, efficient indexes and read replicas can reduce pressure on the primary database.

## Architecture diagram

```text
                    +-------------------+
                    | Client / Browser  |
                    +---------+---------+
                              |
                            DNS
                              |
                    +---------v---------+
                    |       CDN         |
                    | Static assets     |
                    +---------+---------+
                              |
                    +---------v---------+
                    |  Load Balancer    |
                    +----+----------+---+
                         |          |
                  +------v---+  +---v------+
                  | App      |  | App      |
                  | Server 1|  | Server 2|
                  +--+----+--+  +--+----+--+
                     |    |        |    |
                     |    +--------+    |
                     |                  |
                +----v-----+       +----v------+
                |  Cache   |       |  Queue    |
                | Redis    |       | Jobs      |
                +----+-----+       +-----+-----+
                     |                   |
              +------v------+      +-----v------+
              | Primary DB  |----->| Worker     |
              +------+------+\     +------------+
                     |        \          |
               replication     \         v
                     |          \  +------------+
              +------v------+     | Object     |
              | Read Replica|     | Storage    |
              +-------------+     +------------+
```

The queue and worker can also handle asynchronous tasks such as email notifications or future attachment processing. Object storage is for uploaded files, not for the core relational records.

## Component responsibilities

- **Client:** Provides the user interface and sends HTTPS requests to the API.
- **DNS:** Resolves the service's domain name to its current network endpoint.
- **CDN:** Caches static assets close to users and reduces repeated origin requests.
- **Load balancer:** Distributes traffic across healthy application servers.
- **App servers:** Validate requests, enforce authorisation and run application logic.
- **Cache:** Stores frequently requested data to reduce database load and latency.
- **Primary database:** Stores authoritative user, note, tag and association records.
- **Read replica:** Serves suitable read queries and reduces load on the primary database.
- **Queue:** Buffers asynchronous work so short-lived traffic spikes do not overwhelm workers.
- **Worker:** Processes queued jobs outside the main request-response cycle.
- **Object storage:** Holds large uploaded files independently of the relational database.

## GET /notes flow

1. The client resolves the API hostname through DNS and sends an HTTPS request.
2. The CDN serves any eligible cached content; authenticated private note responses should not be publicly cached.
3. The load balancer forwards the API request to a healthy application server.
4. The app server validates the access token and checks the user's identity and permissions.
5. The server checks the cache for an appropriate user-scoped result.
6. On a cache miss, it queries the read replica where suitable, using indexes and pagination.
7. The server returns the notes and pagination metadata as JSON.
8. The cache may retain an appropriate result briefly, with invalidation or expiry after changes.

## POST /notes flow

1. The client sends a JSON request containing the title and optional body over HTTPS.
2. DNS, the load balancer and a healthy application server route the request.
3. The server authenticates the user, validates the title and checks permissions.
4. The server writes the new note to the primary database in a transaction.
5. After the write succeeds, the server invalidates affected cache entries.
6. If follow-up work is required, the server publishes a job to the queue.
7. The server returns `201 Created` with the new note and its ID.
8. The worker processes queued work independently and retries transient failures safely.

## Trade-offs

### Cache speed versus data freshness

Caching makes repeated reads faster and reduces database load, but users can see stale data. Short TTLs and targeted invalidation balance speed and freshness.

### Read replicas versus consistency

Read replicas increase read capacity, but replication lag can delay visibility of new notes. Read-after-write operations can be routed to the primary database when stronger consistency is needed.

### Asynchronous processing versus complexity

A queue protects the API from slow background tasks, but adds infrastructure and failure-handling requirements. Jobs need retries, idempotency and a dead-letter process.

### More servers versus operating cost

Multiple app servers improve resilience and allow horizontal scaling, but increase deployment and monitoring complexity. Autoscaling and health checks help manage capacity.

## Avoiding single points of failure

Run at least two application-server instances across separate failure domains and use health-checked load balancing. Deploy redundant cache and queue infrastructure where supported, and configure automated database backups, replica monitoring and a tested recovery process. A read replica is not a substitute for a backup or a fully independent disaster-recovery plan. Use multi-zone deployment and redundant DNS/CDN services where the availability target justifies their cost.
