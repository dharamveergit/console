import { useMutation, useQuery } from "react-query";
import axios from "axios";
import { useAtom } from "jotai";
import { usePathname, useRouter } from "next/navigation";

import remoteDeployStore from "@src/store/remoteDeployStore";
import { PROXY_API_URL_AUTH } from "../utils";

// ?step=edit-deployment&type=github
const CLIEND_ID = "f8b7584c38a6aaba2315e3c377513debd589e0a06bf15cc3fd96b1dd713b19ca";
const REDIRECT_URL = "http://localhost:3000/new-deployment";

export const handleGitLabLogin = () => {
  window.location.href = `https://gitlab.com/oauth/authorize?client_id=${CLIEND_ID}&redirect_uri=${REDIRECT_URL}&response_type=code&scope=read_user+read_repository&state=gitlab`;
};

const axiosInstance = axios.create({
  baseURL: "https://gitlab.com/api/v4",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

export const useGitLabFetchAccessToken = () => {
  const [, setToken] = useAtom(remoteDeployStore.tokens);
  const pathname = usePathname();
  const router = useRouter();
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await axios.post(`${PROXY_API_URL_AUTH}/gitlab/authenticate`, {
        code
      });

      return response.data;
    },
    onSuccess: data => {
      setToken({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        type: "gitlab"
      });

      router.replace(pathname.split("?")[0] + "?step=edit-deployment&type=github");
    }
  });
};

export const useGitLabUserProfile = () => {
  const [token] = useAtom(remoteDeployStore.tokens);
  return useQuery({
    queryKey: ["gitlab-user-Profile", token?.access_token],
    queryFn: async () => {
      const response = await axiosInstance.get("/user", {
        headers: {
          Authorization: `Bearer ${token?.access_token}`
        }
      });
      return response.data;
    },
    enabled: !!token?.access_token && token.type === "gitlab"
  });
};
