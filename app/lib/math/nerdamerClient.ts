/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
let nerdamerInstance: any;

export const getNerdamer = (): any | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  if (!nerdamerInstance) {
    nerdamerInstance = require("nerdamer/all.min");
  }

  return nerdamerInstance;
};
/* eslint-enable @typescript-eslint/no-require-imports */
/* eslint-enable @typescript-eslint/no-explicit-any */
