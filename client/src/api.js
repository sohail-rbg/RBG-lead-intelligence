import axios from "axios";

// The client always uses relative /api (proxied by Vite in dev).
const api = axios.create({ baseURL: "/api" });

export async function get(path) {
  const { data } = await api.get(path);
  return data.data;
}
export async function post(path, body) {
  const { data } = await api.post(path, body);
  return data.data;
}
export async function put(path, body) {
  const { data } = await api.put(path, body);
  return data.data;
}
export async function del(path) {
  const { data } = await api.delete(path);
  return data.data;
}

export default api;
