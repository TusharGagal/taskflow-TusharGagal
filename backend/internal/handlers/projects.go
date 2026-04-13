package handlers

import (
    "encoding/json"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/jmoiron/sqlx"
    "github.com/tushargagal/taskflow/backend/internal/middleware"
    "github.com/tushargagal/taskflow/backend/internal/models"
)

type ProjectHandler struct{ db *sqlx.DB }

func NewProjectHandler(db *sqlx.DB) *ProjectHandler {
    return &ProjectHandler{db: db}
}

func (h *ProjectHandler) List(w http.ResponseWriter, r *http.Request) {
    userID := middleware.GetUserID(r)
    var projects []models.Project
    err := h.db.Select(&projects, `
        SELECT DISTINCT p.* FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE p.owner_id = $1 OR t.assignee_id = $1
        ORDER BY p.created_at DESC
    `, userID)
    if err != nil {
        writeError(w, http.StatusInternalServerError, "could not fetch projects")
        return
    }
    if projects == nil { projects = []models.Project{} }
    writeJSON(w, http.StatusOK, projects)
}

func (h *ProjectHandler) Create(w http.ResponseWriter, r *http.Request) {
    userID := middleware.GetUserID(r)
    var req struct {
        Name        string `json:"name"`
        Description string `json:"description"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid request body")
        return
    }
    if req.Name == "" {
        writeValidationError(w, map[string]string{"name": "is required"})
        return
    }

    var project models.Project
    err := h.db.QueryRowx(`
        INSERT INTO projects (name, description, owner_id)
        VALUES ($1, $2, $3)
        RETURNING *
    `, req.Name, req.Description, userID).StructScan(&project)
    if err != nil {
        writeError(w, http.StatusInternalServerError, "could not create project")
        return
    }
    writeJSON(w, http.StatusCreated, project)
}

func (h *ProjectHandler) Get(w http.ResponseWriter, r *http.Request) {
    userID := middleware.GetUserID(r)
    id := chi.URLParam(r, "id")

    var project models.Project
    err := h.db.Get(&project, `SELECT * FROM projects WHERE id = $1`, id)
    if err != nil {
        writeError(w, http.StatusNotFound, "not found")
        return
    }

    // Check access — owner or has tasks assigned
    var count int
    h.db.Get(&count, `
        SELECT COUNT(*) FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE p.id = $1 AND (p.owner_id = $2 OR t.assignee_id = $2)
    `, id, userID)
    if count == 0 && project.OwnerID != userID {
        writeError(w, http.StatusForbidden, "forbidden")
        return
    }

    var tasks []models.Task
    h.db.Select(&tasks, `SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC`, id)
    if tasks == nil { tasks = []models.Task{} }

    writeJSON(w, http.StatusOK, map[string]any{
        "project": project,
        "tasks":   tasks,
    })
}

func (h *ProjectHandler) Update(w http.ResponseWriter, r *http.Request) {
    userID := middleware.GetUserID(r)
    id := chi.URLParam(r, "id")

    var project models.Project
    if err := h.db.Get(&project, `SELECT * FROM projects WHERE id = $1`, id); err != nil {
        writeError(w, http.StatusNotFound, "not found")
        return
    }
    if project.OwnerID != userID {
        writeError(w, http.StatusForbidden, "forbidden")
        return
    }

    var req struct {
        Name        string `json:"name"`
        Description string `json:"description"`
    }
    json.NewDecoder(r.Body).Decode(&req)
    if req.Name == "" { req.Name = project.Name }
    if req.Description == "" { req.Description = project.Description }

    h.db.QueryRowx(`
        UPDATE projects SET name=$1, description=$2 WHERE id=$3 RETURNING *
    `, req.Name, req.Description, id).StructScan(&project)

    writeJSON(w, http.StatusOK, project)
}

func (h *ProjectHandler) Delete(w http.ResponseWriter, r *http.Request) {
    userID := middleware.GetUserID(r)
    id := chi.URLParam(r, "id")

    var project models.Project
    if err := h.db.Get(&project, `SELECT * FROM projects WHERE id = $1`, id); err != nil {
        writeError(w, http.StatusNotFound, "not found")
        return
    }
    if project.OwnerID != userID {
        writeError(w, http.StatusForbidden, "forbidden")
        return
    }

    h.db.Exec(`DELETE FROM projects WHERE id = $1`, id)
    w.WriteHeader(http.StatusNoContent)
}

func (h *ProjectHandler) Members(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    var members []models.User
    err := h.db.Select(&members, `
        SELECT DISTINCT u.id, u.name, u.email, u.created_at
        FROM users u
        WHERE u.id = (SELECT owner_id FROM projects WHERE id = $1)
        OR u.id IN (SELECT DISTINCT assignee_id FROM tasks WHERE project_id = $1 AND assignee_id IS NOT NULL)
    `, id)
    if err != nil {
        writeError(w, http.StatusInternalServerError, "could not fetch members")
        return
    }
    if members == nil { members = []models.User{} }
    writeJSON(w, http.StatusOK, members)
}