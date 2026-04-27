import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/profile/$userId')({
  component: ProfilePage
})

function ProfilePage() {
  const { userId } = Route.useParams()
  return (
    <main>
      {/* TODO: reputation, reviews, listings, transaction history */}
      <h1>Profile {userId}</h1>
    </main>
  )
}
