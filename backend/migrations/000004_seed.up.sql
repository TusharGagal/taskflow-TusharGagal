-- Password is "password123" hashed with bcrypt cost 12
INSERT INTO users (id, name, email, password) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Test User',
    'test@example.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCB6PJH3kHvFMkBbN3pN7Gy'
);

INSERT INTO projects (id, name, description, owner_id) VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Demo Project',
    'A sample project to get started',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

INSERT INTO tasks (title, description, status, priority, project_id, assignee_id) VALUES
    ('Set up repository', 'Initialize the project structure', 'done', 'high', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Build authentication', 'JWT login and register endpoints', 'in_progress', 'high', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Design dashboard UI', 'Create the main project view', 'todo', 'medium', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NULL);