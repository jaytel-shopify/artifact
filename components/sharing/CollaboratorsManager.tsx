"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Users, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import CollaboratorEmailInput from "./CollaboratorEmailInput";
import { 
  getProjectAccessList, 
  grantProjectAccess, 
  revokeProjectAccess 
} from "@/lib/quick-db";

interface CollaboratorsManagerProps {
  projectId: string;
  projectName: string;
  creatorEmail: string;
  shareToken: string;
}

interface Collaborator {
  id?: string;
  user_email: string;
  role: string;
  created_at?: string;
}

/**
 * CollaboratorsManager
 * 
 * Manage who can edit the project.
 * Owner can add/remove collaborators by email.
 * Shows reminder to share link after adding.
 */
export default function CollaboratorsManager({
  projectId,
  projectName,
  creatorEmail,
  shareToken,
}: CollaboratorsManagerProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = `https://artifact.quick.shopify.io/p?token=${shareToken}`;

  // Load collaborators
  useEffect(() => {
    async function loadCollaborators() {
      try {
        const access = await getProjectAccessList(projectId);
        setCollaborators(access);
      } catch (error) {
        console.error("Failed to load collaborators:", error);
        toast.error("Failed to load collaborators");
      } finally {
        setLoading(false);
      }
    }
    loadCollaborators();
  }, [projectId]);

  // Add collaborator
  async function handleAdd(email: string) {
    // Check if already added
    if (email === creatorEmail) {
      toast.error("You're already the owner");
      return;
    }

    const exists = collaborators.some(c => c.user_email === email);
    if (exists) {
      toast.error("This person already has access");
      return;
    }

    try {
      await grantProjectAccess(projectId, email, "editor");
      
      // Reload collaborators
      const access = await getProjectAccessList(projectId);
      setCollaborators(access);
      
      toast.success(`Added ${email} as collaborator`);
    } catch (error) {
      console.error("Failed to add collaborator:", error);
      toast.error("Failed to add collaborator");
      throw error; // Re-throw so input knows it failed
    }
  }

  // Remove collaborator
  async function handleRemove(email: string) {
    try {
      await revokeProjectAccess(projectId, email);
      setCollaborators(prev => prev.filter(c => c.user_email !== email));
      toast.success(`Removed ${email}`);
    } catch (error) {
      console.error("Failed to remove collaborator:", error);
      toast.error("Failed to remove collaborator");
    }
  }

  // Copy share link
  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current Access List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Who has access</h3>
        
        <div className="space-y-2">
          {/* Owner */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Crown className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-sm font-medium">{creatorEmail}</div>
                <div className="text-xs text-muted-foreground">Owner</div>
              </div>
            </div>
          </div>

          {/* Collaborators */}
          {collaborators.map((collab) => (
            <div 
              key={collab.id} 
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-sm font-medium">{collab.user_email}</div>
                  <div className="text-xs text-muted-foreground">Can edit</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(collab.user_email)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Empty state */}
          {collaborators.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-6 border rounded-lg border-dashed">
              No collaborators yet. Add people below to let them edit this project.
            </div>
          )}
        </div>
      </div>

      {/* Add Collaborator Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Add people</h3>
        
        <CollaboratorEmailInput onAdd={handleAdd} disabled={loading} />
        
        <p className="text-xs text-muted-foreground">
          Type a Shopify username and press Enter to add multiple people quickly.
        </p>
      </div>

      {/* Share Link Reminder (shows when collaborators exist) */}
      {collaborators.length > 0 && (
        <div className="border-t pt-4 space-y-3">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">📤 Share the link</p>
                <p className="text-xs">
                  Send this link to your collaborators so they can access the project:
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-xs bg-white dark:bg-gray-950"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={copyShareLink}
                variant={linkCopied ? "default" : "outline"}
                size="sm"
                className="shrink-0"
              >
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

