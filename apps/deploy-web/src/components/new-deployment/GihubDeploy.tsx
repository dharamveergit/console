import { useEffect, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { Button, Spinner, Tabs, TabsContent, TabsList, TabsTrigger } from "@akashnetwork/ui/components";
import axios, { AxiosError } from "axios";
import { Bitbucket, Github, GitlabFull } from "iconoir-react";

import { Service } from "@src/types";
import Advanced from "../remote-deploy/Advanced";
import Branches from "../remote-deploy/Branches";
import CustomInput from "../remote-deploy/CustomInput";
import Details from "../remote-deploy/Details";
import Repos from "../remote-deploy/Repos";
import { appendEnv } from "../remote-deploy/utils";

const GithubDeploy = ({ setValue, services, control }: { setValue: any; services: Service[]; control: any }) => {
  console.log(services);

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
        refreshToken();
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

  const { mutate: refreshToken, isLoading: refreshingToken } = useMutation({
    mutationFn: async () => {
      const response = await axios.post("https://proxy-console-github.vercel.app/refresh", {
        refreshToken: token
      });
      return response.data;
    },
    onSuccess: data => {
      console.log(data);

      setToken(data.access_token);
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }
    }
  });

  const { data: userProfile, isLoading: fetchingProfile } = useQuery({
    queryKey: ["userProfile", token],
    queryFn: async () => {
      const response = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    enabled: !!token
  });

  console.log(userProfile);

  const { mutate: fetchAccessToken, isLoading: fetchingToken } = useMutation({
    mutationFn: async (code: string) => {
      const response = await axios.post("https://proxy-console-github.vercel.app/authenticate", {
        code
      });
      return response.data;
    },
    onSuccess: data => {
      console.log(data);

      setToken(data.access_token);
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }
    }
  });

  const [selectedTab, setSelectedTab] = useState("git");

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

          {
            <Tabs
              onValueChange={value => {
                setSelectedTab(value);
                setValue("services.0.env", []);
              }}
              defaultValue="git"
            >
              <TabsList>
                <TabsTrigger value="git">Git Provider</TabsTrigger>
                <TabsTrigger value="public">Public Git Repository</TabsTrigger>
              </TabsList>
              <TabsContent value="git">
                {" "}
                {fetchingToken || refreshingToken || fetchingProfile ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded border px-5 py-10">
                    <Spinner size="large" />
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : token ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded border px-5 py-10">
                    <h1 className="text-2xl font-semibold text-primary">Welcome, {userProfile?.login}</h1>
                    <p className="text-muted-foreground">Let’s Configure and Deploy your new web service</p>
                  </div>
                ) : (
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
                )}
              </TabsContent>
              <TabsContent value="public" className="flex flex-col gap-6">
                <CustomInput
                  label="Repository URL"
                  description="The Repository Branch used for your private service"
                  placeholder="eg. anything"
                  onChange={e => appendEnv("REPO_URL", e.target.value, false, setValue, services)}
                />
                <CustomInput
                  label="Branch Name"
                  description="The Repository Branch used for your private service"
                  placeholder="eg. anything"
                  onChange={e => appendEnv("BRANCH_NAME", e.target.value, false, setValue, services)}
                />
              </TabsContent>
            </Tabs>
          }
        </div>
        {selectedTab === "git" && (
          <div className="grid grid-cols-2 gap-6">
            <Repos repos={repos} setValue={setValue} token={token} isLoading={isLoading} />
            <Branches repos={repos} services={services} setValue={setValue} token={token} />
          </div>
        )}
      </div>{" "}
      <Details services={services} setValue={setValue} />
      <Advanced services={services} control={control} />
    </>
  );
};

export default GithubDeploy;
