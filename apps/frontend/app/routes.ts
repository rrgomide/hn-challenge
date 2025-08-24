import type { RouteConfig } from "@react-router/dev/routes";
import { index, route, layout } from "@react-router/dev/routes";

export default [
  route("auth", "routes/auth.tsx"),
  layout("routes/_layout.tsx", [
    index("routes/_index.tsx"),
    route("snippets/:id", "routes/snippets.$id.tsx"),
    route("config", "routes/config.tsx"),
  ]),
] satisfies RouteConfig;