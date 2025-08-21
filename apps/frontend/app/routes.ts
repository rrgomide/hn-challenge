import type { RouteConfig } from "@react-router/dev/routes";
import { index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/_layout.tsx", [
    index("routes/_index.tsx"),
    route("snippets/:id", "routes/snippets.$id.tsx"),
  ]),
] satisfies RouteConfig;