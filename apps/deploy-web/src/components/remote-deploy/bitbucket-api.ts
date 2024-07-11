import { useMutation, useQuery } from "react-query";
import axios from "axios";
import { useAtom } from "jotai";
import { usePathname, useRouter } from "next/navigation";

import remoteDeployStore from "@src/store/remoteDeployStore";
import { PROXY_API_URL_AUTH } from "./utils";

const Bitbucket_API_URL = "https://api.bitbucket.org/2.0";

const axiosInstance = axios.create({
  baseURL: Bitbucket_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

export const useBitUserProfile = () => {
  const [token] = useAtom(remoteDeployStore.tokens);
  return useQuery({
    queryKey: ["userProfile", token.access_token],
    queryFn: async () => {
      const response = await axiosInstance.get("/user", {
        headers: {
          Authorization: `Bearer ${token?.access_token}`
        }
      });
      return response.data;
    },
    enabled: !!token?.access_token && token.type === "bitbucket"
  });
};

export const useBitFetchAccessToken = () => {
  const [, setToken] = useAtom(remoteDeployStore.tokens);
  const pathname = usePathname();
  const router = useRouter();
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await axios.post(`${PROXY_API_URL_AUTH}/bitbucket/authenticate`, {
        code
      });

      return response.data;
    },
    onSuccess: data => {
      setToken({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        type: "bitbucket"
      });

      router.replace(pathname.split("?")[0] + "?step=edit-deployment&type=github");
    }
  });
};

export const useWorkspaces = () => {
  const [token] = useAtom(remoteDeployStore.tokens);
  return useQuery({
    queryKey: ["workspaces", token.access_token],
    queryFn: async () => {
      const response = await axiosInstance.get("/workspaces", {
        headers: {
          Authorization: `Bearer ${token?.access_token}`
        }
      });
      return response.data;
    },
    enabled: !!token?.access_token && token.type === "bitbucket"
  });
};

export const useBitReposByWorkspace = (workspace: string) => {
  const [token] = useAtom(remoteDeployStore.tokens);
  return useQuery({
    queryKey: ["repos", token.access_token, workspace],
    queryFn: async () => {
      const response = await axiosInstance.get(`/repositories/${workspace}`, {
        headers: {
          Authorization: `Bearer ${token?.access_token}`
        }
      });
      return response.data;
    },
    enabled: !!token?.access_token && token.type === "bitbucket" && !!workspace
  });
};

export const useBitBranches = (repo: string, selected: boolean) => {
  const [token] = useAtom(remoteDeployStore.tokens);
  return useQuery({
    queryKey: ["branches", repo],
    queryFn: async () => {
      const response = await axiosInstance.get(`/repositories/${repo}/refs/branches`, {
        headers: {
          Authorization: `Bearer ${token?.access_token}`
        }
      });
      return response.data;
    },
    enabled: !!repo && !!token?.access_token && token.type === "bitbucket" && !!selected
  });
};
