"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { Loader2, MoreVerticalIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CreateUserModal } from "@/components/create-user-modal";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminUsersPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const queryClient = useQueryClient();
  const {
    data: users,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const response = await authClient.admin.listUsers({
          query: {},
        });
        if (response.error) {
          throw new Error(response.error.message);
        }
        return response;
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    },
  });

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    return users?.data?.users.filter((user) =>
      user.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers?.slice(indexOfFirstUser, indexOfLastUser);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await authClient.admin.setUserPassword({
        userId,
        newPassword: "12345678",
      });
      toast({
        title: "Password reset successful",
        description: "The password has been reset.",
      });
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "Failed to reset password.",
        variant: "destructive",
      });
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      await authClient.admin.banUser({
        userId,
      });
      toast({
        title: "User banned successfully",
        description: "The user has been banned.",
      });
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    } catch (error) {
      console.error("Error banning user:", error);
      toast({
        title: "Error",
        description: "Failed to ban user.",
        variant: "destructive",
      });
    }
  };

  if (sessionPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{error?.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <Button onClick={() => setIsCreateUserModalOpen(true)}>
            Create User
          </Button>
        </div>
        <div className="mb-6">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        <div className="overflow-x-auto">
          {isPending ? (
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="animate-spin" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers?.map((user) => {
                  const isSelf = user.id === session?.user.id;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name} {isSelf && "(You)"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role?.toUpperCase()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.banned ? "destructive" : "default"}
                        >
                          {user.banned ? "Banned" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isSelf ? (
                          <Button variant="ghost" size="icon" disabled>
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVerticalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleResetPassword(user.id)}
                              >
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleBanUser(user.id)}
                              >
                                Ban User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
      />
    </>
  );
}
