// Next types every .svg import as `any`, to leave room for SVG-to-component loaders. The logo files
// are plain images, so their imports get the type the image component takes.
declare module "@/logo/*.svg" {
  import type { StaticImageData } from "next/image";

  const image: StaticImageData;
  export default image;
}
