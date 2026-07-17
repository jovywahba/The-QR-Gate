"use client";

import * as React from "react";

/** Real page metadata returned by /api/preview/metadata. */
export type UrlMetadata = {
  url: string;
  domain: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  embeddable: boolean;
  error?: string;
};

/** Real app metadata returned by /api/preview/app-store (iTunes). */
export type AppMetadata = {
  found: boolean;
  name?: string | null;
  icon?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
  genre?: string | null;
  description?: string | null;
};

type State<T> = { data: T | null; loading: boolean };

function useJson<T>(url: string | null): State<T> {
  const [state, setState] = React.useState<State<T>>({ data: null, loading: !!url });
  React.useEffect(() => {
    if (!url) {
      setState({ data: null, loading: false });
      return;
    }
    let active = true;
    setState({ data: null, loading: true });
    const t = setTimeout(() => {
      fetch(url)
        .then((r) => r.json())
        .then((d: T) => active && setState({ data: d, loading: false }))
        .catch(() => active && setState({ data: null, loading: false }));
    }, 250); // small debounce while the user types a URL
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [url]);
  return state;
}

export function useUrlMetadata(pageUrl: string | null) {
  return useJson<UrlMetadata>(pageUrl ? `/api/preview/metadata?url=${encodeURIComponent(pageUrl)}` : null);
}

export function useAppMetadata(storeUrl: string | null) {
  return useJson<AppMetadata>(storeUrl ? `/api/preview/app-store?url=${encodeURIComponent(storeUrl)}` : null);
}
