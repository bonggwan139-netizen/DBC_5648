declare module "shpjs" {
  const shp: (input: string | ArrayBuffer | ArrayBufferView | DataView | Record<string, unknown>) => Promise<unknown>;
  export default shp;
}
