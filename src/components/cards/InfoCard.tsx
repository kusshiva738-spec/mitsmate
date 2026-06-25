type Props = {
  title: string;
  text: string;
};

export default function InfoCard({
  title,
  text,
}: Props) {

  return (

    <div className="bg-[#17122b] rounded-3xl p-6 border border-white/10">

      <h3 className="text-white text-xl font-bold">
        {title}
      </h3>

      <p className="text-white/60 mt-4 leading-relaxed">
        {text}
      </p>

    </div>
  );
}