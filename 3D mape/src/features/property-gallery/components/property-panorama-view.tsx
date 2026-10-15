type PropertyPanoramaViewProps = {
  url: string;
};

/** Separate viewing mode for a real panorama asset. Ordinary photographs never render here. */
export function PropertyPanoramaView({ url }: PropertyPanoramaViewProps) {
  return (
    <iframe
      title="360 degree panorama"
      src={url}
      className="absolute inset-0 h-full w-full border-0 bg-black"
    />
  );
}
