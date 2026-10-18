
# QuickNotes REST API Design

## Base URL

`https://api.quicknotes.example.com/v1`

All endpoints return JSON unless the response status is `204 No Content`. Authenticated endpoints require a valid bearer token.

## Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| GET | `/notes` | List the authenticated user's notes, with pagination. | 200 OK |
| GET | `/notes/{id}` | Retrieve one note owned by the user. | 200 OK |
| POST | `/notes` | Create a note. | 201 Created |
| PUT | `/notes/{id}` | Replace a note's title and body. | 200 OK |
| PATCH | `/notes/{id}` | Update selected note fields. | 200 OK |
| DELETE | `/notes/{id}` | Delete a note owned by the user. | 204 No Content |
| GET | `/tags` | List the authenticated user's tags. | 200 OK |
| PUT | `/notes/{id}/tags/{tagId}` | Associate a tag with a note. | 200 OK |

## Create a note

**Request:** `POST /notes`

```json
{
  "title": "Project ideas",
  "body": "Plan the next QuickNotes release.",
  "tagIds": [2, 4]
}
```

**Response:** `201 Created`

```json
{
  "id": 101,
  "userId": 1,
  "title": "Project ideas",
  "body": "Plan the next QuickNotes release.",
  "createdAt": "2026-10-18T10:00:00Z",
  "updatedAt": "2026-10-18T10:00:00Z",
  "tags": [
    {"id": 2, "name": "Work"},
    {"id": 4, "name": "Planning"}
  ]
}
```

The server validates the input, authenticates the user, and assigns the note ID and timestamps.

## List notes

**Request:** `GET /notes?limit=20&offset=0`

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": 101,
      "title": "Project ideas",
      "body": "Plan the next QuickNotes release.",
      "createdAt": "2026-10-18T10:00:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 1
  }
}
```

The API returns only notes the authenticated user is authorised to access. Pagination prevents large responses.

## Error status codes

| Status | Meaning | Example situation |
|---|---|---|
| 400 Bad Request | Invalid request data. | Missing title or malformed JSON. |
| 401 Unauthorized | Authentication is missing or invalid. | Expired access token. |
| 403 Forbidden | The user is not permitted to perform the action. | Attempting an operation prohibited by account policy. |
| 404 Not Found | The resource does not exist or is not accessible to the user. | Unknown note ID. |
| 500 Internal Server Error | Unexpected server failure. | Unhandled database or application error. |

## Example error response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title field is required.",
    "details": {
      "field": "title"
    },
    "requestId": "req-example-123"
  }
}
```

## Design decisions

- Use standard HTTP methods and status codes.
- Require authentication for private notes and verify ownership on every note operation.
- Validate titles on the server and limit them to 100 characters.
- Use pagination for collection endpoints.
- Use consistent JSON error bodies without exposing stack traces or secrets.
- Apply rate limiting and request logging to help protect and monitor the service.
