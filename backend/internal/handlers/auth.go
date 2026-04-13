package handlers

import (
    "encoding/json"
    "net/http"

    "github.com/jmoiron/sqlx"
    "github.com/tushargagal/taskflow/backend/internal/auth"
)

type AuthHandler struct{ db *sqlx.DB }

func NewAuthHandler(db *sqlx.DB) *AuthHandler {
    return &AuthHandler{db: db}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Name     string `json:"name"`
        Email    string `json:"email"`
        Password string `json:"password"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid request body")
        return
    }

    // Validate
    fields := map[string]string{}
    if req.Name == ""     { fields["name"] = "is required" }
    if req.Email == ""    { fields["email"] = "is required" }
    if req.Password == "" { fields["password"] = "is required" }
    if len(req.Password) < 8 { fields["password"] = "must be at least 8 characters" }
    if len(fields) > 0 {
        writeValidationError(w, fields)
        return
    }

    hashed, err := auth.HashPassword(req.Password)
    if err != nil {
        writeError(w, http.StatusInternalServerError, "could not hash password")
        return
    }

    var userID string
    err = h.db.QueryRow(
        `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id`,
        req.Name, req.Email, hashed,
    ).Scan(&userID)
    if err != nil {
        // Unique constraint = email already exists
        writeError(w, http.StatusBadRequest, "email already in use")
        return
    }

    token, err := auth.GenerateToken(userID, req.Email)
    if err != nil {
        writeError(w, http.StatusInternalServerError, "could not generate token")
        return
    }

    writeJSON(w, http.StatusCreated, map[string]string{
        "token":   token,
        "user_id": userID,
    })
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid request body")
        return
    }

    fields := map[string]string{}
    if req.Email == ""    { fields["email"] = "is required" }
    if req.Password == "" { fields["password"] = "is required" }
    if len(fields) > 0 {
        writeValidationError(w, fields)
        return
    }

    var id, hashed string
    err := h.db.QueryRow(
        `SELECT id, password FROM users WHERE email = $1`, req.Email,
    ).Scan(&id, &hashed)
    if err != nil {
        // Don't reveal whether email exists — generic message
        writeError(w, http.StatusUnauthorized, "invalid credentials")
        return
    }

    if !auth.CheckPassword(req.Password, hashed) {
        writeError(w, http.StatusUnauthorized, "invalid credentials")
        return
    }

    token, err := auth.GenerateToken(id, req.Email)
    if err != nil {
        writeError(w, http.StatusInternalServerError, "could not generate token")
        return
    }

    writeJSON(w, http.StatusOK, map[string]string{
        "token":   token,
        "user_id": id,
    })
}