import { useState } from "react";
import { useQuery } from "react-query";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Spinner } from "@akashnetwork/ui/components";
import axios from "axios";
import { useAtom } from "jotai";
import { nanoid } from "nanoid";

import remoteDeployStore from "@src/store/remoteDeployStore";
import { useBitBranches } from "../bitbucket-api";

const Branches = ({ repos, services, setValue }) => {
  const [token] = useAtom(remoteDeployStore.tokens);
  const repo = repos?.values?.find(r => r?.links?.self?.href === services?.[0]?.env?.find(e => e.key === "REPO_URL")?.value);
  const selected = services?.find(s => s?.env?.find(e => e.key === "REPO_URL" && e.value === repo?.links?.self?.href));

  const { data: branches, isLoading: branchesLoading } = useBitBranches(repo?.full_name, !!selected && repos?.values?.length > 0);
  console.log(branches);

  return (
    <div className="flex flex-col gap-5 rounded border bg-card px-6 py-6 text-card-foreground">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold">Select Branch</h1>
        <p className="text-muted-foreground">Select a branch to use for deployment</p>
      </div>

      <Select
        disabled={!selected}
        onValueChange={value => {
          setValue("services.0.env", [
            { id: nanoid(), key: "REPO_URL", value: repo.links.self.href, isSecret: false },

            { id: nanoid(), key: "BRANCH_NAME", value: value, isSecret: false },
            { id: nanoid(), key: "ACCESS_TOKEN", value: token, isSecret: true }
          ]);
        }}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            {branchesLoading && <Spinner size="small" />}
            <SelectValue placeholder="Select" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {branches?.values?.map((branch: any) => (
              <SelectItem key={branch.name} value={branch.name}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default Branches;
