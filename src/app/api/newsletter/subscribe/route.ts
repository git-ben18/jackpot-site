import { handleSubscribePost, methodNotAllowedSubscribe } from '@/lib/newsletter/newsletter-bff'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleSubscribePost(request)
}

export async function GET() {
  return methodNotAllowedSubscribe()
}
