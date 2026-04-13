# Stage 1: Build the Go binary
FROM golang:1.26-alpine AS builder
WORKDIR /app
# COPY go.mod go.sum ./
COPY . .
RUN go mod download
RUN go build -o api ./cmd/api

# Stage 2: Minimal runtime image
FROM alpine:3.19
WORKDIR /app
# Copy binary from builder
COPY --from=builder /app/api .
# Copy migrations so they're available inside the container
COPY --from=builder /app/migrations /migrations
EXPOSE 8080
CMD ["./api"]