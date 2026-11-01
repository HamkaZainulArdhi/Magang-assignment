import ky from "ky";

export const api = ky.create({
  baseUrl: "https://jsonplaceholder.typicode.com",
  timeout: 10_000,
  headers: { Accept: "application/json" },
});
