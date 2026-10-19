export const removeDoubleSlash = (url: string) => {
  return url.replace(/(https?:\/\/.*?)\/\//g, '$1/');
};
