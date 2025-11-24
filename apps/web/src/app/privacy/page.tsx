export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <p>
          This is a personal project. I only collect the minimum data required
          for the app to function — such as login details and anything you type
          into the app.
        </p>

        <p>
          None of your data is sold or shared with third-party advertisers. Data
          is used only to provide app functionality and improve the experience.
        </p>

        <p>
          You may request deletion of your data at any time by contacting me at{" "}
          <a
            href="mailto:manishlal2273@gmail.com"
            className="underline text-primary"
          >
            manishlal2273@gmail.com
          </a>
          .
        </p>

        <p>
          Basic logs (like device info or errors) may be collected to keep the
          app running smoothly.
        </p>

        <p>
          Updates to this policy may occur occasionally. Continued use of the
          app means you accept any changes.
        </p>
      </div>
    </div>
  );
}
