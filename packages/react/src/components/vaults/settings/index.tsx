import {
  Adapt,
  Button,
  Dialog,
  Image,
  Input,
  Spinner,
  Sheet,
  Text,
  Unspaced,
  View,
  YStack,
  XStack,
} from '@anonworld/ui'
import { ReactNode, useRef, useEffect, useState } from 'react'
import { formatHexId, Vault } from '@anonworld/common'
import { VaultAvatar } from '../avatar'
import { X } from '../../svg/x'
import { useUploadImage } from '../../../hooks/use-upload-image'
import { Pencil, X as XIcon } from '@tamagui/lucide-icons'
import { useMutation } from '@tanstack/react-query'
import { useSDK } from '../../../providers'
import { useVaults } from '../../../hooks/use-vaults'
import { useVault } from '../../../hooks'

export function VaultSettings({
  vault,
  children,
}: {
  vault: Vault
  children?: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(vault.image_url)
  const [username, setUsername] = useState<string | null>(vault.username)
  const { sdk } = useSDK()
  const { refetch: refetchVaults } = useVaults()
  const { refetch: refetchVault } = useVault(vault.id)
  const { mutate, isPending, error } = useMutation({
    mutationFn: async (args: { imageUrl: string | null; username: string | null }) => {
      const res = await sdk.updateVaultSettings(vault.id, args)
      if (!res.data?.success) {
        throw new Error(res.data?.error ?? 'Failed to update vault settings')
      }
      return res
    },
    onSuccess: () => {
      refetchVaults()
      refetchVault()
    },
  })

  return (
    <Dialog modal open={isOpen} onOpenChange={setIsOpen}>
      {children}

      <Adapt when="sm">
        <Sheet
          animation="quicker"
          zIndex={200000}
          modal
          dismissOnSnapToBottom
          snapPointsMode="fit"
        >
          {isOpen && (
            <Sheet.Frame padding="$3" pb="$5" gap="$3" bg="$color2">
              <Adapt.Contents />
            </Sheet.Frame>
          )}
          <Sheet.Overlay
            animation="quicker"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quicker"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quicker',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          w={600}
        >
          <Dialog.Title fos="$5">Edit Profile</Dialog.Title>
          <EditImage vault={vault} imageUrl={imageUrl} setImageUrl={setImageUrl} />
          <EditUsername vault={vault} username={username} setUsername={setUsername} />
          <YStack gap="$2">
            {error && (
              <Text color="$red11" fos="$1" textAlign="center" mt="$-2">
                Username already taken
              </Text>
            )}
            <Button
              bg="$color12"
              br="$4"
              disabledStyle={{ opacity: 0.5, bg: '$color12' }}
              hoverStyle={{ opacity: 0.9, bg: '$color12' }}
              pressStyle={{ opacity: 0.9, bg: '$color12' }}
              onPress={() => {
                mutate({ imageUrl, username })
              }}
              disabled={isPending}
            >
              {!isPending ? (
                <Text fos="$3" fow="600" color="$color1">
                  Save
                </Text>
              ) : (
                <XStack gap="$2" alignItems="center">
                  <Spinner color="$color1" />
                  <Text fos="$2" fow="600" color="$color1">
                    Saving
                  </Text>
                </XStack>
              )}
            </Button>
          </YStack>
          <Unspaced>
            <Dialog.Close asChild>
              <View
                bg="$background"
                p="$2"
                br="$12"
                hoverStyle={{ bg: '$color5' }}
                cursor="pointer"
                pos="absolute"
                top="$3"
                right="$3"
              >
                <X size={20} />
              </View>
            </Dialog.Close>
          </Unspaced>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

function EditImage({
  vault,
  imageUrl,
  setImageUrl,
}: {
  vault: Vault
  imageUrl: string | null
  setImageUrl: (imageUrl: string | null) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { data, isLoading } = useUploadImage(selectedFile)

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      return
    }

    setSelectedFile(file)
  }

  useEffect(() => {
    if (data) {
      setImageUrl(data)
    }
  }, [data])

  return (
    <YStack gap="$2">
      <Text fos="$1" fow="400" color="$color11" textTransform="uppercase">
        Profile Image
      </Text>
      <View position="relative" cursor="pointer" w="$8" h="$8" br="$12">
        <input
          ref={fileInputRef}
          type="file"
          multiple={false}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />
        <View
          onPress={(e) => {
            if (isLoading) return
            fileInputRef.current?.click()
          }}
        >
          {isLoading ? (
            <View
              w="$8"
              h="$8"
              br="$12"
              bc="$borderColor"
              bw="$0.5"
              ai="center"
              jc="center"
            >
              <Spinner color="$color12" />
            </View>
          ) : imageUrl ? (
            <Image src={imageUrl} w="$8" h="$8" br="$12" />
          ) : (
            <VaultAvatar vaultId={vault.id} imageUrl={imageUrl} size="$8" />
          )}
        </View>
        <View
          bg="$color3"
          pos="absolute"
          p="$1.5"
          br="$12"
          ai="center"
          jc="center"
          bottom="$-1"
          right="$-1"
          bw="$0.5"
          bc="$color7"
        >
          <Pencil color="$color11" size={12} strokeWidth={2.25} />
        </View>
        {imageUrl && (
          <View
            bg="$red3"
            pos="absolute"
            p="$1.5"
            br="$12"
            ai="center"
            jc="center"
            top="$-1"
            right="$-1"
            bw="$0.5"
            bc="$red7"
            onPress={(e) => {
              setImageUrl(null)
            }}
          >
            <XIcon color="$red11" size={12} strokeWidth={2.25} />
          </View>
        )}
      </View>
    </YStack>
  )
}

function EditUsername({
  vault,
  username,
  setUsername,
}: {
  vault: Vault
  username: string | null
  setUsername: (username: string | null) => void
}) {
  return (
    <YStack gap="$2">
      <Text fos="$1" fow="400" color="$color11" textTransform="uppercase">
        Display Name
      </Text>
      <Input
        value={username ?? ''}
        onChangeText={setUsername}
        placeholder={formatHexId(vault.id)}
      />
    </YStack>
  )
}
