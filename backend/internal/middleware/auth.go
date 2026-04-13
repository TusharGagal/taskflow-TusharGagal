package middleware

import (
    "context"
    "net/http"
    "strings"

    "github.com/tushargagal/taskflow/backend/internal/auth"
)

type contextKey string
const UserIDKey contextKey = "user_id"
const EmailKey  contextKey = "email"

func Authenticate(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Expect: Authorization: Bearer <token>
        header := r.Header.Get("Authorization")
        if !strings.HasPrefix(header, "Bearer ") {
            http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
            return
        }

        tokenStr := strings.TrimPrefix(header, "Bearer ")
        claims, err := auth.ValidateToken(tokenStr)
        if err != nil {
            http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
            return
        }

        // Store user info in request context so handlers can read it
        ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
        ctx = context.WithValue(ctx, EmailKey, claims.Email)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// GetUserID is a helper handlers use to read the user ID from context
func GetUserID(r *http.Request) string {
    id, _ := r.Context().Value(UserIDKey).(string)
    return id
}