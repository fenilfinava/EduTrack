"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { apiClient } from "@/lib/api"
import { Loader2, Star } from "lucide-react"
import { toast } from "sonner"

interface Project {
    id: string
    title: string
}

interface EvaluationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    student: { id: string; name: string } | null
    projects?: Project[]
    onSuccess?: () => void
}

export function EvaluationDialog({ open, onOpenChange, student, projects = [], onSuccess }: EvaluationDialogProps) {
    // console.log("EvaluationDialog Render:", { open, student, projectsCount: projects.length })
    const [loading, setLoading] = useState(false)
    const [projectId, setProjectId] = useState<string>("")
    const [score, setScore] = useState([80])
    const [comments, setComments] = useState("")
    const [quality, setQuality] = useState([8])
    const [timeliness, setTimeliness] = useState([8])

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (open) {
            setProjectId("")
            setScore([80])
            setComments("")
            setQuality([8])
            setTimeliness([8])
        }
    }, [open])

    const handleSubmit = async () => {
        if (!student) return

        try {
            setLoading(true)

            const data = {
                student_id: student.id,
                project_id: (projectId && projectId !== "none") ? projectId : undefined,
                score: score[0],
                criteria: {
                    quality: quality[0],
                    timeliness: timeliness[0]
                },
                comments
            }

            const res = await apiClient.createEvaluation(data)

            if (res.success) {
                toast.success("Evaluation submitted successfully")
                onOpenChange(false)
                if (onSuccess) onSuccess()
            } else {
                toast.error(res.error || "Failed to submit evaluation")
            }
        } catch (error) {
            toast.error("An error occurred")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (!student) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Evaluate Student</DialogTitle>
                    <DialogDescription>
                        Assess performance for <span className="font-semibold text-foreground">{student.name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label>Project Context (Optional)</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a project..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">General Evaluation (No Project)</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Overall Score</Label>
                            <span className="text-xl font-bold text-primary">{score[0]}%</span>
                        </div>
                        <Slider
                            value={score}
                            onValueChange={setScore}
                            max={100}
                            step={1}
                            className="w-full"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Quality (1-10)</Label>
                                <span className="font-mono text-sm">{quality[0]}</span>
                            </div>
                            <Slider value={quality} onValueChange={setQuality} max={10} step={1} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Timeliness (1-10)</Label>
                                <span className="font-mono text-sm">{timeliness[0]}</span>
                            </div>
                            <Slider value={timeliness} onValueChange={setTimeliness} max={10} step={1} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Comments & Feedback</Label>
                        <Textarea
                            placeholder="Provide constructive feedback..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Evaluation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
