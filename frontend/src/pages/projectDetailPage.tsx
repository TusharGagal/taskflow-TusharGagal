import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, getProjectMembers } from '../api/projects'
import { createTask, updateTask, deleteTask } from '../api/tasks'
import { type Project, type Task } from '../types'
import { useAuthStore } from '../store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const statusColors: Record<string, string> = {
    todo: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
}

const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
}

type TaskFormState = {
    title: string
    description: string
    status: Task['status'],
    due_date: string,
    priority: Task['priority'],
    assignee_id: string

}

const emptyTaskForm = (): TaskFormState => ({
    title: '',
    description: '',
    status: 'todo',
    due_date: '',
    priority: 'medium',
    assignee_id: '',
})

export default function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const userId = useAuthStore((s) => s.userId)
    const logout = useAuthStore((s) => s.logout)

    const [members, setMembers] = useState<{ id: string; name: string; email: string }[]>([])
    const [project, setProject] = useState<Project | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterAssignee, setFilterAssignee] = useState('all')


    const [showTaskDialog, setShowTaskDialog] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [taskForm, setTaskForm] = useState<TaskFormState>(emptyTaskForm)
    const [saving, setSaving] = useState(false)

    const fetchProject = useCallback(async () => {
        if (!id) {
            setLoading(false)
            setError('Invalid project')
            return
        }
        try {
            const [projectRes, membersRes] = await Promise.all([
                getProject(id),
                getProjectMembers(id),
            ])
            setProject(projectRes.data.project)
            setTasks(projectRes.data.tasks)
            setMembers(membersRes.data)
        } catch {
            setError('Failed to load project')
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        void fetchProject()
    }, [fetchProject])

    const openCreate = () => {
        setEditingTask(null)
        setTaskForm(emptyTaskForm())
        setShowTaskDialog(true)
    }

    const openEdit = (task: Task) => {
        setEditingTask(task)
        setTaskForm({
            title: task.title,
            description: task.description,
            status: task.status,
            due_date: task.due_date ? task.due_date.slice(0, 10) : '',
            priority: task.priority,
            assignee_id: task.assignee_id || ''
        })
        setShowTaskDialog(true)
    }

    const handleSaveTask = async () => {
        if (!taskForm.title.trim()) return
        setSaving(true)
        try {
            const payload: Partial<Task> = {
                title: taskForm.title,
                description: taskForm.description,
                status: taskForm.status,
                due_date: taskForm.due_date || null,
                priority: taskForm.priority,
                assignee_id: taskForm.assignee_id || null,
            }
            if (editingTask) {
                const res = await updateTask(editingTask.id, payload)
                setTasks(tasks.map((t) => (t.id === editingTask.id ? res.data : t)))
            } else {
                const res = await createTask(id!, payload)
                setTasks([res.data, ...tasks])
            }
            setShowTaskDialog(false)
        } catch {
            setError('Failed to save task')
        } finally {
            setSaving(false)
        }
    }

    // Optimistic status toggle
    const handleStatusChange = async (task: Task, newStatus: string) => {
        const prev = tasks
        setTasks(tasks.map((t) => t.id === task.id ? { ...t, status: newStatus as Task['status'] } : t))
        try {
            await updateTask(task.id, { status: newStatus as Task['status'] })
        } catch {
            setTasks(prev) // revert on error
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Delete this task?')) return
        setTasks(tasks.filter((t) => t.id !== taskId))
        await deleteTask(taskId)
    }

    const filteredTasks = tasks
        .filter((t) => filterStatus === 'all' || t.status === filterStatus)
        .filter((t) => filterAssignee === 'all' || t.assignee_id === filterAssignee)

    const grouped = {
        todo: filteredTasks.filter((t) => t.status === 'todo'),
        in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
        done: filteredTasks.filter((t) => t.status === 'done'),
    }
    if (loading) return <div className="p-8 text-slate-500">Loading...</div>
    if (error) return <div className="p-8 text-red-500">{error}</div>

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/projects')} className="text-slate-400 hover:text-slate-600 text-sm">
                        ← Projects
                    </button>
                    <h1 className="text-xl font-semibold">{project?.name}</h1>
                </div>
                <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login') }}>
                    Logout
                </Button>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {project?.description && (
                    <p className="text-slate-500 mb-6">{project.description}</p>
                )}

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Button onClick={openCreate}>+ New Task</Button>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="todo">Todo</SelectItem>
                            <SelectItem value="in_progress">In progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Filter by assignee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All assignees</SelectItem>
                            {members.map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Empty state */}
                {filteredTasks.length === 0 && (
                    <div className="text-center py-24 text-slate-400">
                        <p className="text-lg font-medium">No tasks found</p>
                        <p className="text-sm mt-1">
                            {filterStatus !== 'all' ? 'Try a different filter' : 'Create your first task to get started'}
                        </p>
                    </div>
                )}

                {/* Kanban columns */}
                {filteredTasks.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(['todo', 'in_progress', 'done'] as const).map((status) => (
                            <div key={status} className="space-y-3">
                                {/* Column header */}
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[status]}`}>
                                        {status.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className="text-xs text-slate-400">{grouped[status].length}</span>
                                </div>

                                {/* Empty column placeholder */}
                                {grouped[status].length === 0 && (
                                    <div className="border-2 border-dashed border-slate-200 rounded-lg h-20 flex items-center justify-center">
                                        <p className="text-xs text-slate-300">No tasks</p>
                                    </div>
                                )}

                                {/* Task cards */}
                                {grouped[status].map((task) => (
                                    <div key={task.id}
                                        className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <p className="font-medium text-slate-800 text-sm leading-snug">{task.title}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${priorityColors[task.priority]}`}>
                                                {task.priority}
                                            </span>
                                        </div>

                                        {task.description && (
                                            <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p>
                                        )}

                                        {task.due_date && (
                                            <p className="text-xs text-slate-400 mb-3">
                                                Due {new Date(task.due_date).toLocaleDateString()}
                                            </p>
                                        )}
                                        {task.assignee_id && (
                                            <p className="text-xs text-slate-400 mb-2">
                                                Assigned to: {members.find((m) => m.id === task.assignee_id)?.name ?? 'Unknown'}
                                            </p>
                                        )}

                                        <Select value={task.status} onValueChange={(v) => handleStatusChange(task, v)}>
                                            <SelectTrigger className="h-7 text-xs w-full mb-2">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="todo">Todo</SelectItem>
                                                <SelectItem value="in_progress">In progress</SelectItem>
                                                <SelectItem value="done">Done</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" className="h-7 text-xs flex-1"
                                                onClick={() => openEdit(task)}>
                                                Edit
                                            </Button>
                                            {project?.owner_id === userId && (
                                                <Button variant="ghost" size="sm"
                                                    className="h-7 text-xs text-red-400 hover:text-red-600 flex-1"
                                                    onClick={() => handleDeleteTask(task.id)}>
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
                {/* Task dialog */}
                <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
                            <DialogDescription className="sr-only">
                                {editingTask ? 'Update task details' : 'Create a new task for this project'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1">
                                <Label>Title</Label>
                                <Input
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    placeholder="Task title"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Description</Label>
                                <Input
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Status</Label>
                                    <Select value={taskForm.status} onValueChange={(v) => setTaskForm({ ...taskForm, status: v as Task['status'] })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todo">Todo</SelectItem>
                                            <SelectItem value="in_progress">In progress</SelectItem>
                                            <SelectItem value="done">Done</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Priority</Label>
                                    <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v as Task['priority'] })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>Due date</Label>
                                <Input
                                    type="date"
                                    value={taskForm.due_date}
                                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>Assignee</Label>
                                <Select
                                    value={taskForm.assignee_id || 'unassigned'}
                                    onValueChange={(v) => setTaskForm({ ...taskForm, assignee_id: v === 'unassigned' ? '' : v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {members.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>Cancel</Button>
                            <Button onClick={handleSaveTask} disabled={saving}>
                                {saving ? 'Saving...' : editingTask ? 'Save changes' : 'Create task'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}