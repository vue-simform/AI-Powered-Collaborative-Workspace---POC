"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Editable list with add/remove. Every item is a named input, so the form action reads them with formData.getAll.
export function ListField({ label, name, initial }: { label: string; name: string; initial: string[] }) {
  // Local list of strings. Starts with the AI's values and changes when the user adds, edits or removes rows.
  const [items, setItems] = useState(initial);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {/* One row per item. Same `name` on every input lets the form collect them all as an array. */}
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            name={name}
            value={item}
            aria-label={`${label} ${i + 1}`}
            onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${label} ${i + 1}`} onClick={() => setItems(items.filter((_, j) => j !== i))}>
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, ""])}>
        <Plus className="size-4" /> Add
      </Button>
    </div>
  );
}
