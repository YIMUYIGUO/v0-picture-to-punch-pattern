"use client"

import type React from "react"
import { useState } from "react"
import { Share2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface ShareDialogProps {
  patternData: {
    imageUrl?: string
    originalImageUrl?: string
    thumbnailUrl?: string
    panelWidth: number
    panelHeight: number
    holeDiameter: number
    holeSpacing: number
    conversionMode: string
    parameters: any
  }
  previewCanvasRef?: {
    current: {
      generatePreviewImage?: () => Promise<string>
    }
  }
  trigger?: React.ReactNode
}

export function ShareDialog({ patternData, previewCanvasRef, trigger }: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const [sharedUrl, setSharedUrl] = useState("")
  const [copied, setCopied] = useState(false)

  const { data: session } = useSession()

  const uploadBlobToStorage = async (blobUrl: string): Promise<string> => {
    try {
      console.log("[v0] Starting blob to storage upload process...")

      const response = await fetch(blobUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`)
      }

      const blob = await response.blob()
      console.log("[v0] Blob fetched, size:", blob.size, "type:", blob.type)

      const file = new File([blob], "pattern-preview.png", { type: "image/png" })
      const formData = new FormData()
      formData.append("file", file)

      console.log("[v0] Uploading to storage...")
      const uploadResponse = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error("[v0] Storage upload failed:", errorText)
        throw new Error(`Failed to upload image to storage: ${uploadResponse.statusText}`)
      }

      const uploadResult = await uploadResponse.json()
      console.log("[v0] Storage upload successful:", uploadResult)

      if (!uploadResult.url) {
        throw new Error("Invalid upload response from storage")
      }

      return uploadResult.url
    } catch (error) {
      console.error("[v0] Failed to upload blob to storage:", error)
      throw error
    }
  }

  const handleShare = async () => {
    if (!title.trim()) {
      toast.error("请输入作品标题")
      return
    }

    if (!session?.user) {
      toast.error("分享作品需要登录", {
        description: "登录后可以分享您的作品到广场，让更多人看到您的创意",
        duration: 5000,
        action: {
          label: "立即登录",
          onClick: () => {
            window.location.href = "/auth/login"
          },
        },
      })
      return
    }

    setIsSharing(true)
    try {
      let imageUrl = patternData.thumbnailUrl || patternData.imageUrl
      if (!imageUrl && previewCanvasRef?.current?.generatePreviewImage) {
        try {
          imageUrl = await previewCanvasRef.current.generatePreviewImage()
          console.log("[v0] Generated preview image for sharing:", imageUrl)
        } catch (error) {
          console.error("Failed to generate preview image:", error)
          toast.error("生成预览图片失败")
          setIsSharing(false)
          return
        }
      }

      if (imageUrl && (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:"))) {
        try {
          console.log("[v0] Converting temporary URL to permanent storage...")
          toast.info("正在上传图片到云存储...")
          imageUrl = await uploadBlobToStorage(imageUrl)
          console.log("[v0] Image uploaded to storage:", imageUrl)
          toast.success("图片上传成功")
        } catch (error) {
          console.error("Failed to upload image to storage:", error)
          toast.error("图片上传失败，请重试")
          setIsSharing(false)
          return
        }
      }

      // 通过 API 创建分享记录
      const response = await fetch("/api/gallery/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          imageUrl,
          originalImageUrl: patternData.originalImageUrl,
          panelWidth: patternData.panelWidth,
          panelHeight: patternData.panelHeight,
          holeDiameter: patternData.holeDiameter,
          holeSpacing: patternData.holeSpacing,
          conversionMode: patternData.conversionMode,
          patternData: patternData.parameters,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to share pattern")
      }

      const data = await response.json()
      const url = `${window.location.origin}/gallery/${data.id}`
      setSharedUrl(url)
      toast.success("作品提交成功！等待管理员审核后将在广场显示")
    } catch (error) {
      console.error("分享失败:", error)
      toast.error("分享失败，请重试")
    } finally {
      setIsSharing(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sharedUrl)
      setCopied(true)
      toast.success("链接已复制到剪贴板")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("复制失败")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            分享作品
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分享你的冲孔图案</DialogTitle>
          <DialogDescription>将你的作品分享到广场，让更多人看到你的创意</DialogDescription>
        </DialogHeader>

        {!sharedUrl ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">作品标题 *</Label>
              <Input
                id="title"
                placeholder="给你的作品起个名字..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">作品描述</Label>
              <Textarea
                id="description"
                placeholder="介绍一下你的设计理念..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="text-sm text-blue-800 mb-1">📋 审核说明</div>
              <div className="text-xs text-blue-700">
                作品提交后需要管理员审核,审核通过后将在作品广场显示。我们会尽快处理您的申请。
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">预览信息：</div>
              <div className="text-xs space-y-1">
                <div>
                  面板尺寸: {patternData.panelWidth} × {patternData.panelHeight} mm
                </div>
                <div>孔径: {patternData.holeDiameter} mm</div>
                <div>孔距: {patternData.holeSpacing} mm</div>
                <div>转换模式: {patternData.conversionMode}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg">提交成功！</h3>
              <p className="text-muted-foreground text-sm">你的作品已提交审核，审核通过后将在广场显示</p>
            </div>
            <div className="space-y-2">
              <Label>作品链接</Label>
              <div className="flex space-x-2">
                <Input value={sharedUrl} readOnly />
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="shrink-0 bg-transparent">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!sharedUrl ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={handleShare} disabled={isSharing}>
                {isSharing ? "分享中..." : "分享作品"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setOpen(false)} className="w-full">
              完成
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
