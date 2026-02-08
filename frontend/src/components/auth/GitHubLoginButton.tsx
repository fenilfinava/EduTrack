'use client';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

export function GitHubLoginButton() {
    const handleGitHubLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/student`,
                scopes: 'read:user user:email'
            }
        });

        if (error) {
            console.error('GitHub login error:', error);
            alert('Failed to login with GitHub');
        }
    };

    return (
        <Button
            onClick={handleGitHubLogin}
            variant="outline"
            className="w-full"
        >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
        </Button>
    );
}
