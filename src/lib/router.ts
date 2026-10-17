import { useEffect, useState } from "react";

export type Route = "board" | "vendor" | "manager";

const HASHES: Record<Route, string> = { board: "#/", vendor: "#/vendor", manager: "#/manager" };

function parse(hash: string): Route {
  if (hash.startsWith("#/vendor")) return "vendor";
  if (hash.startsWith("#/manager")) return "manager";
  return "board";
}

export const hrefFor = (route: Route) => HASHES[route];

/** Minimal hash router: works from any static host without server rewrites. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const onHash = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}
