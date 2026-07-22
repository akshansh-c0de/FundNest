import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/startups")({
  component: () => <RoleGate allow={["admin"]}><Page /></RoleGate>,
});

function Page() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const { data: startupsRes, isLoading } = useQuery({
    queryKey: ["adminStartups", search, status, page],
    queryFn: () => adminApi.startups({ 
      search, 
      status: status === "all" ? undefined : status,
      page, 
      limit: 10 
    }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveStartup(id),
    onSuccess: (data) => {
      toast.success(data.data.message || "Startup approved successfully");
      queryClient.invalidateQueries({ queryKey: ["adminStartups"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to approve startup");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.rejectStartup(id, reason),
    onSuccess: () => {
      toast.success("Startup rejected successfully");
      queryClient.invalidateQueries({ queryKey: ["adminStartups"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to reject startup");
    },
  });

  const startups = startupsRes?.data?.startups ?? [];
  const total = startupsRes?.data?.total ?? 0;
  const pages = startupsRes?.data?.pages ?? 1;

  return (
    <>
      <PageHeader title="Startups" subtitle="Approve, reject, and audit listings." />
      
      <div className="flex flex-wrap gap-4 mb-6">
        <Input
          placeholder="Search by startup name or sector..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm glass"
        />
        <Select 
          value={status} 
          onValueChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px] glass">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="glass">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass rounded-2xl p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : startups.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No startups found.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Founder</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {startups.map((s: any) => (
                  <TableRow key={s._id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <span className="text-lg">{s.logo || "🧠"}</span>
                      {s.name}
                    </TableCell>
                    <TableCell>{s.founder?.name ?? "—"}</TableCell>
                    <TableCell>{s.sector} · {s.stage}</TableCell>
                    <TableCell>${s.targetAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "Approved" ? "default" : s.status === "Pending" ? "secondary" : "destructive"}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {s.status === "Pending" ? (
                        <>
                          <Button 
                            size="sm" 
                            className="btn-gradient"
                            onClick={() => approveMutation.mutate(s._id)}
                            disabled={approveMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const reason = prompt("Enter rejection reason:");
                              if (reason !== null) {
                                rejectMutation.mutate({ id: s._id, reason });
                              }
                            }}
                            disabled={rejectMutation.isPending}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">No Actions</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
