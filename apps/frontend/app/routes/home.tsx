import { greet } from '@hn-challenge/shared'

export function meta() {
  return [
    { title: 'HN Challenge' },
    { name: 'description', content: 'House Numbers Challenge' },
  ]
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {greet('Frontend')}
        </h1>
        <p className="text-gray-600">Welcome to the House Numbers Challenge!</p>
      </div>
    </div>
  )
}
