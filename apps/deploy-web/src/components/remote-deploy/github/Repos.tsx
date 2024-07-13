import { useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Spinner } from "@akashnetwork/ui/components";
import { GithubCircle, Lock } from "iconoir-react";
import { nanoid } from "nanoid";
const Repos = ({ repos, setValue, token, isLoading }) => {
  const [open, setOpen] = useState(false);
  console.log(repos);

  return (
    <div className="flex flex-col gap-5 rounded border bg-card px-6 py-6 text-card-foreground">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold">Select Repository</h1>
        <p className="text-muted-foreground">The Repository Branch used for your private service</p>
      </div>

      <Select
        onOpenChange={value => {
          setOpen(value);
        }}
        open={open}
        onValueChange={value => {
          setValue("services.0.env", [
            { id: nanoid(), key: "REPO_URL", value: value, isSecret: false },
            { id: nanoid(), key: "BRANCH_NAME", value: "main", isSecret: false },
            { id: nanoid(), key: "ACCESS_TOKEN", value: token, isSecret: true }
          ]);
        }}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            {isLoading && <Spinner size="small" />}
            <SelectValue placeholder={"Select Repository"} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {repos?.map((repo: any) => (
              <SelectItem key={repo.html_url} value={repo.html_url}>
                <div className="flex items-center">
                  <GithubCircle className="mr-2" />
                  {repo.name}

                  {repo.private && <Lock className="ml-1 text-xs" />}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default Repos;
