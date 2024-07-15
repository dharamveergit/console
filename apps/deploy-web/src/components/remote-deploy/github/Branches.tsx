import { useState } from "react";
import { useQuery } from "react-query";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Spinner } from "@akashnetwork/ui/components";
import axios from "axios";
import { useAtom } from "jotai";
import { nanoid } from "nanoid";

import remoteDeployStore from "@src/store/remoteDeployStore";
import { useBranches } from "../api/api";

const Branches = ({ repos, services, setValue }) => {
  const [token] = useAtom(remoteDeployStore.tokens);
  const repo = repos?.find(r => r?.html_url === services?.[0]?.env?.find(e => e.key === "REPO_URL")?.value);
  const selected = services?.find(s => s?.env?.find(e => e.key === "REPO_URL" && e.value === repo?.html_url));
  console.log(selected);
  const [packageJson, setPackageJson] = useState<any>(null);
  const { data: branches, isLoading: branchesLoading } = useBranches(repo?.full_name, !!selected && repos?.length > 0);

  useQuery({
    queryKey: ["packageJson", repo?.full_name],
    queryFn: async () => {
      const response = await axios.get(`https://api.github.com/repos/${repo.full_name}/contents/package.json`, {
        headers: {
          Authorization: `Bearer ${token?.access_token}`
        }
      });
      return response.data;
    },
    enabled: !!selected && repos?.length > 0,
    onSettled: data => {
      if (data?.content === undefined) return;
      const content = atob(data.content);
      const parsed = JSON.parse(content);
      setPackageJson(parsed);
    }
  });

  console.log(packageJson);

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
            { id: nanoid(), key: "REPO_URL", value: repo.html_url, isSecret: false },
            { id: nanoid(), key: "BRANCH_NAME", value: value, isSecret: false },
            { id: nanoid(), key: "ACCESS_TOKEN", value: token?.access_token, isSecret: false }
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
            {branches?.map((branch: any) => (
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
