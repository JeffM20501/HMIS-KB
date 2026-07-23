export default function PasswordStrength({ password }) {
    const checks = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
    const colors = ["#E1E3EA", "#F22F46", "#E87722", "#F7C948", "#00A368"];
    if (!password) return null;
    return (
    <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex-1 h-1 rounded-full" style={{ background: n <= checks ? colors[checks] : "#E1E3EA" }} />
        ))}
    </div>
    );
}