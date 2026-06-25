import InfoCard from "@/components/cards/InfoCard";

const items = [
  {
    title: "No pressure, just people",
    text: "Everyone’s here to vibe and make meaningful connections.",
  },
  {
    title: "Real & Respectful",
    text: "Be kind and build a positive campus culture.",
  },
  {
    title: "Your college, your people",
    text: "Connect with students who understand your campus life.",
  },
];

export default function FooterInfoSection() {

  return (

    <section className="mt-10 mb-20">

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {items.map((item) => (

          <InfoCard
            key={item.title}
            title={item.title}
            text={item.text}
          />

        ))}

      </div>

    </section>
  );
}