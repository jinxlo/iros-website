"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultSiteContent,
  type CollectionTile,
  type InstagramVideo,
  type LocalizedText,
  type ServiceTile,
  type SeasonalBanner,
  type ShowcasePanel,
  type SiteContent,
} from "@/lib/site-content";
import type { Locale } from "@/lib/content";

type EditableSection = "announcement";
type EditableNestedSection = "hero" | "featured" | "promo" | "seasonalBanner";

type SiteContentContextValue = {
  content: SiteContent;
  updateLocalized: (
    section: EditableSection,
    locale: Locale,
    value: string,
  ) => void;
  updateNestedLocalized: (
    section: EditableNestedSection,
    field: string,
    locale: Locale,
    value: string,
  ) => void;
  updateServiceTile: (
    id: string,
    field: keyof Pick<ServiceTile, "title" | "description">,
    locale: Locale,
    value: string,
  ) => void;
  updateCollectionTile: (
    id: string,
    field: keyof Pick<CollectionTile, "title" | "subtitle" | "cta">,
    locale: Locale,
    value: string,
  ) => void;
  updateShowcasePanel: (
    id: string,
    field: keyof Pick<ShowcasePanel, "kicker" | "title" | "description" | "priceLabel" | "stat">,
    locale: Locale,
    value: string,
  ) => void;
  updateInstagramVideo: (
    id: string,
    field: keyof Pick<InstagramVideo, "title" | "description">,
    locale: Locale,
    value: string,
  ) => void;
  updateInstagramVideoUrl: (id: string, field: keyof Pick<InstagramVideo, "url" | "imageUrl">, value: string) => void;
  updateSeasonalBannerSetting: (field: "theme" | "ctaHref", value: string) => void;
  updateHeroImage: (value: string) => void;
  updateCollectionImage: (id: string, value: string) => void;
  updateShowcaseImage: (id: string, value: string) => void;
  resetContent: () => void;
};

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

function localized(value: LocalizedText, locale: Locale, nextValue: string) {
  return { ...value, [locale]: nextValue };
}

function seasonalTheme(value: string): SeasonalBanner["theme"] {
  return value === "valentines" || value === "mothers" || value === "holiday"
    ? value
    : "default";
}

