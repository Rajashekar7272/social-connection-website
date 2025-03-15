"use client";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { Bell, Home, Menu, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "./ModeToggler";

export default function MobileNavbar() {
  const { isSignedIn } = useUser();

  return (
    <div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" className="p-2">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          {isSignedIn ? (
            <div className="flex flex-col space-y-2">
              <SheetClose asChild>
                <Link href="/">
                  <Button variant="ghost" className="w-full justify-start">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/notifications">
                  <Button variant="ghost" className="w-full justify-start">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/profile">
                  <Button variant="ghost" className="w-full justify-start">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                </Link>
              </SheetClose>
              <SignOutButton>
                <Button variant="ghost" className="w-full justify-start">
                  Sign Out
                </Button>
              </SignOutButton>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <SignInButton mode="modal">
                <Button variant="outline" className="w-full justify-start">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ModeToggle />
    </div>
  );
}
