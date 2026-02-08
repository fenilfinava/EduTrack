import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background text-foreground">
      <div className="container relative flex flex-col items-center justify-center gap-6 px-4 py-16 text-center md:py-32">
        <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
          Student Project <br /> Tracking System
        </h1>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Manage your academic projects, track milestones, and collaborate with your team and mentors seamlessly. Integrated with GitHub.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-forwards">
          <Link href="/login">
            <Button size="lg" variant="premium">
              Get Started
            </Button>
          </Link>
          <Link href="/student">
            <Button size="lg" variant="outline">
              View Dashboard Demo
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center p-6 border rounded-xl bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
            <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Project Management</h3>
            <p className="text-muted-foreground">Keep all your projects organized with deadlines, status, and priorities in one place.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 border rounded-xl bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
            <div className="mb-4 rounded-full bg-secondary text-secondary-foreground p-3">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Contribution Tracking</h3>
            <p className="text-muted-foreground">Visualize individual contributions and sync automatically with GitHub commits.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 border rounded-xl bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
            <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Mentor Feedback</h3>
            <p className="text-muted-foreground">Receive timely feedback from mentors directly on your tasks and milestones.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
