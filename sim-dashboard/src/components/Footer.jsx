export default function Footer() {
  return (
    <footer className="bg-gray-100 text-center py-3 border-t mt-6 w-full">
      <p className="text-xs sm:text-sm text-gray-600 px-2">
        © {new Date().getFullYear()} SIM Dashboard. All rights reserved.
      </p>
    </footer>
  );
}
