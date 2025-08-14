export default function Footer() {
  return (
    <footer className="border-t bg-white mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <p className="text-gray-600">© MailApp. All rights reserved.</p>
          <nav className="flex items-center gap-4">
            <a href="/about" className="text-gray-600 hover:text-black">About</a>
            <a href="/privacy" className="text-gray-600 hover:text-black">Privacy Policy</a>
            <a href="/terms" className="text-gray-600 hover:text-black">Terms & Conditions</a>
          </nav>
        </div>
        <a
          href="https://buymeacoffee.com/farzanarshad"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-4 py-2 rounded"
        >
          ☕ Buy me a coffee
        </a>
      </div>
    </footer>
  );
}


