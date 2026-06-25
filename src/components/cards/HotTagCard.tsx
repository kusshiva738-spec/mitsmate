type Props = {
  tag: string;
};

export default function HotTagCard({
  tag,
}: Props) {

  return (

    <div className="bg-white/10 px-4 py-2 rounded-full text-white text-sm hover:bg-purple-600 transition-all cursor-pointer">
      {tag}
    </div>
  );
}