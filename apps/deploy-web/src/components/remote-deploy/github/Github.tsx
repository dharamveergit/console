import React from "react";
import { Control } from "react-hook-form";
import { useAtom } from "jotai";

import remoteDeployStore from "@src/store/remoteDeployStore";
import { SdlBuilderFormValues, Service } from "@src/types";
import { useRepos } from "../api/api";
import Branches from "./Branches";
import Repos from "./Repos";

const Github = ({
  control,
  setValue,
  services
}: {
  control: Control<SdlBuilderFormValues>;

  setValue: any;
  services: Service[];
}) => {
  const { data: repos, isLoading } = useRepos();

  return (
    <>
      <Repos repos={repos} setValue={setValue} isLoading={isLoading} services={services} />
      <Branches services={services} control={control} />
    </>
  );
};

export default Github;
