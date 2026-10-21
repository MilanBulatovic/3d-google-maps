export function BrandMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#1c1917",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size * 0.52}
        height={size * 0.52}
        viewBox="0 0 24 24"
        fill="#fffaf3"
      >
        <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
      </svg>
    </div>
  );
}
