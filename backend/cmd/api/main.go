package main

import (
    "context"
    "log"
    "log/slog"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/go-chi/chi/v5"
    chimiddleware "github.com/go-chi/chi/v5/middleware"
    "github.com/golang-migrate/migrate/v4"
    _ "github.com/golang-migrate/migrate/v4/database/postgres"
    _ "github.com/golang-migrate/migrate/v4/source/file"
    "github.com/tushargagal/taskflow/backend/internal/db"
    "github.com/tushargagal/taskflow/backend/internal/handlers"
    "github.com/tushargagal/taskflow/backend/internal/middleware"
)

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    database, err := db.Connect()
    if err != nil {
        logger.Error("failed to connect to database", "error", err)
        os.Exit(1)
    }
    defer database.Close()
    logger.Info("connected to database")

    // Run migrations
    dbURL := "postgres://" + os.Getenv("POSTGRES_USER") + ":" +
        os.Getenv("POSTGRES_PASSWORD") + "@" +
        os.Getenv("POSTGRES_HOST") + ":" +
        os.Getenv("POSTGRES_PORT") + "/" +
        os.Getenv("POSTGRES_DB") + "?sslmode=disable"

    m, err := migrate.New("file:///migrations", dbURL)
    if err != nil {
        logger.Error("failed to create migrator", "error", err)
        os.Exit(1)
    }
    if err := m.Up(); err != nil && err != migrate.ErrNoChange {
        logger.Error("failed to run migrations", "error", err)
        os.Exit(1)
    }
    logger.Info("migrations applied")

    // Init handlers
    authHandler    := handlers.NewAuthHandler(database)
    projectHandler := handlers.NewProjectHandler(database)
    taskHandler    := handlers.NewTaskHandler(database)

    // Router
    r := chi.NewRouter()
    r.Use(chimiddleware.RequestID)
    r.Use(chimiddleware.RealIP)
    r.Use(chimiddleware.Recoverer)

    // CORS — allow frontend to call API
    r.Use(func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            w.Header().Set("Access-Control-Allow-Origin", "*")
            w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
            w.Header().Set("Access-Control-Allow-Headers", "Authorization,Content-Type")
            if r.Method == http.MethodOptions {
                w.WriteHeader(http.StatusNoContent)
                return
            }
            next.ServeHTTP(w, r)
        })
    })

    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"status":"ok"}`))
    })

    // Public auth routes
    r.Post("/auth/register", authHandler.Register)
    r.Post("/auth/login", authHandler.Login)

    // Protected routes
    r.Group(func(r chi.Router) {
        r.Use(middleware.Authenticate)

        r.Get("/projects", projectHandler.List)
        r.Post("/projects", projectHandler.Create)
        r.Get("/projects/{id}", projectHandler.Get)
        r.Get("/projects/{id}/members", projectHandler.Members)
        r.Patch("/projects/{id}", projectHandler.Update)
        r.Delete("/projects/{id}", projectHandler.Delete)

        r.Get("/projects/{id}/tasks", taskHandler.List)
        r.Post("/projects/{id}/tasks", taskHandler.Create)
        r.Patch("/tasks/{id}", taskHandler.Update)
        r.Delete("/tasks/{id}", taskHandler.Delete)
    })

    // Graceful shutdown
    port := os.Getenv("API_PORT")
    if port == "" { port = "8080" }

    srv := &http.Server{Addr: ":" + port, Handler: r}

    go func() {
        logger.Info("API listening", "port", port)
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatal(err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
    <-quit

    logger.Info("shutting down...")
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    srv.Shutdown(ctx)
}