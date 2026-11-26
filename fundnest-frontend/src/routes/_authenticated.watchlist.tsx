import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { Watchlist } from "@/components/Watchlist";

export const Route = createFileRoute("/_authenticated/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist · FundNest" }] }),
  component: () => (
    <RoleGate allow={["investor", "founder", "admin"]}>
      <WatchlistPage />
    </RoleGate>
  ),
});

function WatchlistPage() {
  return (
    <>
      <PageHeader
        title="Investor Watchlist"
        subtitle="Monitor and track promising startups before committing capital."
      />
      <Watchlist />
    </>
  );
}
