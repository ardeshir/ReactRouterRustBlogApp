import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("components/Layout.tsx", [
    index("routes/home.tsx"),
    route("posts", "routes/posts.tsx"),
    route("posts/new", "routes/posts.new.tsx"),
    route("posts/:id", "routes/posts.$id.tsx"),
    route("posts/:id/edit", "routes/posts.$id.edit.tsx"),
  ]),
] satisfies RouteConfig;
