
export default function AuthLayout({ title, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4">
      <div className="bg-white w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-blue-600">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
