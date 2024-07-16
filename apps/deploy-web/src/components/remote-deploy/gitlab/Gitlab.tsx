import React, { useState } from "react";

import { Service } from "@src/types";
import { useGitLabReposByGroup } from "../api/gitlab-api";
import { ServiceControl } from "../utils";
import Branches from "./Branches";
import Groups from "./Groups";
import Repos from "./Repos";

const GitLab = ({ loading, setValue, services, control }: { loading: boolean; setValue: any; services: Service[]; control: ServiceControl }) => {
  const [group, setGroup] = useState<string>("");
  const { data: repos, isLoading } = useGitLabReposByGroup(group);
  return (
    <>
      <Groups isLoading={loading} group={group} setGroup={setGroup} />
      <Repos isLoading={isLoading} repos={repos} setValue={setValue} />
      <Branches services={services} control={control} repos={repos} />
    </>
  );
};

export default GitLab;
