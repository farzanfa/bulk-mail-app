export default function Footer() {
  return (
    <footer className="border-t bg-white mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <p className="text-gray-600">© MailApp. All rights reserved.</p>
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


