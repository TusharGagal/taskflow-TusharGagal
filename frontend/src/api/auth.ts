import client from './client'

export const register = (name: string, email: string, password: string) =>
    client.post('/auth/register', { name, email, password })

export const login = (email: string, password: string) =>
    client.post('/auth/login', { email, password })