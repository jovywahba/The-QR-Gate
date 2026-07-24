"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicSupabaseConfig } from "@/lib/qr/config";
import { createClient } from "@/lib/supabase/client";
import { createFolder, createTag, setQrFolder, setQrTags } from "./organization-actions";

type Named = { id: string; name: string };

export function OrganizeDialog({
  open,
  onOpenChange,
  qrCodeId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  qrCodeId: string;
}) {
  const [folders, setFolders] = React.useState<Named[]>([]);
  const [tags, setTags] = React.useState<Named[]>([]);
  const [folderId, setFolderId] = React.useState<string>("");
  const [tagIds, setTagIds] = React.useState<Set<string>>(new Set());
  const [newFolder, setNewFolder] = React.useState("");
  const [newTag, setNewTag] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [pending, startT] = React.useTransition();

  const load = React.useCallback(async () => {
    if (!publicSupabaseConfig().configured) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const [f, t, qf, qt] = await Promise.all([
        supabase.from("qr_folders").select("id, name").order("name"),
        supabase.from("qr_tags").select("id, name").order("name"),
        supabase.from("qr_codes").select("folder_id").eq("id", qrCodeId).maybeSingle(),
        supabase.from("qr_code_tags").select("tag_id").eq("qr_code_id", qrCodeId),
      ]);
      setFolders((f.data as Named[]) ?? []);
      setTags((t.data as Named[]) ?? []);
      setFolderId((qf.data?.folder_id as string) ?? "");
      setTagIds(new Set((qt.data ?? []).map((r) => r.tag_id as string)));
    } catch {
      /* pre-migration or transient — open with empty lists */
    } finally {
      setLoading(false);
    }
  }, [qrCodeId]);

  React.useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const addFolder = () =>
    startT(async () => {
      const r = await createFolder(newFolder);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      setNewFolder("");
      if (r.id) {
        setFolders((prev) => [...prev, { id: r.id!, name: newFolder.trim() }].sort((a, b) => a.name.localeCompare(b.name)));
        setFolderId(r.id);
      }
    });

  const addTag = () =>
    startT(async () => {
      const r = await createTag(newTag);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      setNewTag("");
      if (r.id) {
        setTags((prev) => [...prev, { id: r.id!, name: newTag.trim() }].sort((a, b) => a.name.localeCompare(b.name)));
        setTagIds((prev) => new Set(prev).add(r.id!));
      }
    });

  const save = () =>
    startT(async () => {
      const a = await setQrFolder(qrCodeId, folderId || null);
      const b = await setQrTags(qrCodeId, [...tagIds]);
      if (a.error || b.error) {
        toast.error(a.error || b.error!);
        return;
      }
      toast.success("Organized.");
      onOpenChange(false);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Organize this QR code</DialogTitle>
          <DialogDescription>File it into a folder and apply tags to group and filter your codes.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Folder */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-folder">Folder</Label>
            <select
              id="org-folder"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              disabled={loading}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Input
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                placeholder="New folder name"
                maxLength={60}
              />
              <Button type="button" variant="outline" size="sm" onClick={addFolder} disabled={pending || !newFolder.trim()}>
                <Plus aria-hidden /> Add
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <Label>Tags</Label>
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tags yet — create one below.</p>
            ) : (
              <div className="flex max-h-40 flex-wrap gap-x-4 gap-y-2 overflow-y-auto">
                {tags.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={tagIds.has(t.id)}
                      onCheckedChange={(c) =>
                        setTagIds((prev) => {
                          const next = new Set(prev);
                          if (c) next.add(t.id);
                          else next.delete(t.id);
                          return next;
                        })
                      }
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag name" maxLength={40} />
              <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={pending || !newTag.trim()}>
                <Plus aria-hidden /> Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending || loading}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
