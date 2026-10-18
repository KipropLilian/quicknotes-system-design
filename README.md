
# QuickNotes System Design

QuickNotes is a notes application prototype demonstrating how a browser-based interface can communicate with a REST API. The project includes a JavaScript API client using JSONPlaceholder and design documents for a production-ready service intended to scale to one million registered users.

## Features

- Load ten notes from the practice API.
- Create notes with title validation.
- Delete notes from the current interface.
- Display loading, success, error and empty states.
- Render user-provided content safely using `textContent`.
- Document the proposed REST API, relational data model and scalable architecture.

## Technologies

- HTML5
- CSS3
- JavaScript with Fetch API and async/await
- JSONPlaceholder practice API
- SQLite-compatible SQL examples
- Markdown documentation

## How to run the API client

1. Clone or download this repository.
2. Open the project folder in VS Code.
3. Start a local web server, such as the Live Server extension.
4. Open `index.html` through the local server.
5. Click **Load notes** to retrieve notes from JSONPlaceholder.
6. Use the form to create a note and each note's Delete button to remove it from the current interface.

An internet connection is required for the practice API. The browser may restrict requests from certain local-file contexts, so using a local web server is recommended.

**Important:** JSONPlaceholder is a demonstration API. POST and DELETE operations return simulated responses and do not permanently change server data.

## Design documents

- [API Design](docs/api-design.md) — endpoints, request/response examples and error handling.
- [Data Model](docs/data-model.md) — entities, relationships, SQL schema, queries and indexes.
- [Architecture](docs/architecture.md) — requirements, scale estimates, architecture, request flows and trade-offs.

## What I learned

- How to use the Fetch API, async/await, HTTP methods and response status codes.
- Why loading, success, error and empty states improve user experience.
- Why user-provided text should be rendered with `textContent` rather than inserted as HTML.
- How relational databases use primary keys, foreign keys, indexes and join tables.
- How caching, read replicas, queues and multiple application servers can help a service scale.
- Why architecture decisions involve trade-offs between cost, consistency, performance and reliability.

## Limitations and future improvements

The current browser client uses a public practice API and does not provide real authentication or persistent user-owned notes. A production version would require a backend service, authentication and authorisation, input validation, database migrations, monitoring, backups, automated tests and secure deployment.
