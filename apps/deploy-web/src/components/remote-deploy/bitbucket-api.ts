import { useMutation, useQuery } from "react-query";
import axios, { AxiosError } from "axios";

import { OAuth, PROXY_API_URL_AUTH } from "./utils";

const Bitbucket_API_URL = "https://api.bitbucket.org/2.0";

const axiosInstance = axios.create({
  baseURL: Bitbucket_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

export const useBitUserProfile = (type: OAuth, token?: string | null) => {
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
    enabled: !!token && type === "bitbucket"
  });
};

export const useBitFetchAccessToken = (setToken: (token: string | null) => void) => {
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await axios.post(`${PROXY_API_URL_AUTH}/bitbucket/authenticate`, {
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
