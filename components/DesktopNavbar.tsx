"use client"
import React from "react";
import Link from "next/link";
import { useUser, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { ModeToggle } from "./ModeToggler";
import { Home, Bell, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DesktopNavbar() {
  const { isSignedIn } = useUser();

  return isSignedIn ? (
    <div className="flex items-center gap-6">
      <Button variant="ghost" asChild>
        <Link href="/" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link href="/notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link href="/profile" className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span>Profile</span>
        </Link>
      </Button>
      <ModeToggle />
      <UserButton />
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <Button variant="outline">Sign In</Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button>Sign Up</Button>
      </SignUpButton>
    </div>
  );
}
