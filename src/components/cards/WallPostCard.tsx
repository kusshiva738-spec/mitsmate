type Post = {
  id: string;
  name: string;
  text: string;
  time: string;
};

interface WallPostProps {
  post: Post;
}

export default function WallPostCard({
  post,
}: WallPostProps) {

  return (

    <div className="bg-[#17122b] rounded-3xl p-5 border border-white/10">

      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-white text-lg font-bold">
            {post.name}
          </h3>

          <p className="text-white/40 text-sm mt-1">
            {post.time}
          </p>

        </div>

      </div>

      <p className="text-white/70 mt-5 leading-relaxed">
        {post.text}
      </p>

      <div className="flex gap-6 mt-6 text-white/50">

        <button>
          ❤️ 24
        </button>

        <button>
          💬 5
        </button>

      </div>

    </div>
  );
}