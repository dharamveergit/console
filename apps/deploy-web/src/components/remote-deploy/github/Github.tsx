import React from "react";
import { useAtom } from "jotai";

import remoteDeployStore from "@src/store/remoteDeployStore";
import { Service } from "@src/types";
import { useRepos } from "../api/api";
import Branches from "./Branches";
import Repos from "./Repos";

const Github = ({ setValue, services }: { setValue: any; services: Service[] }) => {
  const { data: repos, isLoading } = useRepos();

  return (
    <>
      <Repos repos={repos} setValue={setValue} isLoading={isLoading} services={services} />
      <Branches repos={repos} services={services} setValue={setValue} />
    </>
  );
};

export default Github;
