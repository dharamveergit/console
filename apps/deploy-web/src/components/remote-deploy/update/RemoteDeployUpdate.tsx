import React, { Dispatch, useEffect, useState } from "react";
import { Control, useFieldArray, useForm } from "react-hook-form";
import { Input, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Switch } from "@akashnetwork/ui/components";
import { GitCommit } from "iconoir-react";
import { useAtom } from "jotai";
import { nanoid } from "nanoid";

import remoteDeployStore from "@src/store/remoteDeployStore";
import { SdlBuilderFormValues, Service } from "@src/types";
import { defaultService } from "@src/utils/sdl/data";
import { generateSdl } from "@src/utils/sdl/sdlGenerator";
import { importSimpleSdl } from "@src/utils/sdl/sdlImport";
import { github } from "@src/utils/templates";
import { useCommits } from "../api/api";
import { useBitBucketCommits } from "../api/bitbucket-api";
import { useGitLabCommits } from "../api/gitlab-api";
import BitBranches from "../bitbucket/Branches";
import { EnvFormModal } from "../EnvFormModal";
import Branches from "../github/Branches";
import GitBranches from "../gitlab/Branches";
import { removeInitialUrl } from "../utils";

const RemoteDeployUpdate = ({
  sdlString,
  setRemoteDeploy,
  setEditedManifest
}: {
  sdlString: string;
  setRemoteDeploy: Dispatch<React.SetStateAction<boolean>>;
  setEditedManifest: Dispatch<React.SetStateAction<string | null>>;
}) => {
  console.log(sdlString);

  const [token] = useAtom(remoteDeployStore.tokens);
  const [, setIsInit] = useState(false);
  const { control, watch, setValue } = useForm<SdlBuilderFormValues>({
    defaultValues: {
      services: [defaultService]
    }
  });
  const { fields: services } = useFieldArray({
    control,
    name: "services",
    keyName: "id"
  });

  useEffect(() => {
    const { unsubscribe } = watch(data => {
      const sdl = generateSdl(data.services as Service[]);
      setEditedManifest(sdl);
    });

    try {
      if (sdlString) {
        const services = createAndValidateSdl(sdlString);
        setValue("services", services as Service[]);
      }
    } catch (error) {
      setError("Error importing SDL");
    }

    setIsInit(true);

    return () => {
      unsubscribe();
    };
  }, [watch, sdlString]);

  const [, setError] = useState<string | null>(null);

  const createAndValidateSdl = (yamlStr: string) => {
    try {
      if (!yamlStr) return [];

      const services = importSimpleSdl(yamlStr);

      setError(null);

      return services;
    } catch (err) {
      if (err.name === "YAMLException" || err.name === "CustomValidationError") {
        setError(err.message);
      } else if (err.name === "TemplateValidation") {
        setError(err.message);
      } else {
        setError("Error while parsing SDL file");
        console.error(err);
      }
    }
  };

  useEffect(() => {
    if (github.content.includes(services?.[0]?.image)) {
      setRemoteDeploy(true);
    }
  }, [services]);

  return github.content.includes(services?.[0]?.image) ? (
    <div className="flex flex-col gap-6 rounded border bg-card px-4 py-6 md:px-6">
      {services[0]?.env?.length && <EnvFormModal control={control} serviceIndex={0} envs={services[0]?.env ?? []} onClose={() => {}} />}
      {/* //type === github */}
      {token.access_token && services[0]?.env?.find(e => e.key === "REPO_URL")?.value.includes(token.type) && (
        <>
          {" "}
          <div className="flex flex-col gap-5 rounded border bg-card px-6 py-6 text-card-foreground">
            <div className="flex flex-col gap-2">
              <h1 className="font-semibold">RollBack</h1>
              <p className="text-muted-foreground">A unique name for your web service.</p>
            </div>

            <SelectCommit services={services} control={control} />
          </div>
          {token?.type === "github" ? (
            <Branches services={services} control={control} />
          ) : token?.type === "gitlab" ? (
            <GitBranches control={control} services={services} />
          ) : (
            <BitBranches control={control} services={services} />
          )}
        </>
      )}
    </div>
  ) : null;
};

export default RemoteDeployUpdate;

const SelectCommit = ({ services, control }: { services: Service[]; control: Control<SdlBuilderFormValues> }) => {
  const { data } = useCommits(
    services?.[0]?.env?.find(e => e.key === "REPO_URL")?.value?.replace("https://github.com/", "") ?? "",
    services?.[0]?.env?.find(e => e.key === "BRANCH_NAME")?.value ?? ""
  );

  const { data: labCommits } = useGitLabCommits(
    services?.[0]?.env?.find(e => e.key === "GITLAB_PROJECT_ID")?.value,
    services?.[0]?.env?.find(e => e.key === "BRANCH_NAME")?.value
  );

  const { data: bitbucketCommits } = useBitBucketCommits(removeInitialUrl(services?.[0]?.env?.find(e => e.key === "REPO_URL")?.value ?? ""));
  console.log(labCommits);

  return (
    <Field
      data={
        data?.length > 0
          ? data.map(commit => ({
              name: commit.commit.message,
              value: commit.sha,
              date: new Date(commit.commit.author.date)
            }))
          : labCommits?.length > 0
            ? labCommits?.map(commit => ({
                name: commit.title,
                value: commit.id,
                date: new Date(commit.authored_date)
              }))
            : bitbucketCommits?.values?.map(commit => ({
                name: commit.message,
                value: commit.hash,
                date: new Date(commit.date)
              }))
      }
      control={control}
    />
  );
};

const Field = ({ data, control }: { data: any; control: Control<SdlBuilderFormValues> }) => {
  const [manual, setManual] = useState<boolean>(false);
  const { fields: services } = useFieldArray({
    control,
    name: "services",
    keyName: "id"
  });
  const {
    append,

    update
  } = useFieldArray({
    control,
    name: "services.0.env",
    keyName: "id"
  });

  return (
    <div className="flex items-center gap-6">
      {manual ? (
        <Input
          value={services[0]?.env?.find(e => e.key === "COMMIT_HASH")?.value}
          placeholder="Commit Hash"
          onChange={e => {
            const hash = { id: nanoid(), key: "COMMIT_HASH", value: e.target.value, isSecret: false };

            if (services[0]?.env?.find(e => e.key === "COMMIT_HASH")) {
              update(
                services[0]?.env?.findIndex(e => e.key === "COMMIT_HASH"),
                hash
              );
            } else {
              append(hash);
            }
          }}
        />
      ) : (
        <Select
          value={services[0]?.env?.find(e => e.key === "COMMIT_HASH")?.value}
          onValueChange={(value: any) => {
            const hash = { id: nanoid(), key: "COMMIT_HASH", value: value, isSecret: false };

            if (services[0]?.env?.find(e => e.key === "COMMIT_HASH")) {
              update(
                services[0]?.env?.findIndex(e => e.key === "COMMIT_HASH"),
                hash
              );
            } else {
              append(hash);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <SelectValue placeholder={"Select"} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {data?.map((repo: any) => (
                <SelectItem key={repo.value} value={repo.value}>
                  <div className="flex items-center">
                    <GitCommit className="mr-2" />
                    {repo?.name?.split("\n")[0]}

                    <p className="ml-2 text-xs text-muted-foreground">{new Date(repo?.date).toLocaleDateString()}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
      <Switch
        onCheckedChange={checked => {
          setManual(checked);
        }}
        checked={manual}
      />
    </div>
  );
};