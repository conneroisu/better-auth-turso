"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function UserNav() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  if (!session) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
          <User className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{session.user.name}</span>
          <span className="text-xs text-muted-foreground">{session.user.email}</span>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>
    </div>
  );
}