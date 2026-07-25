export default function FieldError({ children }) {
  if (!children) return null;
  return <p className="text-xs text-danger mt-1">{children}</p>;
}
