package models

import (
    "time"
)

type User struct {
    ID        string    `db:"id" json:"id"`
    Name      string    `db:"name" json:"name"`
    Email     string    `db:"email" json:"email"`
    Password  string    `db:"password" json:"-"` // json:"-" means never sent in responses
    CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type Project struct {
    ID          string    `db:"id" json:"id"`
    Name        string    `db:"name" json:"name"`
    Description string    `db:"description" json:"description"`
    OwnerID     string    `db:"owner_id" json:"owner_id"`
    CreatedAt   time.Time `db:"created_at" json:"created_at"`
}

type Task struct {
    ID          string     `db:"id" json:"id"`
    Title       string     `db:"title" json:"title"`
    Description string     `db:"description" json:"description"`
    Status      string     `db:"status" json:"status"`
    Priority    string     `db:"priority" json:"priority"`
    ProjectID   string     `db:"project_id" json:"project_id"`
    AssigneeID  *string    `db:"assignee_id" json:"assignee_id"` // pointer = nullable
    DueDate     *time.Time `db:"due_date" json:"due_date"`
    CreatedAt   time.Time  `db:"created_at" json:"created_at"`
    UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`
}