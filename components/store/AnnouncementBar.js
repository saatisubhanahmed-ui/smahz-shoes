import { site } from "@/lib/site";

export default function AnnouncementBar() {
  // Repeat the list so the marquee loops seamlessly
  const list = [...site.announcements, ...site.announcements, ...site.announcements, ...site.announcements];
  return (
    <div className="marquee" role="region" aria-label="Store announcements">
      <div className="marquee-track">
        {list.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}
