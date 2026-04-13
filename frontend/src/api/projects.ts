import client from './client'

export const getProjects = () =>
  client.get('/projects')

export const getProject = (id: string) =>
  client.get(`/projects/${id}`)

export const createProject = (name: string, description: string) =>
  client.post('/projects', { name, description })

export const updateProject = (id: string, name: string, description: string) =>
  client.patch(`/projects/${id}`, { name, description })

export const deleteProject = (id: string) =>
  client.delete(`/projects/${id}`)

export const getProjectMembers = (id: string) =>
  client.get(`/projects/${id}/members`)