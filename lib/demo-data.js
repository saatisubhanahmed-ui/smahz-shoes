// Demo catalogue — shown automatically until Supabase keys are added to .env.local.
// Mirrors the starter data in supabase/schema.sql.

const img = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;

export const demoCategories = [
  { id: "cat-sneakers", name: "Sneakers", slug: "sneakers", description: "Street-ready everyday sneakers", image_url: img("1600185365483-26d7a4cc7519", 900), sort_order: 1 },
  { id: "cat-running", name: "Running", slug: "running", description: "Light, cushioned performance runners", image_url: img("1542291026-7eec264c27ff", 900), sort_order: 2 },
  { id: "cat-casual", name: "Casual", slug: "casual", description: "Easy slip-ons and everyday comfort", image_url: img("1525966222134-fcfa99b8ae77", 900), sort_order: 3 },
  { id: "cat-formal", name: "Formal", slug: "formal", description: "Polished leather for big days", image_url: img("1614252235316-8c857d38b5f4", 900), sort_order: 4 },
];

const cat = (slug) => demoCategories.find((c) => c.slug === slug);

const raw = [
  ["demo-1", "SMAHZ Aero Runner", "smahz-aero-runner", "Featherweight mesh upper with a responsive foam sole. Built for long walks, gym days and everything in between.", 5499, 6999, "running", ["1542291026-7eec264c27ff", "1608231387042-66d1773070a5"], ["39", "40", "41", "42", "43", "44", "45"], ["Red", "Black"], 40, true],
  ["demo-2", "SMAHZ Street Classic", "smahz-street-classic", "Clean low-top silhouette with a padded collar and grippy rubber outsole. Pairs with jeans, joggers or shalwar kameez.", 4299, 4999, "sneakers", ["1600185365483-26d7a4cc7519", "1549298916-b41d501d3772"], ["39", "40", "41", "42", "43", "44"], ["White", "Grey"], 35, true],
  ["demo-3", "SMAHZ Midnight High", "smahz-midnight-high", "High-top street sneaker with ankle support and a bold gold accent heel tab.", 6299, null, "sneakers", ["1606107557195-0e29a4b5b4aa", "1595950653106-6c9ebd614d3a"], ["40", "41", "42", "43", "44"], ["Black"], 20, true],
  ["demo-4", "SMAHZ Cloud Slip-On", "smahz-cloud-slip-on", "No laces, no fuss. Knit upper that hugs your foot and a cushioned insole for all-day comfort.", 3499, 3999, "casual", ["1525966222134-fcfa99b8ae77"], ["39", "40", "41", "42", "43", "44"], ["Navy", "Black"], 50, true],
  ["demo-5", "SMAHZ Velocity Pro", "smahz-velocity-pro", "Our fastest trainer — breathable upper, stability heel and energy-return sole.", 7499, 8999, "running", ["1608231387042-66d1773070a5", "1542291026-7eec264c27ff"], ["40", "41", "42", "43", "44", "45"], ["Multi"], 18, false],
  ["demo-6", "SMAHZ Heritage Oxford", "smahz-heritage-oxford", "Hand-finished genuine leather Oxford with a cushioned footbed. Office, weddings, Eid — sorted.", 8999, null, "formal", ["1614252235316-8c857d38b5f4"], ["40", "41", "42", "43", "44"], ["Brown", "Black"], 15, false],
  ["demo-7", "SMAHZ Retro Court", "smahz-retro-court", "Vintage court style with suede overlays and a comfortable cupsole.", 4799, 5499, "sneakers", ["1549298916-b41d501d3772"], ["39", "40", "41", "42", "43"], ["Cream"], 25, false],
  ["demo-8", "SMAHZ Urban Walker", "smahz-urban-walker", "Everyday walking shoe with memory-foam insole and anti-slip sole.", 3999, null, "casual", ["1595950653106-6c9ebd614d3a"], ["39", "40", "41", "42", "43", "44"], ["Olive", "Black"], 30, false],
];

export const demoProducts = raw.map(
  ([id, name, slug, description, price, compare_at_price, catSlug, images, sizes, colors, stock, is_featured], i) => ({
    id,
    name,
    slug,
    description,
    price,
    compare_at_price,
    category_id: cat(catSlug).id,
    category: cat(catSlug),
    images: images.map((x) => img(x)),
    sizes,
    colors,
    stock,
    is_featured,
    is_active: true,
    created_at: new Date(Date.UTC(2026, 8, 20 - i)).toISOString(),
  })
);
