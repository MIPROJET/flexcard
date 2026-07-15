import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Créer ma carte — FlexCard" }] }),
  component: () => <Outlet />,
});