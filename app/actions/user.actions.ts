"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Function to synchronize user data with the database
export async function syncUser() {
  try {
    const { userId } = await auth(); // Get the Clerk user ID
    const user = await currentUser(); // Get the Clerk user data

    if (!userId || !user) return null;

    // Get cleaned user data from Clerk
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const name = `${firstName} ${lastName}`.trim() || "Anonymous";
    const email = user.emailAddresses[0]?.emailAddress || "";
    const username = user.username || email.split("@")[0] || "user";
    const image = user.imageUrl;

    // Upsert user data
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: { name, username, email, image },
      create: {
        clerkId: userId,
        name,
        username,
        email,
        image,
      },
    });

    return dbUser;
  } catch (error) {
    console.error("Error in Sync User:", error);
    throw new Error("Failed to synchronize user");
  }
}

// Function to get a user by their Clerk ID
export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    include: {
      _count: {
        select: { followers: true, following: true, posts: true },
      },
    },
  });
}

// Retrieve database user ID with synchronization
export async function getDbUserId() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;
    const user = await syncUser(); // Ensure user exists
    if (!user) throw new Error("User synchronization failed");

    return user.id;
  } catch (error) {
    console.error("Error in getDbUserId:", error);
    throw error;
  }
}

// Get random users excluding current user and existing follows
export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();
    if (!userId) return []; // Return empty array if user not found
    return await prisma.user.findMany({
      // Fetch random users
      where: {
        AND: [
          { NOT: { id: userId } },
          { NOT: { followers: { some: { followerId: userId } } } }, // Exclude existing follows
        ],
      },
      select: {
        // Select user fields
        id: true,
        name: true,
        username: true,
        image: true,
        _count: { select: { followers: true } },
      },
      take: 3, // Limit to 3 users
    });
  } catch (error) {
    console.error("Error Fetching Random Users:", error);
    return [];
  }
}

// Server action to handle follow/unfollow
export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId(); // Get the current user ID
    if (!userId) return;
    if (userId === targetUserId) throw new Error("Cannot follow yourself"); // Prevent self-following

    const existingFollow = await prisma.follow.findUnique({
      // Check if follow exists
      where: {
        followerId_followingId: {
          // Composite key
          followerId: userId, // Current user ID
          followingId: targetUserId, // Target user ID
        },
      },
    });

    if (existingFollow) {
      // If follow exists, delete it
      await prisma.follow.delete({
        // Delete the follow
        where: {
          // Find the follow by composite key
          followerId_followingId: {
            followerId: userId, // Current user ID
            followingId: targetUserId,
          },
        },
      });
    } else {
      await prisma.$transaction([
        // Create follow and notification
        prisma.follow.create({
          // Create the follow
          data: { followerId: userId, followingId: targetUserId }, // Create the follow
        }), // Create the notification
        prisma.notification.create({
          data: { type: "FOLLOW", userId: targetUserId, creatorId: userId },
        }),
      ]);
    }

    revalidatePath("/"); // Revalidate the homepage
    return { success: true };
  } catch (error) {
    console.error("Error in toggleFollow:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
