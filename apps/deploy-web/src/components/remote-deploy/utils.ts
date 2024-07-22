import { Control } from "react-hook-form";
import { nanoid } from "nanoid";

import { SdlBuilderFormValues, Service } from "@src/types";

export type OAuth = "github" | "gitlab" | "bitbucket";
export const PROXY_API_URL_AUTH = "https://proxy-console-github.vercel.app";
export const hiddenEnv = ["REPO_URL", "BRANCH_NAME", "ACCESS_TOKEN", "BUILD_DIRECTORY", "BUILD_COMMAND", "NODE_VERSION", "CUSTOM_SRC", "COMMIT_HASH"];
export const REDIRECT_URL = "http://localhost:3000/new-deployment?step=edit-deployment&type=github";
export type ServiceControl = Control<SdlBuilderFormValues>;
export function appendEnv(key: string, value: string, isSecret: boolean, setValue: any, services: Service[]) {
  const previousEnv = services[0]?.env || [];
  if (previousEnv.find(e => e.key === key)) {
    previousEnv.map(e => {
      if (e.key === key) {
        e.value = value;
        e.isSecret = isSecret;

        return e;
      }
      return e;
    });
  } else {
    previousEnv.push({ id: nanoid(), key, value, isSecret });
  }
  setValue("services.0.env", previousEnv);
}

export const removeInitialUrl = (url?: string) => {
  return url?.split("/").slice(-2).join("/");
};