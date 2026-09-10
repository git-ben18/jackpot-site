import {
  handleConfirmConsumePost,
  methodNotAllowedConfirmConsume,
} from '@/lib/newsletter/newsletter-bff'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleConfirmConsumePost(request)
}

export async function GET() {
  return methodNotAllowedConfirmConsume()
}
