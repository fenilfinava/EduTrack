"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const [theme, setTheme] = React.useState<"dark" | "light">("dark")

    React.useEffect(() => {
        // Check if user has a preference or default to dark
        const isDark = document.documentElement.classList.contains("dark")
        setTheme(isDark ? "dark" : "light")
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark"
        setTheme(newTheme)

        // Toggle class on HTML element
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark")
            document.documentElement.classList.remove("light")
        } else {
            document.documentElement.classList.add("light")
            document.documentElement.classList.remove("dark")
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-10 h-10 bg-secondary/20 hover:bg-secondary/40 transition-all"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-orange-400" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
