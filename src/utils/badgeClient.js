// frontend/src/utils/badgeClient.js
let cache = null;

export async function getBadgeMeta() {
  if (cache) return cache;
  try {
    const res = await fetch("/api/badges");
    if (!res.ok) return [];
    const data = await res.json();
    cache = data.badges || [];
    return cache;
  } catch (e) {
    console.error("Failed to load badge metadata:", e);
    return [];
  }
}

export function findMetaFor(slug, metas = []) {
  return metas.find(m => m.slug === slug) || null;
}
