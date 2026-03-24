import { invoke } from '@tauri-apps/api/core'
import { LogicalPosition } from '@tauri-apps/api/dpi'
import { Submenu } from '@tauri-apps/api/menu/submenu'
import { Image as TauriImage } from '@tauri-apps/api/image'
import { writeImage } from '@tauri-apps/plugin-clipboard-manager'
import { fetch } from '@tauri-apps/plugin-http'
import { useToaster } from 'rsuite'
import { MouseEvent, ReactElement, useCallback } from 'react'
import { useIntl } from 'react-intl'
import alert from 'src/components/utils/alert'

type Props = {
  imageUrl: string
  children: ReactElement
}

const blobToUint8Array = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer())

const copyImageToClipboard = async (imageUrl: string) => {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }

  const sourceBlob = new Blob([await response.arrayBuffer()], {
    type: response.headers.get('content-type') ?? 'application/octet-stream',
  })
  const imageBitmap = await createImageBitmap(sourceBlob)
  const canvas = document.createElement('canvas')
  canvas.width = imageBitmap.width
  canvas.height = imageBitmap.height
  const context = canvas.getContext('2d')
  if (!context) {
    imageBitmap.close()
    throw new Error('Failed to create image canvas')
  }

  try {
    context.drawImage(imageBitmap, 0, 0)
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob)
          return
        }
        reject(new Error('Failed to encode image as PNG'))
      }, 'image/png')
    })
    const tauriImage = await TauriImage.fromBytes(await blobToUint8Array(pngBlob))
    try {
      await writeImage(tauriImage)
    } finally {
      await tauriImage.close()
    }
  } finally {
    imageBitmap.close()
  }
}

const ImageContextMenu: React.FC<Props> = ({ imageUrl, children }) => {
  const { formatMessage } = useIntl()
  const toaster = useToaster()

  const downloadImage = useCallback(async () => {
    try {
      await invoke('download_media', { mediaUrl: imageUrl })
    } catch (err) {
      console.error(err)
      toaster.push(alert('error', formatMessage({ id: 'alert.failed_download_image' })), { placement: 'topStart' })
    }
  }, [formatMessage, imageUrl, toaster])

  const copyImage = useCallback(async () => {
    try {
      await copyImageToClipboard(imageUrl)
    } catch (err) {
      console.error(err)
      toaster.push(alert('error', formatMessage({ id: 'alert.failed_copy_image' })), { placement: 'topStart' })
    }
  }, [formatMessage, imageUrl, toaster])

  const openNativeMenu = useCallback(
    async (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const menu = await Submenu.new({
        text: 'Image',
        items: [
          {
            id: 'download-image',
            text: formatMessage({ id: 'media.menu.download_image' }),
            action: () => {
              void downloadImage()
            },
          },
          {
            id: 'copy-image',
            text: formatMessage({ id: 'media.menu.copy_image' }),
            action: () => {
              void copyImage()
            },
          },
        ],
      })

      try {
        await menu.popup(new LogicalPosition(event.clientX, event.clientY))
      } finally {
        await menu.close()
      }
    },
    [copyImage, downloadImage, formatMessage]
  )

  return (
    <div onContextMenu={openNativeMenu} style={{ height: '100%', width: '100%' }}>
      {children}
    </div>
  )
}

export default ImageContextMenu
