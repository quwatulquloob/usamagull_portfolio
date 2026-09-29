/** Module declarations for build-time text imports (Wrangler/ESBuild). */
declare module '*.html' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: string;
  export default content;
}
