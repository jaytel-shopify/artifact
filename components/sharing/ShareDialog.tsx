"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import CollaboratorsManager from "./CollaboratorsManager";

interface ShareDialogProps {
  projectId: string;
  projectName: string;
  shareToken: string;
  creatorEmail: string;
  isCreator: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareDialog({
  projectId,
  projectName,
  shareToken,
  creatorEmail,
  isCreator,
  isOpen,
  onClose,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  // Generate the full shareable URL
  const shareUrl = `https://artifact.quick.shopify.io/p?token=${shareToken}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      
      // Reset "Copied!" state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy link. Please copy manually.");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share &ldquo;{projectName}&rdquo;</DialogTitle>
          <DialogDescription>
            Manage who can view and edit this project
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Share Link</TabsTrigger>
            {isCreator && <TabsTrigger value="collaborators">Collaborators</TabsTrigger>}
          </TabsList>

          {/* Tab 1: Share Link */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-4 pt-2">
              {/* Share URL Input with Copy Button */}
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button 
                  onClick={copyToClipboard} 
                  variant={copied ? "default" : "outline"}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* Info Notice */}
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                <p>
                  Anyone at Shopify can view this project with the link above. 
                  {isCreator ? " Add collaborators in the Collaborators tab to let specific people edit." : " Only the owner can make changes."}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Collaborators (Owner only) */}
          {isCreator && (
            <TabsContent value="collaborators" className="space-y-4 pt-2">
              <CollaboratorsManager
                projectId={projectId}
                projectName={projectName}
                creatorEmail={creatorEmail}
                shareToken={shareToken}
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

