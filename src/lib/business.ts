import type { Locale } from "@/lib/content";

export const instagramUrl = "https://www.instagram.com/iroselectronics/";
export const googleMapsUrl = "https://maps.app.goo.gl/ZMNnBNvbmhgKiUT26";

export const businessContact = {
  instagramHandle: "@iroselectronics",
  locationLabel: {
    es: "Ubicación de iroselectronics en Google Maps",
    en: "iroselectronics location on Google Maps",
  } satisfies Record<Locale, string>,
  visitStore: {
    es: "Ver ubicación",
    en: "View location",
  } satisfies Record<Locale, string>,
  followInstagram: {
    es: "Seguir en Instagram",
    en: "Follow on Instagram",
  } satisfies Record<Locale, string>,
};
