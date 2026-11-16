import { handleApi } from "../../src/server/app";
import type { AppEnv } from "../../src/server/app";

export const onRequest: PagesFunction<AppEnv> = async (context) => {
  return handleApi(context.request, context.env);
};
