export default function Label({ children, required, className = '', ...props }) {
  return (
    <label className={`block text-sm font-medium text-text-primary mb-1.5 ${className}`} {...props}>
      {children} {required && <span className="text-danger">*</span>}
    </label>
  );
}
