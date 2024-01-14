import { callApi } from "./api.ts";
import { Banner } from "server/api/banners.ts";

async function getBanners() {
  const response = await callApi<Banner[]>('/api/banners', 'GET');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export {
  getBanners
};
