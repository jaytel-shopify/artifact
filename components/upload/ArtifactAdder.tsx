"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VIEWPORTS, DEFAULT_VIEWPORT_KEY, getViewportDimensions, type ViewportKey } from "@/lib/viewports";
import { usePageArtifacts } from "@/hooks/usePageArtifacts";
import { generateArtifactName } from "@/lib/artifactNames";
import { toast } from "sonner";

export default function ArtifactAdder({
  projectId,
  pageId,
  onAdded,
}: {
  projectId: string;
  pageId: string;
  onAdded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<{
    uploading: boolean;
    totalFiles: number;
    completedFiles: number;
    currentProgress: number;
  }>({
    uploading: false,
    totalFiles: 0,
    completedFiles: 0,
    currentProgress: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportKey>(DEFAULT_VIEWPORT_KEY);
  
  const { createArtifact } = usePageArtifacts(projectId, pageId);

  function resetState() {
    setUrl("");
    setFiles([]);
    setError(null);
    setViewport(DEFAULT_VIEWPORT_KEY);
    setUploadState({
      uploading: false,
      totalFiles: 0,
      completedFiles: 0,
      currentProgress: 0,
    });
  }

  async function handleAdd() {
    setError(null);
    
    try {
      if (files.length) {
        // Initialize upload state for files
        setUploadState({
          uploading: true,
          totalFiles: files.length,
          completedFiles: 0,
          currentProgress: 0,
        });
        
        let completedCount = 0;
        
        for (const file of files) {
          // Upload file with progress tracking
          const form = new FormData();
          form.append("file", file);
          form.append("project_id", projectId);
          
          const uploadPromise = new Promise<{publicUrl: string, path: string}>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const fileProgress = Math.round((e.loaded / e.total) * 100);
                const overallProgress = Math.round(
                  ((completedCount * 100) + fileProgress) / files.length
                );
                
                setUploadState(prev => ({
                  ...prev,
                  currentProgress: overallProgress,
                }));
              }
            });
            
            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const result = JSON.parse(xhr.responseText);
                  resolve(result);
                } catch (e) {
                  reject(new Error('Failed to parse upload response'));
                }
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            });
            
            xhr.addEventListener('error', () => {
              reject(new Error('Upload failed'));
            });
            
            xhr.open('POST', '/api/upload');
            xhr.send(form);
          });
          
          const upResult = await uploadPromise;
          
          // Determine file type
          const type = file.type.startsWith("video/")
            ? "video"
            : file.type === "application/pdf"
              ? "pdf"
              : "image";
              
          // Create artifact using the hook with generated name
          const artifactName = generateArtifactName(type, upResult.publicUrl, file);
          await createArtifact({
            type,
            source_url: upResult.publicUrl,
            file_path: upResult.path,
            name: artifactName,
          });
          
          completedCount++;
          setUploadState(prev => ({
            ...prev,
            completedFiles: completedCount,
            currentProgress: Math.round((completedCount / files.length) * 100),
          }));
        }
      }

      if (!files.length && url) {
        // For URL artifacts, just show a simple uploading state
        setUploadState({
          uploading: true,
          totalFiles: 1,
          completedFiles: 0,
          currentProgress: 50,
        });
        
        const dims = getViewportDimensions(viewport);
        
        // Create URL artifact using the hook with generated name
        const artifactName = generateArtifactName("url", url);
        await createArtifact({
          type: "url",
          source_url: url,
          name: artifactName,
          metadata: {
            viewport,
            width: dims.width,
            height: dims.height,
          },
        });
        
        setUploadState(prev => ({
          ...prev,
          completedFiles: 1,
          currentProgress: 100,
        }));
      }

      if (files.length) {
        toast.success(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
      } else if (url) {
        toast.success("Successfully added URL artifact");
      }

      setOpen(false);
      resetState();
      onAdded?.();
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || "Upload failed. Please try again.");
      setUploadState({
        uploading: false,
        totalFiles: 0,
        completedFiles: 0,
        currentProgress: 0,
      });
    }
  }

  function onFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files || []));
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetState();
      }
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Add artifact"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className="w-full max-w-2xl text-white border-white/10"
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
        showCloseButton={!uploadState.uploading}
      >
        <DialogHeader>
          <DialogTitle className="text-white">Add Artifact</DialogTitle>
          <DialogDescription className="text-white/70">
            Upload files or embed content via URL
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-white/70">Upload files</p>
            <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 py-12 cursor-pointer transition hover:border-white/40">
              <span className="text-sm font-medium">Browse files</span>
              <span className="text-xs text-white/60">Images, videos, or PDFs up to 20MB</span>
              <input type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={onFileInputChange} />
            </label>
            {files.length > 0 && (
              <div className="text-xs text-white/60">
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-white/40">
            <div className="flex-1 h-px bg-white/15" />
            or
            <div className="flex-1 h-px bg-white/15" />
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm text-white/70">Embed via URL</p>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/artifact"
                className="w-full bg-white/5 border-white/15 text-white placeholder:text-white/60 focus:border-white/30 focus:ring-white/20"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/70">
              {Object.entries(VIEWPORTS).map(([key, vp]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setViewport(key as ViewportKey)}
                  className={`rounded-full px-3 py-1 border transition cursor-pointer ${
                    viewport === key
                      ? "border-white/40 bg-white/20 text-white"
                      : "border-white/15 bg-white/5 text-white/70 hover:border-white/30"
                  }`}
                >
                  {vp.label}
                </button>
              ))}
            </div>
          </div>

          {uploadState.uploading && (
            <div className="space-y-3">
              <div className="text-center text-sm text-white/80">
                Uploading{uploadState.totalFiles > 1 ? ` ${uploadState.completedFiles + 1} of ${uploadState.totalFiles}` : ''}...
              </div>
              <div className="space-y-2">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadState.currentProgress}%` }}
                  />
                </div>
                <div className="text-center text-xs text-white/60">
                  {uploadState.currentProgress}%
                </div>
              </div>
            </div>
          )}

          {error && <div className="text-sm text-red-400">{error}</div>}
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => {
              setOpen(false);
              resetState();
            }}
            disabled={uploadState.uploading}
            className="text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={uploadState.uploading || (!files.length && !url)}
            className="bg-white text-black hover:bg-white/90"
          >
            {uploadState.uploading ? "Uploading…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


