export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="bg-white rounded-lg border text-center py-16 px-6" style={{ borderColor: "#E1E3EA" }}>
      {Icon && <Icon size={32} className="mx-auto mb-3" style={{ color: "#D1D5DB" }} />}
      <p className="text-sm font-medium mb-1" style={{ color: "#243656" }}>{title}</p>
      {description && (
        <p className="text-xs mb-4 max-w-sm mx-auto" style={{ color: "#9EA6B3" }}>{description}</p>
      )}
      {action}
    </div>
  );
}
