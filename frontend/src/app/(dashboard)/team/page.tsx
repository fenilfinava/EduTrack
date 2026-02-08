"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, UserPlus, Users, Mail, Shield, Plus, Briefcase, Trash2, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { EvaluationDialog } from "@/components/EvaluationDialog"
import { ClipboardList } from "lucide-react"

interface User {
    id: string
    name: string
    email: string
    role: string
    avatar_url?: string
}

interface Team {
    id: string
    name: string
    mentor_id: string
    created_at: string
    mentor?: User
    team_members: { user: User }[]
    projects: { count: number }[]
}

export default function TeamPage() {
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<User | null>(null)

    // Create Team State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newTeamName, setNewTeamName] = useState("")
    const [availableStudents, setAvailableStudents] = useState<User[]>([])
    const [availableMentors, setAvailableMentors] = useState<User[]>([])
    const [selectedStudents, setSelectedStudents] = useState<string[]>([])
    const [selectedMentor, setSelectedMentor] = useState<string>("")
    const [isCreating, setIsCreating] = useState(false)

    // Evaluation State
    const [isEvaluationOpen, setIsEvaluationOpen] = useState(false)
    const [selectedStudentForEvaluation, setSelectedStudentForEvaluation] = useState<User | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            setLoading(true)
            const userRes = await apiClient.getCurrentUser()
            if (userRes.success && userRes.data) {
                const user = userRes.data as User
                setCurrentUser(user)

                // Fetch Teams
                const teamsRes = await apiClient.getTeams()
                if (teamsRes.success) {
                    setTeams(teamsRes.data as Team[])
                }

                // Fetch Users for selection (if needed)
                if (user.role === 'admin' || user.role === 'mentor') {
                    const usersRes = await apiClient.getUsers()
                    if (usersRes.success && usersRes.data) {
                        const allUsers = usersRes.data as User[]
                        setAvailableStudents(allUsers.filter(u => u.role === 'student'))
                        setAvailableMentors(allUsers.filter(u => u.role === 'mentor'))
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch team data:", err)
            toast.error("Failed to load team data")
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateTeam() {
        if (!newTeamName.trim()) {
            toast.error("Team name is required")
            return
        }
        if (selectedStudents.length === 0) {
            toast.error("Select at least one student")
            return
        }

        // Admin must select a mentor
        let mentorId = currentUser?.id
        if (currentUser?.role === 'admin') {
            if (!selectedMentor) {
                toast.error("Select a mentor")
                return
            }
            mentorId = selectedMentor
        }

        try {
            setIsCreating(true)
            const res = await apiClient.createTeam({
                name: newTeamName,
                student_ids: selectedStudents,
                mentor_id: mentorId
            })

            if (res.success) {
                toast.success("Team created successfully")
                setIsCreateOpen(false)
                setNewTeamName("")
                setSelectedStudents([])
                setSelectedMentor("")
                fetchData() // Refresh list
            } else {
                toast.error(res.error || "Failed to create team")
            }
        } catch (err) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsCreating(false)
        }
    }

    const toggleStudentSelection = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
                    <p className="text-muted-foreground">
                        {currentUser?.role === 'student' ? "My Team" : "Manage Teams and Members"}
                    </p>
                </div>
                {(currentUser?.role === 'admin' || currentUser?.role === 'mentor') && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" /> Create Team
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create New Team</DialogTitle>
                                <DialogDescription>
                                    Create a team, assign a mentor (if admin), and add students.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Team Name</Label>
                                    <Input
                                        id="name"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        placeholder="e.g. Alpha Squad"
                                    />
                                </div>

                                {currentUser?.role === 'admin' && (
                                    <div className="grid gap-2">
                                        <Label>Select Mentor</Label>
                                        <select
                                            className="w-full p-2 rounded-md border bg-background"
                                            value={selectedMentor}
                                            onChange={(e) => setSelectedMentor(e.target.value)}
                                        >
                                            <option value="">Select a mentor...</option>
                                            {availableMentors.map(mentor => (
                                                <option key={mentor.id} value={mentor.id}>
                                                    {mentor.name} ({mentor.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label>Select Students ({selectedStudents.length})</Label>
                                    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                        <div className="space-y-4">
                                            {availableStudents.map(student => (
                                                <div key={student.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={student.id}
                                                        checked={selectedStudents.includes(student.id)}
                                                        onCheckedChange={() => toggleStudentSelection(student.id)}
                                                    />
                                                    <label
                                                        htmlFor={student.id}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full"
                                                    >
                                                        {student.name} <span className="text-muted-foreground ml-1">({student.email})</span>
                                                    </label>
                                                </div>
                                            ))}
                                            {availableStudents.length === 0 && (
                                                <p className="text-sm text-muted-foreground">No students available.</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateTeam} disabled={isCreating}>
                                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Team
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Teams Found</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        {currentUser?.role === 'student'
                            ? "You haven't been assigned to a team yet."
                            : "Get started by creating a team and adding members."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team) => (
                        <Card key={team.id} className="flex flex-col hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{team.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <Shield className="h-3 w-3 text-primary" />
                                            <span className="font-medium text-foreground">{team.mentor?.name || "Unassigned"}</span>
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="flex gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        {team.projects?.[0]?.count || 0} Projects
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <Label className="text-xs font-semibold text-muted-foreground mb-3 block tracking-wider">TEAM MEMBERS</Label>
                                <div className="space-y-3">
                                    {team.team_members?.slice(0, 5).map((member) => (
                                        <div key={member.user.id} className="flex items-center gap-3 text-sm">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-primary font-bold text-xs border border-primary/10">
                                                {member.user.name?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium leading-none">{member.user.name}</span>
                                                <span className="text-xs text-muted-foreground">{member.user.email}</span>
                                            </div>
                                            {currentUser?.role === 'mentor' && team.mentor_id === currentUser.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="ml-auto h-6 w-6 text-muted-foreground hover:text-primary"
                                                    title="Evaluate Student"
                                                    onClick={(e) => {
                                                        e.stopPropagation() // Prevent card click
                                                        setSelectedStudentForEvaluation(member.user)
                                                        setIsEvaluationOpen(true)
                                                    }}
                                                >
                                                    <ClipboardList className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {(team.team_members?.length || 0) > 5 && (
                                        <p className="text-xs text-muted-foreground pl-11 italic">
                                            + {(team.team_members?.length || 0) - 5} more students...
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4 bg-muted/30 mt-auto flex-col gap-3 items-start">
                                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-3 w-3" />
                                        {team.team_members?.length || 0} Students
                                    </div>
                                    <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
                                </div>

                                {(currentUser?.role === 'admin' || (currentUser?.role === 'mentor' && team.mentor_id === currentUser.id)) && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="w-full mt-2">
                                                <UserPlus className="h-4 w-4 mr-2" /> Manage Members
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[500px]">
                                            <DialogHeader>
                                                <DialogTitle>Manage Members - {team.name}</DialogTitle>
                                                <DialogDescription>
                                                    Add or remove students from this team.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-6 py-4">
                                                {/* Current Members */}
                                                <div className="space-y-2">
                                                    <Label>Current Members</Label>
                                                    <div className="border rounded-md divide-y max-h-[150px] overflow-y-auto">
                                                        {team.team_members?.length === 0 ? (
                                                            <p className="text-sm text-muted-foreground p-3">No members yet.</p>
                                                        ) : (
                                                            team.team_members?.map((member) => (
                                                                <div key={member.user.id} className="flex items-center justify-between p-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                                                                            {member.user.name?.charAt(0)}
                                                                        </div>
                                                                        <span className="text-sm">{member.user.name}</span>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                        onClick={async () => {
                                                                            if (confirm(`Remove ${member.user.name} from team?`)) {
                                                                                try {
                                                                                    const res = await apiClient.removeTeamMember(team.id, member.user.id)
                                                                                    if (res.success) {
                                                                                        toast.success("Member removed")
                                                                                        fetchData()
                                                                                    } else {
                                                                                        toast.error(res.error || "Failed to remove member")
                                                                                    }
                                                                                } catch (e) {
                                                                                    toast.error("Error removing member")
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Add New Member */}
                                                <div className="space-y-2">
                                                    <Label>Add Student</Label>
                                                    <div className="flex gap-2">
                                                        <select
                                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                            onChange={async (e) => {
                                                                if (e.target.value) {
                                                                    try {
                                                                        const res = await apiClient.addTeamMember(team.id, e.target.value)
                                                                        if (res.success) {
                                                                            toast.success("Member added")
                                                                            fetchData()
                                                                            e.target.value = "" // Reset select
                                                                        } else {
                                                                            toast.error(res.error || "Failed to add member")
                                                                        }
                                                                    } catch (err) {
                                                                        toast.error("Error adding member")
                                                                    }
                                                                }
                                                            }}
                                                            defaultValue=""
                                                        >
                                                            <option value="" disabled>Select a student to add...</option>
                                                            {availableStudents
                                                                .filter(s => !team.team_members.some(m => m.user.id === s.id))
                                                                .map(student => (
                                                                    <option key={student.id} value={student.id}>
                                                                        {student.name} ({student.email})
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}

                                {currentUser?.role === 'admin' && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="secondary" size="sm" className="w-full mt-2">
                                                <Settings className="h-4 w-4 mr-2" /> Edit Team
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit Team - {team.name}</DialogTitle>
                                                <DialogDescription>Update team details and mentor assignment.</DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor={`edit-name-${team.id}`}>Team Name</Label>
                                                    <Input
                                                        id={`edit-name-${team.id}`}
                                                        defaultValue={team.name}
                                                        name="name"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor={`edit-mentor-${team.id}`}>Assign Mentor</Label>
                                                    <select
                                                        id={`edit-mentor-${team.id}`}
                                                        name="mentor_id"
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        defaultValue={team.mentor_id || ""}
                                                    >
                                                        <option value="">Select a mentor...</option>
                                                        {availableMentors.map(mentor => (
                                                            <option key={mentor.id} value={mentor.id}>
                                                                {mentor.name} ({mentor.email})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={async (e) => {
                                                    const dialogContent = e.currentTarget.closest('[role="dialog"]');
                                                    const nameInput = dialogContent?.querySelector(`input[name="name"]`) as HTMLInputElement;
                                                    const mentorSelect = dialogContent?.querySelector(`select[name="mentor_id"]`) as HTMLSelectElement;

                                                    if (nameInput && mentorSelect) {
                                                        try {
                                                            const res = await apiClient.updateTeam(team.id, {
                                                                name: nameInput.value,
                                                                mentor_id: mentorSelect.value || null
                                                            });

                                                            if (res.success) {
                                                                toast.success("Team updated");
                                                                fetchData();
                                                                // Close dialog logic or user manually closes
                                                            } else {
                                                                toast.error(res.error || "Failed to update team");
                                                            }
                                                        } catch (err) {
                                                            toast.error("Error updating team");
                                                        }
                                                    }
                                                }}>
                                                    Save Changes
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            {/* Evaluation Dialog */}
            {selectedStudentForEvaluation && (
                <EvaluationDialog
                    open={isEvaluationOpen}
                    onOpenChange={(open) => {
                        setIsEvaluationOpen(open)
                        if (!open) setSelectedStudentForEvaluation(null)
                    }}
                    student={selectedStudentForEvaluation}
                    projects={[]}
                    onSuccess={() => {
                        toast.success("Evaluation saved")
                    }}
                />
            )}
        </div>
    )
}
