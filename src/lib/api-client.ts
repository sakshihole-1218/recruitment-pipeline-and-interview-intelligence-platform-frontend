import axios from "axios";

import { envConfig } from "@/config/env.config";

export const apiClient = axios.create({
  baseURL: envConfig.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});