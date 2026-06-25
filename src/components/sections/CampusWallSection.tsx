import WallPostCard from "@/components/cards/WallPostCard";

type Props = {
  posts: any[];
};

export default function CampusWallSection({
  posts,
}: Props) {

  return (

    <section>

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-3xl font-bold text-white">

          MITS Wall 🔥

        </h2>

      </div>

      <div className="space-y-5">

        {posts.map((post) => (

          <WallPostCard
            key={post.id}
            post={post}
          />

        ))}

      </div>

    </section>
  );
}