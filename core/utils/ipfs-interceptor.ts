import { Fetcher } from "../class/Fetcher";
import { Project } from "../class/entities/Project";


export function IPFSInterceptor(client: Fetcher): Fetcher {
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client));

  // Proxy all methods

  methods.forEach((method) => {
    const originalMethod = client[method];

    client[method] = async (...args) => {
      console.log('proxying', method);
      const results = (await originalMethod.apply(client, args));
      console.log(results)
      for(const result of [results[0]] ) {
        if(!result.project) continue;

        if (result instanceof Project) {
          // result.details = await getIPFSData(result.details.metaPtr);
          if (result.details) {
            console.log(result.details)
          }
        }
      }
        if (results?.details && results.details.description) {
        results.details.description = 'Arturo was here.';
      }
      return results;
    };
  });

  return client;
}


