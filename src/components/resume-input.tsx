"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export type ExtractResume = (formData: FormData) => Promise<{ text: string } | { error: string }>;

/** Upload (PDF/DOCX/TXT/MD) or paste a resume. Used in onboarding and when replacing it on Profile. */
export function ResumeInput(props: {
  value: string;
  onChange: (text: string) => void;
  extractResume: ExtractResume;
  onBusyChange?: (busy: boolean) => void;
  /** Start on the reading state (for /preview). */
  initialReading?: boolean;
}) {
  const [tab, setTab] = useState(props.value ? "paste" : "upload");
  const [pending, startTransition] = useTransition();
  const reading = pending || props.initialReading;

  function upload(file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    props.onBusyChange?.(true);
    startTransition(async () => {
      const result = await props.extractResume(fd);
      props.onBusyChange?.(false);
      if ("error" in result) return void toast.error(result.error);
      props.onChange(result.text);
      setTab("paste");
      toast.success("Resume read. Check it over below.");
    });
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="upload">Upload</TabsTrigger>
        <TabsTrigger value="paste">{props.value ? "Review" : "Paste"}</TabsTrigger>
      </TabsList>
      <TabsContent value="upload" className="pt-4">
        {reading ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Spinner />
              </EmptyMedia>
              <EmptyTitle>Reading your resume…</EmptyTitle>
              <EmptyDescription>Claude is transcribing it word for word.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Field>
            <FieldLabel htmlFor="resume-file">Resume file</FieldLabel>
            <Input id="resume-file" type="file" accept=".pdf,.docx,.txt,.md" onChange={(e) => upload(e.target.files?.[0])} />
            <FieldDescription>PDF, DOCX, TXT or Markdown, up to 5 MB. Or switch to Paste.</FieldDescription>
          </Field>
        )}
      </TabsContent>
      <TabsContent value="paste" className="pt-4">
        <Textarea
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          rows={14}
          placeholder={"Jane Doe\nSenior Software Engineer\n\nExperience\nAcme Corp (2021 to present)\n- Built…"}
          className="max-h-[50svh] min-h-64 font-mono text-sm"
        />
      </TabsContent>
    </Tabs>
  );
}
