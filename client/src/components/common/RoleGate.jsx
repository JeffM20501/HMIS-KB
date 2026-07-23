import useAuth from "../../hooks/useAuth";

/** Renders children only if the signed-in user's role is in `allow`. */
export default function RoleGate({ allow = [], children, fallback = null }) {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) return fallback;
  return children;
}
