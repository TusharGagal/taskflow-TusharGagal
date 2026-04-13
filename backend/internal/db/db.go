package db

import (
    "fmt"
    "os"

    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
)

func Connect() (*sqlx.DB, error) {
    dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
        os.Getenv("POSTGRES_USER"),
        os.Getenv("POSTGRES_PASSWORD"),
        os.Getenv("POSTGRES_HOST"),
        os.Getenv("POSTGRES_PORT"),
        os.Getenv("POSTGRES_DB"),
    )
    return sqlx.Connect("postgres", dsn)
}