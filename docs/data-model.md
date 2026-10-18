
# QuickNotes Data Model

## Entities and columns

### Users

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | Primary key |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL, UNIQUE |
| password_hash | TEXT | NOT NULL |
| created_at | TEXT | NOT NULL |

### Notes

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users.id, NOT NULL |
| title | TEXT | NOT NULL, maximum 100 characters |
| body | TEXT | Nullable |
| created_at | TEXT | NOT NULL |
| updated_at | TEXT | NOT NULL |

### Tags

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users.id, NOT NULL |
| name | TEXT | NOT NULL |

### Note_tags

| Column | Type | Constraints |
|---|---|---|
| note_id | INTEGER | Foreign key to notes.id, part of composite primary key |
| tag_id | INTEGER | Foreign key to tags.id, part of composite primary key |

## Relationships

One user can own many notes, so users and notes have a one-to-many relationship. Each note belongs to one user.

One user can also create many tags, giving users and tags a one-to-many relationship.

Notes and tags have a many-to-many relationship: a note can have several tags, and a tag can be assigned to several notes. The `note_tags` join table represents these associations and prevents duplicate pairs using a composite primary key.

## SQLite CREATE TABLE statements

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
    body TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

## Example SQL queries

### 1. List a user's notes

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC;
```

### 2. Join notes to their owners

```sql
SELECT notes.title, users.name, users.email
FROM notes
JOIN users ON notes.user_id = users.id
WHERE notes.id = 101;
```

### 3. Find notes with their tags

```sql
SELECT notes.title, tags.name AS tag_name
FROM notes
JOIN note_tags ON notes.id = note_tags.note_id
JOIN tags ON note_tags.tag_id = tags.id
WHERE notes.user_id = 1
ORDER BY notes.title;
```

### 4. Count notes per user

```sql
SELECT users.id, users.name, COUNT(notes.id) AS note_count
FROM users
LEFT JOIN notes ON users.id = notes.user_id
GROUP BY users.id, users.name;
```

## Index

```sql
CREATE INDEX idx_notes_user_created
ON notes(user_id, created_at DESC);
```

This index supports retrieving a user's notes in date order, a common operation in the application.

## SQL or NoSQL?

I would choose a relational SQL database such as PostgreSQL. Users, notes, tags and note-tag associations have clear relationships, and foreign keys and transactions help maintain data integrity. SQL joins and indexes support the application's queries efficiently. A document database could work, but SQL provides a natural model for these related entities and their constraints.
