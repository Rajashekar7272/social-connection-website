"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.actions";

//Creates a new post with the given content and image.
export async function createPost(content: string, image: string) {
  try {
    const userId = await getDbUserId(); // Get the user ID from the database
    if (!userId) return;
    // Create a new post in the database
    const post = await prisma.post.create({
      data: {
        content,
        image,
        authorId: userId,
      },
    });
    revalidatePath("/"); // Revalidate the homepage to reflect the new post
    return { success: true, post }; // Return the success status and the created post
  } catch (error) {
    // Log the error and return the failure status and error message
    console.log("Failed to create Post", error);
    return { success: false, error: "Failed to create Post" };
  }
}

export async function getPosts() {
  try {
    // Get all posts from the database
    const posts = prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true },
        },
        comments: {
          // Include the comments of each post
          include: {
            author: {
              select: { id: true, name: true, username: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" }, // Order the comments by creation date
        },
        likes: {
          // Include the likes of each post
          select: { userId: true }, // Select the user ID of the likers
        },
        _count: {
          select: { likes: true, comments: true }, // Select the number of likes and comments
        },
      },
    });
    return posts; // Return the posts
  } catch (error) {
    console.log("Failed to get Posts", error); // Log the error
    throw new Error("Failed to get Posts"); // Throw an error
  }
}

export async function toggleLikePost(postId: string) {
  // Function to toggle a like on a post
  try {
    const userId = await getDbUserId(); // Get the user ID from the database
    if (!userId) return; // Return if the user ID is not found

    // check if like exists
    const existingLike = await prisma.like.findUnique({
      // Check if the like exists
      where: {
        userId_postId: {
          // Find the like by the user ID and post ID
          userId,
          postId,
        },
      },
    });

    const post = await prisma.post.findUnique({
      // Find the post by the post ID
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    if (existingLike) {
      // unlike if like exists
      await prisma.like.delete({
        // Delete the like if it exists
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } else {
      // like and create notification (only if liking someone else's post)
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            postId,
          },
        }),
        ...(post.authorId !== userId
          ? [
              prisma.notification.create({
                // Create a notification for the like
                data: {
                  type: "LIKE",
                  userId: post.authorId, // recipient (post author)
                  creatorId: userId, // person who liked
                  postId,
                },
              }),
            ]
          : []),
      ]);
    }

    revalidatePath("/"); // Revalidate the homepage
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function createComment(postId: string, content: string) {
  try {
    const userId = await getDbUserId(); // Get the user ID from the database

    if (!userId) return;
    if (!content) throw new Error("Content is required");

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    // Create comment and notification in a transaction
    const [comment] = await prisma.$transaction(async (tx) => {
      // Create comment first
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
        },
      });

      // Create notification if commenting on someone else's post
      if (post.authorId !== userId) {
        await tx.notification.create({
          data: {
            type: "COMMENT",
            userId: post.authorId,
            creatorId: userId,
            postId,
            commentId: newComment.id,
          },
        });
      }

      return [newComment];
    });

    revalidatePath(`/`); // Revalidate the homepage
    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: "Failed to create comment" };
  }
}

export async function deletePost(postId: string) {
  try {
    const userId = await getDbUserId();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");
    if (post.authorId !== userId)
      throw new Error("Unauthorized - no delete permission");

    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath("/"); // purge the cache
    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}
