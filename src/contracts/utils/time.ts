export const sleep = async (s: number) =>
  new Promise((res) =>
    setTimeout(() => {
      res(null);
    }, s),
  );