function mergeSiteContent(stored: Partial<SiteContent>): SiteContent {
  const withImageFallback = <T extends { imageUrl: string }>(base: T, override?: Partial<T>) => {
    if (!override) {
      return base;
    }

    const merged = { ...base, ...override };

    if (!merged.imageUrl?.trim()) {
      merged.imageUrl = base.imageUrl;
    }

    return merged;
  };
  const withShowcaseFallback = (item: ShowcasePanel) => {
    const merged = withImageFallback(
      item,
      stored.showcases?.find((storedItem) => storedItem.id === item.id),
    );

    // One-time upgrade for legacy countertop copy saved in localStorage.
    if (
      item.id === "countertop"
      && (
        merged.kicker.es === "Top de cocina"
        || merged.title.es === "Pequeños appliances, gran impacto"
        || merged.imageUrl?.includes("ninja slushie")
        || merged.imageUrl?.includes("ninja%20slushie")
      )
    ) {
      return { ...item };
    }

    return merged;
  };

  return {
    ...defaultSiteContent,
    ...stored,
    announcement: { ...defaultSiteContent.announcement, ...stored.announcement },
    hero: { ...defaultSiteContent.hero, ...stored.hero },
    featured: { ...defaultSiteContent.featured, ...stored.featured },
    promo: { ...defaultSiteContent.promo, ...stored.promo },
    seasonalBanner: {
      ...defaultSiteContent.seasonalBanner,
      ...stored.seasonalBanner,
      kicker: {
        ...defaultSiteContent.seasonalBanner.kicker,
        ...stored.seasonalBanner?.kicker,
      },
      title: {
        ...defaultSiteContent.seasonalBanner.title,
        ...stored.seasonalBanner?.title,
      },
      body: {
        ...defaultSiteContent.seasonalBanner.body,
        ...stored.seasonalBanner?.body,
      },
      cta: {
        ...defaultSiteContent.seasonalBanner.cta,
        ...stored.seasonalBanner?.cta,
      },
    },
    serviceTiles: defaultSiteContent.serviceTiles.map((item) => ({
      ...item,
      ...stored.serviceTiles?.find((storedItem) => storedItem.id === item.id),
    })),
    collections: defaultSiteContent.collections.map((item) =>
      withImageFallback(item, stored.collections?.find((storedItem) => storedItem.id === item.id)),
    ),
    showcases: defaultSiteContent.showcases.map(withShowcaseFallback),
    instagramVideos: defaultSiteContent.instagramVideos.map((item) => ({
      ...item,
      ...stored.instagramVideos?.find((storedItem) => storedItem.id === item.id),
    })),
  };
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(() => {
    if (typeof window === "undefined") {
      return defaultSiteContent;
    }

    const stored = window.localStorage.getItem("iroselectronics-site-content");

    if (!stored) {
      return defaultSiteContent;
    }

    try {
      return mergeSiteContent(JSON.parse(stored) as Partial<SiteContent>);
    } catch {
      return defaultSiteContent;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(
      "iroselectronics-site-content",
      JSON.stringify(content),
    );
  }, [content]);

  const value = useMemo<SiteContentContextValue>(
    () => ({
      content,
      updateLocalized(section, locale, nextValue) {
        setContent((current) => ({
          ...current,
          [section]: localized(current[section], locale, nextValue),
        }));
      },
      updateNestedLocalized(section, field, locale, nextValue) {
        setContent((current) => ({
          ...current,
          [section]: {
            ...current[section],
            [field]: localized(
              current[section][field as keyof (typeof current)[typeof section]] as LocalizedText,
              locale,
              nextValue,
            ),
          },
        }));
      },
      updateServiceTile(id, field, locale, nextValue) {
        setContent((current) => ({
          ...current,
          serviceTiles: current.serviceTiles.map((item) =>
            item.id === id
              ? { ...item, [field]: localized(item[field], locale, nextValue) }
              : item,
          ),
        }));
      },
      updateCollectionTile(id, field, locale, nextValue) {
        setContent((current) => ({
          ...current,
          collections: current.collections.map((item) =>
            item.id === id
              ? { ...item, [field]: localized(item[field], locale, nextValue) }
              : item,
          ),
        }));
      },
      updateShowcasePanel(id, field, locale, nextValue) {
        setContent((current) => ({
          ...current,
          showcases: current.showcases.map((item) =>
            item.id === id
              ? { ...item, [field]: localized(item[field], locale, nextValue) }
              : item,
          ),
        }));
      },
      updateInstagramVideo(id, field, locale, nextValue) {
        setContent((current) => ({
          ...current,
          instagramVideos: current.instagramVideos.map((item) =>
            item.id === id
              ? { ...item, [field]: localized(item[field], locale, nextValue) }
              : item,
          ),
        }));
      },
      updateInstagramVideoUrl(id, field, nextValue) {
        setContent((current) => ({
          ...current,
          instagramVideos: current.instagramVideos.map((item) =>
            item.id === id ? { ...item, [field]: nextValue } : item,
          ),
        }));
      },
      updateSeasonalBannerSetting(field, nextValue) {
        setContent((current) => ({
          ...current,
          seasonalBanner: {
            ...current.seasonalBanner,
            [field]: field === "theme" ? seasonalTheme(nextValue) : nextValue,
          },
        }));
      },
      updateHeroImage(nextValue) {
        setContent((current) => ({
          ...current,
          hero: { ...current.hero, imageUrl: nextValue },
        }));
      },
      updateCollectionImage(id, nextValue) {
        setContent((current) => ({
          ...current,
          collections: current.collections.map((item) =>
            item.id === id ? { ...item, imageUrl: nextValue } : item,
          ),
        }));
      },
      updateShowcaseImage(id, nextValue) {
        setContent((current) => ({
          ...current,
          showcases: current.showcases.map((item) =>
            item.id === id ? { ...item, imageUrl: nextValue } : item,
          ),
        }));
      },
      resetContent() {
        setContent(defaultSiteContent);
      },
    }),
    [content],
  );

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);

  if (!context) {
    throw new Error("useSiteContent must be used inside SiteContentProvider");
  }

  return context;
}
