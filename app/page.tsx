import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import SuggestedUsers from "@/components/SuggestedUsers";
import { currentUser } from "@clerk/nextjs/server";
import { getPosts } from "./actions/post.actions";
import { getDbUserId } from "./actions/user.actions";

export default async function Home() {
  const user = await currentUser(); // Get the current user
  const posts = await getPosts(); // Get all posts
  const dbUserId = await getDbUserId(); // Get the database user ID

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {user ? <CreatePost /> : null}

        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} dbUserId={dbUserId} />
          ))}
        </div>
      </div>
      <div className="hidden lg:block lg:col-span-4 sticky top-20">
        <SuggestedUsers />
      </div>
    </div>
  );
}
