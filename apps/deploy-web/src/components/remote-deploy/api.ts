import { useMutation, useQuery } from "react-query";
import axios, { AxiosError } from "axios";

import { PROXY_API_URL_AUTH } from "./utils";

const Github_API_URL = "https://api.github.com";

export const CLIEND_ID = "Iv23liZYLYN9I2HrgeOh";
export const REDIRECT_URL = "http://localhost:3000/new-deployment?step=edit-deployment&type=github";

export const handleLogin = () => {
  window.location.href = `https://github.com/login/oauth/authorize?client_id=${CLIEND_ID}&redirect_uri=${REDIRECT_URL}`;
};

const axiosInstance = axios.create({
  baseURL: Github_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

export const useUserProfile = (type: "github" | "gitlab" | "bitbucket", token?: string | null) => {
  return useQuery({
    queryKey: ["userProfile", token],
    queryFn: async () => {
      const response = await axiosInstance.get("/user", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    enabled: !!token && type === "github"
  });
};

export const useRepos = (type: "github" | "gitlab" | "bitbucket", setToken: (token: string | null) => void, token?: string | null) => {
  return useQuery({
    queryKey: ["repos"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/user/repos",

        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    },
    onError: (error: AxiosError<{ message: string }>) => {
      if (error?.response?.data?.message === "Bad credentials") {
        console.log("Bad credentials");
        localStorage.removeItem("token");
        setToken(null);
        handleLogin();
        return;
      }
    },
    onSettled: data => {
      console.log(data);

      if (data?.message === "Bad credentials") {
        console.log("Bad credentials");

        localStorage.removeItem("token");
        setToken(null);
        return;
      }
    },
    enabled: !!token && type === "github"
  });
};

export const useFetchAccessToken = (setToken: (token: string | null) => void) => {
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await axios.post(`${PROXY_API_URL_AUTH}/authenticate`, {
        code
      });

      return response.data;
    },
    onSuccess: data => {
      console.log(data);

      setToken(data.access_token);
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }
    }
  });
};

export const useBranches = (repo: string, token: string, fetch: boolean) => {
  return useQuery({
    queryKey: ["branches", repo],
    queryFn: async () => {
      const response = await axiosInstance.get(`/repos/${repo}/branches`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },

    enabled: fetch
  });
};
