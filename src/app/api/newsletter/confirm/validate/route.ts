import {
  handleConfirmValidatePost,
  methodNotAllowedConfirmValidate,
} from '@/lib/newsletter/newsletter-bff'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleConfirmValidatePost(request)
}

export async function GET() {
  return methodNotAllowedConfirmValidate()
}
