class FetchError extends Error {
  constructor(
    public response: Response,
    message = "HTTP Error " + response.status,
  ) {
    super(message);
  }
}

export function myFetch(
  input: string | Request | URL,
  init?: RequestInit | undefined,
): Promise<Response> {
  return fetch(input, init)
    .then((response) => {
      if (!response.ok) {
        throw new FetchError(response);
      }
      return response;
    });
}
