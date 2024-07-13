import React from "react";
import { useAtom } from "jotai";

import remoteDeployStore from "@src/store/remoteDeployStore";
import { Service } from "@src/types";
import { useRepos } from "../api/api";
import Branches from "./Branches";
import Repos from "./Repos";

const Github = ({ setValue, services }: { setValue: any; services: Service[] }) => {
  const { data: repos, isLoading } = useRepos();
  const [token] = useAtom(remoteDeployStore.tokens);
  return (
    <>
      <Repos repos={repos} setValue={setValue} token={token} isLoading={isLoading} />
      <Branches repos={repos} services={services} setValue={setValue} token={token?.access_token} />
    </>
  );
};

export default Github;
