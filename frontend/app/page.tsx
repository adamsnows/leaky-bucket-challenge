import { Suspense } from "react"
import LoginForm from "@/components/login-form"
import PixTransactionForm from "@/components/pix-transaction-form"
import TokenDisplay from "@/components/token-display"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center text-green-800 mb-8">Pix Transaction System</h1>

        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Login</h2>
            <LoginForm />
          </div>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Initiate Pix Transaction</h2>
            <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
              <PixTransactionForm />
            </Suspense>
          </div>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Token Status</h2>
            <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
              <TokenDisplay />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
