export default function RootPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        <p className="mb-4">If you see this, middleware might not be working</p>
        <div className="space-x-4">
          <a href="/login" className="bg-blue-500 text-white px-4 py-2 rounded">Login</a>
          <a href="/home" className="bg-green-500 text-white px-4 py-2 rounded">Home</a>
        </div>
      </div>
    </div>
  )
}
