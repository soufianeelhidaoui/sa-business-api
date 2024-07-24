export const get = (key: string): string => {
  return process.env[key] ?? '';
}


export default {
  get: get
}
