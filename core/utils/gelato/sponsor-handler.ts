export interface ApiRequest {
  method: string;
  body: unknown;
}

export interface ApiResponse {
  statusCode: number;
  send: (body: unknown) => void;
}

const assertionObj = [
  {
    data: /0x[a-fA-F0-9]+/gim,
    chainId: /\d+/,
    target: /0x[a-fA-F0-9]{40}/gim,
  },
  /\{apiKey\}/,
  {
    retries: /\d+/,
  },
];

function assert(body: any) {
  if (!Array.isArray(body) || body.length !== assertionObj.length)
    throw new Error("Invalid request body");

  assertionObj.forEach((item, index) => {
    // check if objects from assertion Object are present in body
    // and test them using the regexp from the assertion Object
    if (typeof item === "object") {
      Object.entries(item).forEach(([key, value]) => {
        if (!body[index][key]?.toString().match(value))
          throw new Error("Invalid request body");
      });
    }
    // test other items as strings
    else if (!body[index]?.toString().match(item))
      throw new Error("Invalid request body");
  });
}

export function handler(req: ApiRequest, res: ApiResponse) {
  //     if(req.method !== "POST") {
  //         res.statusCode = 405;
  //         res.send("Method not allowed");
  //         return;
  //     }
  //     const body = req.body as unknown;
  //     assert(body);
  //     const { GELATO_API_KEY: apiKey } = process.env;
  //     if (!apiKey) throw new Error("Sorry, we can't do it right now.");
  //     body[1] = apiKey;
  //     const result = await DelegateRegistryContract.sendGelato(...body);
  //     const txId = await result.wait();
  //     res.send({ txId });
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   } catch (error: any) {
  //     // eslint-disable-next-line no-console
  //     console.log(error);
  //     res.statusCode = 400;
  //     res.send(error.message);
  //   }
}
