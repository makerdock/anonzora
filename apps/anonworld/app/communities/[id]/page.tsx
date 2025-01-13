import { Metadata } from 'next'
import { AnonWorldSDK } from '@anonworld/sdk'
import { CommunityPage } from '@/components/community'

const sdk = new AnonWorldSDK(process.env.NEXT_PUBLIC_API_URL)

export async function generateMetadata({
  params,
}: { params: { id: string } }): Promise<Metadata> {
  const community = await sdk.getCommunity(params.id)
  const title = `${community.data?.name} | anon.world`
  const description = community.data?.description

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`https://anon.world/communities/${params.id}/opengraph-image`],
    },
    other: {
      ['fc:frame']: JSON.stringify({
        version: 'next',
        imageUrl: `https://anon.world/communities/${params.id}/frame-image`,
        button: {
          title: 'View Community',
          action: {
            type: 'launch_frame',
            name: 'anon.world',
            url: `https://anon.world/communities/${params.id}`,
            splashImageUrl: 'https://anon.world/logo-background.png',
            splashBackgroundColor: '#000000',
          },
        },
      }),
    },
  }
}

export default async function Page({ params }: { params: { id: string } }) {
  return <CommunityPage id={params.id} />
}
