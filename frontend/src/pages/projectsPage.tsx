import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, createProject, deleteProject } from '../api/projects'
import { type Project } from '../types'
import { useAuthStore } from '../store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function ProjectsPage() {
    const navigate = useNavigate()
    const logout = useAuthStore((s) => s.logout)
    const userId = useAuthStore((s) => s.userId)
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showDialog, setShowDialog] = useState(false)
    const [newName, setNewName] = useState('')
    const [newDesc, setNewDesc] = useState('')
    const [creating, setCreating] = useState(false)

    const fetchProjects = async () => {
        try {
            const res = await getProjects()
            setProjects(res.data)
        } catch {
            setError('Failed to load projects')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchProjects() }, [])

    const handleCreate = async () => {
        if (!newName.trim()) return
        setCreating(true)
        try {
            const res = await createProject(newName, newDesc)
            setProjects([res.data, ...projects])
            setShowDialog(false)
            setNewName('')
            setNewDesc('')
        } catch {
            setError('Failed to create project')
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Delete this project and all its tasks?')) return
        await deleteProject(id)
        setProjects(projects.filter((p) => p.id !== id))
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">TaskFlow</h1>
                <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login') }}>
                    Logout
                </Button>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Projects</h2>
                    <Button onClick={() => setShowDialog(true)}>+ New Project</Button>
                </div>

                {loading && <p className="text-slate-500">Loading projects...</p>}
                {error && <p className="text-red-500">{error}</p>}

                {!loading && projects.length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                        <p className="text-lg">No projects yet</p>
                        <p className="text-sm mt-1">Create your first project to get started</p>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    {projects.map((p) => (
                        <Card
                            key={p.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => navigate(`/projects/${p.id}`)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{p.name}</CardTitle>
                                        {p.description && (
                                            <CardDescription className="mt-1">{p.description}</CardDescription>
                                        )}
                                    </div>
                                    {p.owner_id === userId && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={(e) => handleDelete(p.id, e)}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Create project dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label>Name</Label>
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Project name" />
                        </div>
                        <div className="space-y-1">
                            <Label>Description (optional)</Label>
                            <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What is this project about?" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating}>
                            {creating ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}