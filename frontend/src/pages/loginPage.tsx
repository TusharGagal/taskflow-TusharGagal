import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((s) => s.setAuth)
    const [isRegister, setIsRegister] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        setError('')
        setLoading(true)
        try {
            const res = isRegister
                ? await register(name, email, password)
                : await login(email, password)
            setAuth(res.data.token, res.data.user_id)
            navigate('/projects')
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                const msg = (err.response?.data as { error?: string } | undefined)?.error
                setError(msg ?? 'Something went wrong')
            } else {
                setError('Something went wrong')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {isRegister ? 'Create account' : 'Welcome back'}
                    </CardTitle>
                    <CardDescription>
                        {isRegister ? 'Sign up to get started' : 'Sign in to TaskFlow'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isRegister && (
                        <div className="space-y-1">
                            <Label>Name</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                        </div>
                    )}
                    <div className="space-y-1">
                        <Label>Email</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                    </div>
                    <div className="space-y-1">
                        <Label>Password</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
                    </Button>

                    <p className="text-sm text-center text-slate-500">
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            className="text-slate-900 font-medium underline"
                            onClick={() => { setIsRegister(!isRegister); setError('') }}
                        >
                            {isRegister ? 'Sign in' : 'Sign up'}
                        </button>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}