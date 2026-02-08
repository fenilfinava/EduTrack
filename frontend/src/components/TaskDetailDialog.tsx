"use client"

import { useEffect, useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Loader2, Send, User, MessageSquare, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react"
import { apiClient } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface Task {
    id: string
    title: string
    description: string
    status: string
    priority: string
    due_date?: string
    assignee_name?: string
    project_title?: string
    assignee?: {
        name: string
    }
}

interface UserProfile {
    id: string
    name: string
    email: string
    avatar_url?: string
}

interface Comment {
    id: string
    content: string
    created_at: string
    user_id: string
    user?: UserProfile
}

interface TaskDetailDialogProps {
    taskId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onTaskUpdate?: () => void
}

export function TaskDetailDialog({ taskId, open, onOpenChange, onTaskUpdate }: TaskDetailDialogProps) {
    const [task, setTask] = useState<Task | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [newComment, setNewComment] = useState("")
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
    const [commentError, setCommentError] = useState<string | null>(null)
    const commentsEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [comments])

    useEffect(() => {
        if (open && taskId) {
            loadData(taskId)
            loadCurrentUser()
        } else {
            setTask(null)
            setComments([])
            setNewComment("")
            setCommentError(null)
        }
    }, [open, taskId])

    async function loadCurrentUser() {
        try {
            const res = await apiClient.getCurrentUser()
            if (res.success && res.data) {
                setCurrentUser(res.data as UserProfile)
            }
        } catch (e) {
            console.error("Failed to load user", e)
        }
    }

    async function loadData(id: string) {
        setLoading(true)
        try {
            // Fetch task details
            const taskRes = await apiClient.getTask(id)
            if (taskRes.success && taskRes.data) {
                const taskData = taskRes.data as Task
                // Map assignee name if nested object
                if (taskData.assignee?.name) {
                    taskData.assignee_name = taskData.assignee.name
                }
                setTask(taskData)
            }

            // Fetch comments
            const commentsRes = await apiClient.getComments(id)
            if (commentsRes.success && commentsRes.data) {
                setComments(commentsRes.data as Comment[])
            }
        } catch (err) {
            console.error("Failed to load task details:", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSendComment(e: React.FormEvent) {
        e.preventDefault()
        if (!newComment.trim()) return

        console.log("Sending comment:", newComment)
        setSending(true)
        setCommentError(null)
        try {
            if (taskId) {
                const res = await apiClient.createComment(taskId, newComment)
                console.log("createComment response:", res)

                if (res.success) {
                    setNewComment("")
                    // Refresh comments
                    const commentsRes = await apiClient.getComments(taskId)
                    if (commentsRes.success) {
                        setComments(commentsRes.data as Comment[])
                    }
                } else {
                    console.error("Comment creation failed:", res)
                    toast.error(res.error || "Failed to submit comment")
                    setCommentError(null)
                }
            }
        } catch (err) {
            console.error("Failed to send comment:", err)
            setCommentError("An error occurred while sending the comment.")
        } finally {
            setSending(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />
            case 'in_review': return <AlertCircle className="h-4 w-4 text-yellow-500" />
            default: return <Clock className="h-4 w-4 text-slate-500" />
        }
    }

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical': return 'destructive'
            case 'high': return 'warning'
            default: return 'outline'
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="flex flex-col h-full max-h-[85vh]">
                    {loading && !task ? (
                        <div className="flex items-center justify-center h-64">
                            <DialogHeader className="sr-only">
                                <DialogTitle>Loading Task Details</DialogTitle>
                            </DialogHeader>
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : task ? (
                        <>
                            <div className="p-6 border-b pb-4">
                                <DialogHeader className="mb-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                                <span>{task.project_title || "Project Task"}</span>
                                                {task.due_date && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(task.due_date).toLocaleDateString()}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <DialogTitle className="text-xl font-bold leading-tight">
                                                {task.title}
                                            </DialogTitle>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                                                <select
                                                    className="flex h-6 rounded-full border border-input bg-background px-2 text-xs font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={task.status}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value
                                                        // Optimistic update
                                                        setTask({ ...task, status: newStatus })
                                                        try {
                                                            const res = await apiClient.updateTaskStatus(task.id, newStatus)
                                                            if (res.success) {
                                                                if (onTaskUpdate) onTaskUpdate()
                                                            } else {
                                                                // Revert
                                                                setTask({ ...task, status: task.status })
                                                                console.error("Failed to update status")
                                                            }
                                                        } catch (err) {
                                                            setTask({ ...task, status: task.status })
                                                            console.error("Failed to update status", err)
                                                        }
                                                    }}
                                                >
                                                    <option value="todo">Todo</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="in_review">In Review</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogDescription className="sr-only">
                                        Task details and comments
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description</Label>
                                        <div className="mt-1 text-sm whitespace-pre-wrap">
                                            {task.description || "No description provided."}
                                        </div>
                                    </div>

                                    {task.assignee_name && (
                                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md w-fit">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">Assigned to: <span className="font-medium">{task.assignee_name}</span></span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 flex flex-col bg-muted/10">
                                <div className="px-6 py-3 border-b flex items-center gap-2 bg-background/50">
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="font-semibold text-sm">Comments ({comments.length})</span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                                    {comments.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>No comments yet.</p>
                                            <p className="text-xs mt-1">Be the first to start the discussion!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {comments.map((comment) => (
                                                <div key={comment.id} className={`flex gap-3 ${comment.user?.id === currentUser?.id ? 'flex-row-reverse' : ''}`}>
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0 border">
                                                        {comment.user?.name?.charAt(0) || "U"}
                                                    </div>

                                                    <div className={`space-y-1 max-w-[85%] ${comment.user?.id === currentUser?.id ? 'items-end' : ''}`}>
                                                        <div className={`flex items-center gap-2 text-xs text-muted-foreground ${comment.user?.id === currentUser?.id ? 'flex-row-reverse' : ''}`}>
                                                            <span className="font-medium text-foreground">{comment.user?.name || "Unknown"}</span>
                                                            <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                                                        </div>
                                                        <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${comment.user?.id === currentUser?.id
                                                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                            : 'bg-muted border rounded-tl-sm'
                                                            }`}>
                                                            {comment.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={commentsEndRef} />
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t bg-background">
                                    <form onSubmit={handleSendComment} className="flex gap-2">
                                        <Input
                                            placeholder="Type a message..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            disabled={sending}
                                            className="flex-1"
                                        />
                                        <Button type="submit" size="icon" disabled={sending || !newComment.trim()}>
                                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </Button>
                                    </form>
                                    {commentError && (
                                        <p className="text-xs text-red-500 mt-2">{commentError}</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <DialogHeader className="sr-only">
                                <DialogTitle>Task Not Found</DialogTitle>
                            </DialogHeader>
                            <AlertCircle className="h-8 w-8 mb-2" />
                            <p>Task not found</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog >
    )
}
