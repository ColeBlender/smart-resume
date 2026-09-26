"use client";

import { CircleCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DownloadPdfButton } from "./download-pdf-button";

export type ReadyResume = { id: string; title: string; company: string | null; markdown: string };

/** The finish line: big, centered, one button. Closes only with the X. */
export function ResumeReadyDialog({ resume, onClose }: { resume: ReadyResume | null; onClose: () => void }) {
  return (
    <Dialog open={!!resume} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {resume && (
          <>
            <DialogHeader className="items-center pt-4 text-center">
              <CircleCheck className="mb-2 size-16 text-success" />
              <DialogTitle className="text-3xl">Your resume is ready</DialogTitle>
              <DialogDescription className="text-base">
                Tailored for {resume.title}
                {resume.company ? ` at ${resume.company}` : ""}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="justify-center pt-4 pb-2 sm:justify-center">
              <DownloadPdfButton markdown={resume.markdown} company={resume.company} title={resume.title} size="xl" showFileName />
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
