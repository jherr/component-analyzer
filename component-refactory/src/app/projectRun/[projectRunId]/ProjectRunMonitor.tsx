"use client";
import { useState, useEffect } from "react";
import { ProjectRun, Refactoring } from "@/db";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import Prism from "prismjs";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Loading from "@/app/components/Loading";

import "prismjs/themes/prism-tomorrow.css";

function Code({ code }: { code: string }) {
  useEffect(() => {
    Prism.highlightAll();
  }, []);
  return (
    <div className="Code">
      <pre>
        <code className="language-js">{code}</code>
      </pre>
    </div>
  );
}

export default function JobMonitor({
  projectRunId,
  project: initialProject,
  refactorings: initialRefactorings,
}: {
  projectRunId: string;
  project: ProjectRun | null;
  refactorings: Refactoring[] | null;
}) {
  const [enabled, setEnabled] = useState(true);
  const { data } = useQuery({
    queryKey: ["projectRun", projectRunId],
    queryFn: async () => {
      const response = await fetch(`/api/projectRun/${projectRunId}`);
      return response.json();
    },
    initialData: { project: initialProject, refactorings: initialRefactorings },
    refetchInterval: 200,
    enabled,
  });

  useEffect(
    () => setEnabled((data?.project?.completed ?? false) === false),
    [data?.project?.completed]
  );

  const { project, refactorings } = data;

  return (
    <div>
      <div className="flex mb-2">
        <Label className="flex-[0.2] text-xl font-bold">Project</Label>
        <Label className="flex-[0.8] text-xl">
          {project?.user}/{project?.repo}/{project?.appRoot}
        </Label>
      </div>
      <div className="flex mb-4">
        <Label className="flex-[0.2] text-xl font-bold">Status</Label>
        <Label className="flex-[0.8] text-xl">{project?.status}</Label>
      </div>
      {!project.completed && (
        <div className="flex justify-center">
          <Loading />
        </div>
      )}
      {(refactorings || []).map((refactoring: Refactoring) => (
        <div key={refactoring.path} className="mt-4">
          <Tabs defaultValue="newFile">
            <div className="flex">
              <h3 className="text-2xl flex-grow font-bold">
                {refactoring.path}
              </h3>
              <TabsList>
                <TabsTrigger value="originalFile">Original Code</TabsTrigger>
                <TabsTrigger value="newFile">Refactored Code</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="originalFile">
              <div className="max-h-72 text-lg overflow-y-scroll">
                <Code code={refactoring.originalFile} />
              </div>
            </TabsContent>
            <TabsContent value="newFile">
              <div className="max-h-72 text-lg overflow-y-scroll">
                <Code code={refactoring.newFile} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ))}
    </div>
  );
}
