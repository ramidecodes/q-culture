export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Not Found</h2>
      <p className="text-muted-foreground mb-4">
        Could not find requested resource
      </p>
      <a href="/" className="text-primary hover:underline">
        Return Home
      </a>
    </div>
  );
}
