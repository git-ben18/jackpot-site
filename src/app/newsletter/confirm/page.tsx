import type { Metadata } from 'next'

import NewsletterConfirmClient from '../../../components/newsletter/NewsletterConfirmClient'

export const metadata: Metadata = {
  title: 'Confirm subscription | Jackpot Homie',
}

export default function NewsletterConfirmPage() {
  return <NewsletterConfirmClient />
}
