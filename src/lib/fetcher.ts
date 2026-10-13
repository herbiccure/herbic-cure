export const fetcher = async <T = any>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      errMsg = data.error || data.message || errMsg;
    } catch {}
    const err = new Error(errMsg);
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
};
