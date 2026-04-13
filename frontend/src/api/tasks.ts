import client from './client'
import { type Task } from '../types'

export const getTasks = (projectId: string, filters?: { status?: string; assignee?: string }) =>
    client.get(`/projects/${projectId}/tasks`, { params: filters })

export const createTask = (projectId: string, data: Partial<Task>) =>
    client.post(`/projects/${projectId}/tasks`, data)

export const updateTask = (taskId: string, data: Partial<Task>) =>
    client.patch(`/tasks/${taskId}`, data)

export const deleteTask = (taskId: string) =>
    client.delete(`/tasks/${taskId}`)