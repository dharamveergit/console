import React, { useState } from "react";

import { Service } from "@src/types";
import { useBitReposByWorkspace } from "../bitbucket-api";
import Branches from "./Branches";
import Repos from "./Repos";
import WorkSpaces from "./Workspaces";

const Bit = ({ loading, setValue, services }: { loading: boolean; setValue: any; services: Service[] }) => {
  const [workSpace, setWorkSpace] = useState<string>("");

  const { data: repos, isLoading } = useBitReposByWorkspace(workSpace);

  return (
    <>
      <WorkSpaces isLoading={loading} workSpaces={workSpace} setWorkSpaces={setWorkSpace} />
      <Repos isLoading={isLoading} repos={repos} setValue={setValue} />
      <Branches repos={repos} services={services} setValue={setValue} />
    </>
  );
};

export default Bit;
