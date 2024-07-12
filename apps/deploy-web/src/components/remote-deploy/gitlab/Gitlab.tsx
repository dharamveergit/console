import React, { useState } from "react";

import { Service } from "@src/types";
import { useGitLabReposByGroup } from "../api/gitlab-api";
import Groups from "./Groups";
// import Branches from "./Branches";
import Repos from "./Repos";

const GitLab = ({ loading, setValue, services, id }: { loading: boolean; setValue: any; services: Service[]; id: string }) => {
  const [group, setGroup] = useState<string>("");
  const { data: repos, isLoading } = useGitLabReposByGroup(group);
  return (
    <>
      <Groups isLoading={loading} group={group} setGroup={setGroup} />
      <Repos isLoading={isLoading} repos={repos} setValue={setValue} />
      {/* <Branches repos={repos} services={services} setValue={setValue} /> */}
    </>
  );
};

export default GitLab;
