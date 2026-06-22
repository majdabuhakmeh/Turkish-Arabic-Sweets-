import { createFileRoute } from "@tanstack/react-router";
import AdminBranches from "./admin.branches";

export const Route = createFileRoute("/_authenticated/vendor/branches")({
  // Reuse the admin branches UI — RLS/handlers already scope to the owner
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: AdminBranches as any,
});
