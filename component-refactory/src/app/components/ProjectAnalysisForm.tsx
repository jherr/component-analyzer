"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { onParseProject } from "@/inngest/server-actions";

export default function ProjectAnalysisForm() {
  const [user, setUser] = useState<string>("jherr");
  const [repo, setRepo] = useState<string>("component-analyzer");
  const [appRoot, setAppRoot] = useState<string>("contents/example/src/app");

  const router = useRouter();

  return (
    <>
      <div className="flex flex-wrap">
        <div className="py-2 w-1/2 px-2">
          <Input
            type="text"
            placeholder="User"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </div>
        <div className="py-2 w-1/2 px-2">
          <Input
            type="text"
            placeholder="Repo"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
          />
        </div>
        <div className="py-2 w-full px-2">
          <Input
            type="text"
            placeholder="Application Root Directory"
            value={appRoot}
            onChange={(e) => setAppRoot(e.target.value)}
          />
        </div>
      </div>

      <div className="px-2 mt-4">
        <Button
          onClick={async () => {
            const id = await onParseProject({ user, repo, appRoot });
            router.push(`/projectRun/${id}`);
          }}
        >
          Start Project Analysis
        </Button>
      </div>
    </>
  );
}
