import { syncUser } from "@/app/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from "./MobileNavbar";

async function Navbar() {
  const user = await currentUser(); // Get the current user details from Clerk
  if (user) await syncUser(); // If a user exists, synchronize their data with the database by calling syncUser

  return (
    <nav className="sticky top-0 z-50 w-full px-4 py-4 bg-white dark:bg-black">
      {/* Container aligns the navbar with the main content container in layout.tsx */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Left side: Homepage link with the title "Social-Connections" */}
        <Link href="/" className="text-xl font-bold">
          Social-Connections
        </Link>
        {/* Right side: DesktopNavbar is visible on medium screens and larger */}
        <div className="hidden md:block">
          <DesktopNavbar />
        </div>
        {/* MobileNavbar is visible on smaller screens */}
        <div className="md:hidden">
          <MobileNavbar />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
