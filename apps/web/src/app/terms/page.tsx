export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Terms & Conditions</h1>
        <p className="text-muted-foreground text-sm">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <p>
          By using this app, you agree to use it responsibly and not for any
          harmful or illegal activity.
        </p>

        <p>
          This is a personal project, offered “as is.” I’m not responsible for
          decisions made using any output from the app — especially if the app
          generates incorrect or unexpected information.
        </p>

        <p>
          Please use it responsibly and avoid sharing sensitive or private
          information. Misuse of the platform may result in access being
          revoked.
        </p>

        <p>
          These terms may be updated occasionally. Continued use means you agree
          to the latest version.
        </p>
      </div>
    </div>
  );
}
