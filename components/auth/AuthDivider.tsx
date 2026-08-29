export function AuthDivider() {
  return (
    <div className="my-18 flex items-center gap-16" role="separator">
      <div className="h-px flex-1 bg-outline-variant" />
      <span className="text-caption text-on-surface-variant">Or</span>
      <div className="h-px flex-1 bg-outline-variant" />
    </div>
  );
}
