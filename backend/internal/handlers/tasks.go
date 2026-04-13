package handlers

import (
    "encoding/json"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/jmoiron/sqlx"
    "github.com/tushargagal/taskflow/backend/internal/middleware"
    "github.com/tushargagal/taskflow/backend/internal/models"
)

type TaskHandler struct{ db *sqlx.DB }

func NewTaskHandler(db *sqlx.DB) *TaskHandler {
    return &TaskHandler{db: db}
}

func (h *TaskHandler) List(w http.ResponseWriter, r *http.Request) {
    projectID := chi.URLParam(r, "id")
    status := r.URL.Query().Get("status")
    assignee := r.URL.Query().Get("assignee")

    query := `SELECT * FROM tasks WHERE project_id = $1`
    args := []any{projectID}

    if status != "" {
        args = append(args, status)
        query += ` AND status = $2`
    }
    if assignee != "" {
        args = append(args, assignee)
        query += ` AND assignee_id = $` + string(rune('1'+len(args)-1))
    }
    query += ` ORDER BY created_at DESC`

    var tasks []models.Task
    h.db.Select(&tasks, query, args...)
    if tasks == nil { tasks = []models.Task{} }
    writeJSON(w, http.StatusOK, tasks)
}

func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
    projectID := chi.URLParam(r, "id")
    var req struct {
        Title       string  `json:"title"`
        Description string  `json:"description"`
        Status      string  `json:"status"`
        Priority    string  `json:"priority"`
        AssigneeID  *string `json:"assignee_id"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid request body")
        return
    }
    if req.Title == "" {
        writeValidationError(w, map[string]string{"title": "is required"})
        return
    }
    if req.Status == ""   { req.Status = "todo" }
    if req.Priority == "" { req.Priority = "medium" }

    var task models.Task
    err := h.db.QueryRowx(`
        INSERT INTO tasks (title, description, status, priority, project_id, assignee_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `, req.Title, req.Description, req.Status, req.Priority, projectID, req.AssigneeID).StructScan(&task)
    if err != nil {
        writeError(w, http.StatusInternalServerError, "could not create task")
        return
    }
    writeJSON(w, http.StatusCreated, task)
}

func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
    userID := middleware.GetUserID(r)
    taskID := chi.URLParam(r, "id")

    var task models.Task
    if err := h.db.Get(&task, `SELECT * FROM tasks WHERE id = $1`, taskID); err != nil {
        writeError(w, http.StatusNotFound, "not found")
        return
    }

    // Must be project owner or assignee
    var ownerID string
    h.db.Get(&ownerID, `SELECT owner_id FROM projects WHERE id = $1`, task.ProjectID)
    if ownerID != userID && (task.AssigneeID == nil || *task.AssigneeID != userID) {
        writeError(w, http.StatusForbidden, "forbidden")
        return
    }

    var req struct {
        Title       *string `json:"title"`
        Description *string `json:"description"`
        Status      *string `json:"status"`
        Priority    *string `json:"priority"`
        AssigneeID  *string `json:"assignee_id"`
    }
    json.NewDecoder(r.Body).Decode(&req)

    if req.Title != nil       { task.Title = *req.Title }
    if req.Description != nil { task.Description = *req.Description }
    if req.Status != nil      { task.Status = *req.Status }
    if req.Priority != nil    { task.Priority = *req.Priority }
    if req.AssigneeID != nil  { task.AssigneeID = req.AssigneeID }

    h.db.QueryRowx(`
        UPDATE tasks SET title=$1, description=$2, status=$3, priority=$4,
        assignee_id=$5, updated_at=NOW() WHERE id=$6 RETURNING *
    `, task.Title, task.Description, task.Status, task.Priority, task.AssigneeID, taskID).StructScan(&task)

    writeJSON(w, http.StatusOK, task)
}

func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
    userID := middleware.GetUserID(r)
    taskID := chi.URLParam(r, "id")

    var task models.Task
    if err := h.db.Get(&task, `SELECT * FROM tasks WHERE id = $1`, taskID); err != nil {
        writeError(w, http.StatusNotFound, "not found")
        return
    }

    var ownerID string
    h.db.Get(&ownerID, `SELECT owner_id FROM projects WHERE id = $1`, task.ProjectID)
    if ownerID != userID {
        writeError(w, http.StatusForbidden, "forbidden")
        return
    }

    h.db.Exec(`DELETE FROM tasks WHERE id = $1`, taskID)
    w.WriteHeader(http.StatusNoContent)
}