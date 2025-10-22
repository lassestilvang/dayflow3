import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useListStore } from "@/store/useListStore";
import { ListForm } from "./ListForm";
import { toast } from "sonner";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

interface ListManagerProps {
  listId: string;
  listName: string;
  isDefault?: boolean;
}

export function ListManager({ listId, listName, isDefault = false }: ListManagerProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { removeList, lists } = useListStore();

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete list");
      }

      removeList(listId);
      toast.success("List deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if list has tasks
  const hasTasks = lists.some(list => list.id === listId);

  if (isDefault) {
    return null; // Don't show manager for default list
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-3 w-3" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ListForm
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        list={{
          id: listId,
          name: listName,
          color: "", // Will be fetched from store
          icon: "", // Will be fetched from store
        }}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete &quot;{listName}&quot;? This action cannot be undone.
            </p>
            {hasTasks && (
              <p className="text-sm text-red-600 mt-2">
                Note: Tasks in this list will not be deleted, but they will no longer be associated with a list.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}