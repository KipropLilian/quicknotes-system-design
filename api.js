
const API_URL = "https://jsonplaceholder.typicode.com/posts";
const NOTES_URL = `${API_URL}?_limit=10`;

const loadButton = document.getElementById("load-btn");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");

let notes = [];

function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = "status";

  if (type) {
    statusMessage.classList.add(type);
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  // DELETE may return no content; otherwise parse the JSON response.
  if (response.status === 204) {
    return { data: null, status: response.status };
  }

  const data = await response.json();
  return { data, status: response.status };
}

function renderNotes() {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-state";
    emptyItem.textContent = "No notes yet. Click Load notes or create one.";
    notesList.appendChild(emptyItem);
    return;
  }

  notes.forEach((note) => {
    const item = document.createElement("li");
    item.className = "note-card";

    const title = document.createElement("h3");
    title.textContent = note.title || "Untitled note";

    const body = document.createElement("p");
    body.textContent = note.body || "No additional details.";

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => deleteNote(note, deleteButton));

    actions.appendChild(deleteButton);
    item.append(title, body, actions);
    notesList.appendChild(item);
  });
}

async function loadNotes() {
  loadButton.disabled = true;
  showStatus("Loading notes...");

  try {
    const result = await request(NOTES_URL);
    notes = Array.isArray(result.data) ? result.data : [];
    renderNotes();

    if (notes.length === 0) {
      showStatus("The server returned no notes.");
    } else {
      showStatus(`Loaded ${notes.length} notes from the server.`, "success");
    }
  } catch (error) {
    showStatus("Unable to load notes. Please check your connection and try again.", "error");
    console.error("GET notes error:", error);
  } finally {
    loadButton.disabled = false;
  }
}

async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    showStatus("Please enter a title for your note.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    showStatus("The title must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }

  submitButton.disabled = true;
  showStatus("Creating note...");

  try {
    const result = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ title, body, userId: 1 })
    });

    const createdNote = result.data;
    notes.unshift(createdNote);
    renderNotes();

    noteForm.reset();
    showStatus(
      `Note created (status ${result.status}, id ${createdNote.id}).`,
      "success"
    );
  } catch (error) {
    showStatus("Unable to create the note. Please try again.", "error");
    console.error("POST note error:", error);
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteNote(note, button) {
  button.disabled = true;
  showStatus("Deleting note...");

  try {
    await request(`${API_URL}/${encodeURIComponent(note.id)}`, {
      method: "DELETE"
    });

    // JSONPlaceholder simulates DELETE but does not persist changes.
    // Remove the note locally so the interface reflects the successful response.
    notes = notes.filter((item) => item.id !== note.id);
    renderNotes();
    showStatus(`Note ${note.id} deleted from this view.`, "success");
  } catch (error) {
    showStatus("Unable to delete the note. Please try again.", "error");
    console.error("DELETE note error:", error);
    button.disabled = false;
  }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

renderNotes();
