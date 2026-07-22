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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/kyc")({
  component: () => <RoleGate allow={["admin"]}><Page /></RoleGate>,
});

function Page() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("Pending");
  const [page, setPage] = useState(1);

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ["kycUsers", filter, page],
    queryFn: () => adminApi.users({ 
      kycStatus: filter === "all" ? undefined : filter, 
      page, 
      limit: 10 
    }),
  });

  const updateKycMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateKyc(id, status),
    onSuccess: (data) => {
      toast.success(data.data.message || "KYC updated successfully");
      queryClient.invalidateQueries({ queryKey: ["kycUsers"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update KYC status");
    },
  });

  const users = usersRes?.data?.users ?? [];
  const total = usersRes?.data?.total ?? 0;
  const pages = usersRes?.data?.pages ?? 1;

  return (
    <>
      <PageHeader title="KYC reviews" subtitle="Verify identity submissions." />
      
      <div className="flex gap-4 mb-6">
        <Select 
          value={filter} 
          onValueChange={(val) => {
            setFilter(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px] glass">
            <SelectValue placeholder="Filter by KYC status" />
          </SelectTrigger>
          <SelectContent className="glass">
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="Pending">Pending Review</SelectItem>
            <SelectItem value="Verified">Verified</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
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
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No KYC profiles found.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u: any) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="capitalize">{u.role}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.kycStatus === "Verified" ? "default" : u.kycStatus === "Pending" ? "secondary" : "destructive"}>
                        {u.kycStatus || "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {u.kycStatus === "Pending" ? (
                        <>
                          <Button 
                            size="sm" 
                            className="btn-gradient"
                            onClick={() => updateKycMutation.mutate({ id: u._id, status: "Verified" })}
                            disabled={updateKycMutation.isPending}
                          >
                            Verify
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateKycMutation.mutate({ id: u._id, status: "Rejected" })}
                            disabled={updateKycMutation.isPending}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Verified / Closed</span>
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
