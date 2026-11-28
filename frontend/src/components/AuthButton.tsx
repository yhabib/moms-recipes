import { shortPrincipal, useAuth } from "../auth";

/** Signs the user in or out with Internet Identity. */
export function AuthButton() {
  const { status, principal, signIn, signOut } = useAuth();

  if (status === "loading") {
    return (
      <div className="auth">
        <span className="muted">Checking sign-in…</span>
      </div>
    );
  }

  if (status === "signedOut" || principal === null) {
    return (
      <div className="auth">
        <button type="button" className="auth-button" onClick={() => void signIn()}>
          Sign in
        </button>
      </div>
    );
  }

  const text = principal.toText();
  return (
    <div className="auth">
      <span className="auth-principal" title={text}>
        {shortPrincipal(text)}
      </span>
      <button type="button" className="auth-button" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  );
}
