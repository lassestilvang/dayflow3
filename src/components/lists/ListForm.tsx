import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useListStore } from "@/store/useListStore";
import { toast } from "sonner";
import { ICONS } from "@/lib/iconUtils";

interface ListFormProps {
  isOpen: boolean;
  onClose: () => void;
  list?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}



const COLORS = [
  { value: "#6b7280", label: "Gray", class: "bg-gray-500" },
  { value: "#2563eb", label: "Blue", class: "bg-blue-500" },
  { value: "#16a34a", label: "Green", class: "bg-green-500" },
  { value: "#ea580c", label: "Orange", class: "bg-orange-500" },
  { value: "#9333ea", label: "Purple", class: "bg-purple-500" },
  { value: "#dc2626", label: "Red", class: "bg-red-500" },
  { value: "#0891b2", label: "Cyan", class: "bg-cyan-500" },
  { value: "#ca8a04", label: "Yellow", class: "bg-yellow-500" },
];

export function ListForm({ isOpen, onClose, list }: ListFormProps) {
  const [name, setName] = useState(list?.name || "");
  const [color, setColor] = useState(list?.color || "#6b7280");
  const [icon, setIcon] = useState(list?.icon || "CheckSquare");
  const [isLoading, setIsLoading] = useState(false);
  
  const { addList, updateList } = useListStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("List name is required");
      return;
    }

    setIsLoading(true);

    try {
      if (list) {
        // Update existing list
        const response = await fetch(`/api/lists/${list.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, color, icon }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update list");
        }

        const updatedList = await response.json();
        updateList(list.id, updatedList);
        toast.success("List updated successfully");
      } else {
        // Create new list
        const response = await fetch("/api/lists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, color, icon }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create list");
        }

        const newList = await response.json();
        addList(newList);
        toast.success("List created successfully");
      }

      onClose();
      setName("");
      setColor("#6b7280");
      setIcon("CheckSquare");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{list ? "Edit List" : "Create New List"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter list name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Select value={color} onValueChange={setColor} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a color" />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((colorOption) => (
                  <SelectItem key={colorOption.value} value={colorOption.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${colorOption.class}`} />
                      {colorOption.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Select value={icon} onValueChange={setIcon} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent>
                {ICONS.map((iconOption) => (
                  <SelectItem key={iconOption.value} value={iconOption.value}>
                    <div className="flex items-center gap-2">
                      <span>{iconOption.icon}</span>
                      {iconOption.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : list ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}