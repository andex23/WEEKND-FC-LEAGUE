import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/how-to-play", "/register", "/rules", "/fixtures", "/standings"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }))
}
