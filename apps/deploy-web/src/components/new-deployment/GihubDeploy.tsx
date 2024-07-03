import { useEffect, useState } from "react";
import { useMutation, useQuery } from "react-query";
import {
  Button,
  Card,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Spinner
} from "@akashnetwork/ui/components";
import { cn } from "@akashnetwork/ui/utils";
import axios, { AxiosError } from "axios";
import { Bitbucket, Github, GithubCircle, GitlabFull, Lock, NavArrowDown } from "iconoir-react";
import { nanoid } from "nanoid";

import { Service } from "@src/types";
import { EnvFormModal } from "../remote-deploy/EnvFormModal";
import { hiddenEnv } from "../remote-deploy/utils";
import { EnvVarList } from "../sdl/EnvVarList";

const GithubDeploy = ({ setValue, services, control }: { setValue: any; services: Service[]; control: any }) => {
  const clientId = "Iv23liZYLYN9I2HrgeOh";
  const redirectUri = "http://localhost:3000/new-deployment?step=edit-deployment&type=github";
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const handleLogin = () => {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
  };

  const { data: repos, isLoading } = useQuery({
    queryKey: ["repos"],
    queryFn: async () => {
      const response = await axios.get("https://api.github.com/user/repos", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    onError: (error: AxiosError<{ message: string }>) => {
      if (error?.response?.data?.message === "Bad credentials") {
        console.log("Bad credentials");
        localStorage.removeItem("token");
        setToken(null);
        handleLogin();
        return;
      }
    },
    onSettled: data => {
      console.log(data);

      if (data?.message === "Bad credentials") {
        console.log("Bad credentials");

        localStorage.removeItem("token");
        setToken(null);
        return;
      }
    },
    enabled: !!token
  });

  const { mutate: fetchAccessToken } = useMutation({
    mutationFn: async (code: string) => {
      const response = await axios.post("https://proxy-console-github.vercel.app/authenticate", {
        code
      });
      return response.data;
    },
    onSuccess: data => {
      setToken(data.access_token);
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }
    }
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    setToken(localStorage.getItem("token"));

    if (code && !token) {
      fetchAccessToken(code);
    }
  }, [token]);

  console.log(token, repos);

  return (
    <>
      <div className="mt-6 flex flex-col gap-5 rounded border bg-card px-6 py-6 text-card-foreground">
        <h1 className="font-semibold">Configure</h1>
        <div className="flex flex-col gap-5 rounded border bg-card px-6 py-6 text-card-foreground">
          <h1 className="font-semibold">Source Code</h1>

          <div className="flex flex-col items-center justify-center gap-6 rounded-sm border py-8">
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-lg font-bold text-primary">Connect Account</h1>
              <p className="text-sm text-muted-foreground">Connect your GitHub account to use the GitHub integration.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="">
                <Bitbucket className="mr-2" />
                Bitbucket
              </Button>
              <Button variant="outline" className="">
                <GitlabFull className="mr-2" />
                GitLab
              </Button>
              <Button onClick={handleLogin} variant="outline" className="">
                <Github className="mr-2" />
                Github
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Repos repos={repos} setValue={setValue} token={token} isLoading={isLoading} />
          <Branches repos={repos} services={services} setValue={setValue} token={token} />
        </div>
      </div>{" "}
      <Details services={services} setValue={setValue} />
      <Advanced services={services} control={control} />
    </>
  );
};

export default GithubDeploy;

const Details = ({ services, setValue }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Collapsible
      open={expanded}
      onOpenChange={value => {
        setExpanded(value);
      }}
    >
      <Card className="mt-4 rounded-sm border border-muted-foreground/20">
        <CardContent className="p-0">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4">
              <h1 className="font-semibold">Details</h1>
              <NavArrowDown fontSize="1rem" className={cn("transition-all duration-100", { ["rotate-180"]: expanded })} />
            </div>
          </CollapsibleTrigger>
          {expanded && <Separator />}
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-6 p-5">
              <CustomInput label="Root Directory" description="A unique name for your web service." placeholder="eg. src" />
              <CustomInput label="Build Directory" description="The Repository Branch used for your private service" placeholder="eg. anything" />
              <CustomInput label="Build Command" description="A unique name for your web service." placeholder="$ yarn" />
              <CustomInput label="Start Command" description="The Repository Branch used for your private service" placeholder="$ yarn start" />
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
};
const Advanced = ({ services, control }) => {
  const serviceIndex = 0;
  const [expanded, setExpanded] = useState(false);
  const currentService = services[serviceIndex];
  console.log(currentService);
  const [isEditingEnv, setIsEditingEnv] = useState<number | boolean | null>(null);
  const _isEditingEnv = serviceIndex === isEditingEnv;
  return (
    <Collapsible
      open={expanded}
      onOpenChange={value => {
        setExpanded(value);
      }}
    >
      <Card className="mt-4 rounded-sm border border-muted-foreground/20">
        <CardContent className="p-0">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4">
              <h1 className="font-semibold">Advanced</h1>
              <NavArrowDown fontSize="1rem" className={cn("transition-all duration-100", { ["rotate-180"]: expanded })} />
            </div>
          </CollapsibleTrigger>
          {expanded && <Separator />}
          <CollapsibleContent>
            <div className="p-5">
              {_isEditingEnv && (
                <EnvFormModal
                  control={control}
                  onClose={() => setIsEditingEnv(null)}
                  serviceIndex={serviceIndex}
                  envs={currentService.env || []}
                  // hasSecretOption={hasSecretOption}
                />
              )}
              <EnvVarList
                currentService={{
                  ...currentService,
                  env: currentService.env.filter(e => !hiddenEnv.includes(e.key)) as { key: string; value: string }[]
                }}
                setIsEditingEnv={setIsEditingEnv}
                serviceIndex={serviceIndex}
              />
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
};

const CustomInput = ({ label, description, placeholder }: { label: string; description: string; placeholder: string }) => {
  return (
    <div className="flex flex-col gap-5 rounded border bg-card px-6 py-6 text-card-foreground">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold">{label}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Input placeholder={placeholder} />
    </div>
  );
};

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
                  {/* if is private add a lock icon */}
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

const Branches = ({ repos, services, setValue, token }) => {
  const repo = repos?.find(r => r.html_url === services[0]?.env?.find(e => e.key === "REPO_URL")?.value);
  const selected = services?.find(s => s?.env?.find(e => e.key === "REPO_URL" && e.value === repo.html_url));
  console.log(selected);
  const [packageJson, setPackageJson] = useState<any>(null);
  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ["branches", repo?.full_name],
    queryFn: async () => {
      const response = await axios.get(`https://api.github.com/repos/${repo.full_name}/branches`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    enabled: !!selected && repos?.length > 0
  });

  useQuery({
    queryKey: ["packageJson", repo?.full_name],
    queryFn: async () => {
      const response = await axios.get(`https://api.github.com/repos/${repo.full_name}/contents/package.json`, {
        headers: {
          Authorization: `Bearer ${token}`
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
{
  /*         
{packageJson && (
  <div className="flex w-full items-center justify-between gap-3">
    <p>Framework</p>
    <p className="capitalize">{packageJson?.scripts?.start?.split(" ")[0]}</p>
  </div>
)} */
}
