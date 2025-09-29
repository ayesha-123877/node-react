// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-gray-100 text-center py-3 border-t mt-6">
      <p className="text-sm text-gray-600">
        © {new Date().getFullYear()} SIM Dashboard. All rights reserved.
      </p>
    </footer>
  );
}
