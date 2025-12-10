import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { Player } from '../phaser/Player'
import { OtherPlayer } from '../phaser/OtherPlayer'
import { useUserAuth } from '@/domains/user'
import type { OnlinePlayer } from '../types/player.types'
import { INITIAL_SPAWN_POSITION } from '../constants/mapConfig'

interface PhaserMapProps {
  landImage?: string
  useTilemap?: boolean
  tilemapJsonPath?: string
  tilesetImagePath?: string
  tilesetName?: string
  onPositionUpdate?: (x: number, y: number, direction: 'U' | 'D' | 'L' | 'R') => void
  onlinePlayers?: OnlinePlayer[]
}

export function PhaserMap({
  landImage,
  useTilemap = false,
  tilemapJsonPath = '/maps/map1.tmj',
  tilesetImagePath = '/maps/Serene_Village_32x32.png',
  tilesetName = 'first-tileset',
  onPositionUpdate,
  onlinePlayers = []
}: PhaserMapProps) {
  const { user } = useUserAuth()
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<Phaser.Scene | null>(null)

  useEffect(() => {
    if (!gameRef.current) return

    const INITIAL_ZOOM = 2

    class MapScene extends Phaser.Scene {
      private backgroundImage?: Phaser.GameObjects.Image
      private map?: Phaser.Tilemaps.Tilemap
      public mapWidth: number = 0
      public mapHeight: number = 0
      private player: Player
      public otherPlayers: Map<number, OtherPlayer> = new Map()

      constructor() {
        super({ key: 'MapScene' })
        this.player = new Player(this, onPositionUpdate)
      }

      preload() {
        if (useTilemap) {
          this.load.tilemapTiledJSON('map', tilemapJsonPath)
          this.load.image('tileset', tilesetImagePath)
          this.player.preload()
        } else if (landImage) {
          this.load.image('landBackground', landImage)
        }
      }

      create() {
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        if (useTilemap) {
          this.map = this.make.tilemap({ key: 'map' })
          const tileset = this.map.addTilesetImage(tilesetName, 'tileset')

          if (tileset) {
            this.map.layers.forEach((layerData) => {
              this.map!.createLayer(layerData.name, tileset, 0, 0)
            })

            this.mapWidth = this.map.widthInPixels
            this.mapHeight = this.map.heightInPixels

            this.cameras.main.removeBounds()
            this.cameras.main.setZoom(INITIAL_ZOOM)

            this.player.create(INITIAL_SPAWN_POSITION.x, INITIAL_SPAWN_POSITION.y, this.mapWidth, this.mapHeight)

            if (user?.nickname || user?.username) {
              this.player.setProfile(user.nickname || user.username)
            }

            if (this.player.sprite) {
              this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
            }
          }
        } else if (landImage) {
          this.backgroundImage = this.add.image(width / 2, height / 2, 'landBackground')

          const scaleX = width / (this.backgroundImage.width || 1)
          const scaleY = height / (this.backgroundImage.height || 1)
          const scale = Math.max(scaleX, scaleY)
          this.backgroundImage.setScale(scale)

          this.cameras.main.setBounds(0, 0, width, height)
        }

        this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
          if (!useTilemap || !this.map) return

          const camera = this.cameras.main
          const zoomAmount = deltaY > 0 ? 0.9 : 1.1
          const newZoom = Phaser.Math.Clamp(camera.zoom * zoomAmount, 0.5, 3)

          camera.setZoom(newZoom)
        })

        if (!useTilemap) {
          let isDragging = false
          let dragStartX = 0
          let dragStartY = 0

          this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            isDragging = true
            dragStartX = pointer.x
            dragStartY = pointer.y
          })

          this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (isDragging) {
              const camera = this.cameras.main
              const deltaX = (pointer.x - dragStartX) / camera.zoom
              const deltaY = (pointer.y - dragStartY) / camera.zoom
              camera.scrollX -= deltaX
              camera.scrollY -= deltaY
              dragStartX = pointer.x
              dragStartY = pointer.y
            }
          })

          this.input.on('pointerup', () => {
            isDragging = false
          })
        }

        this.scale.on('resize', this.resize, this)
      }

      update() {
        this.player.update()

        this.otherPlayers.forEach((otherPlayer) => {
          otherPlayer.update()
        })
      }

      resize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width
        const height = gameSize.height

        this.cameras.main.setSize(width, height)

        if (useTilemap && this.map) {
          this.cameras.main.centerOn(this.mapWidth / 2, this.mapHeight / 2)
        } else if (this.backgroundImage) {
          this.backgroundImage.setPosition(width / 2, height / 2)
          const scaleX = width / (this.backgroundImage.width || 1)
          const scaleY = height / (this.backgroundImage.height || 1)
          const scale = Math.max(scaleX, scaleY)
          this.backgroundImage.setScale(scale)
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: gameRef.current.clientWidth,
      height: gameRef.current.clientHeight,
      scene: [MapScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
      },
      backgroundColor: '#1e293b',
      transparent: false,
    }

    phaserGameRef.current = new Phaser.Game(config)

    const timeoutId = setTimeout(() => {
      const scene = phaserGameRef.current?.scene.getScene('MapScene') as MapScene
      if (scene) {
        sceneRef.current = scene
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true)
        phaserGameRef.current = null
      }
      sceneRef.current = null
    }
  }, [landImage, useTilemap, tilemapJsonPath, tilesetImagePath, tilesetName, user])

  // 다른 플레이어 업데이트
  useEffect(() => {
    if (!sceneRef.current) return

    const scene = sceneRef.current as any
    if (!scene.otherPlayers) return

    const currentUserId = user?.id
    if (!currentUserId) return

    // 현재 존재하는 다른 플레이어들의 ID 목록
    const otherPlayersList = onlinePlayers.filter(p => p.id !== currentUserId)
    const onlinePlayerIds = new Set(otherPlayersList.map(p => p.id))

    // 더 이상 없는 플레이어 제거
    scene.otherPlayers.forEach((otherPlayer: OtherPlayer, playerId: number) => {
      if (!onlinePlayerIds.has(playerId)) {
        otherPlayer.destroy()
        scene.otherPlayers.delete(playerId)
      }
    })

    // 새로운 플레이어 추가 및 기존 플레이어 업데이트
    otherPlayersList.forEach((player) => {
      const existingPlayer = scene.otherPlayers.get(player.id)

      if (existingPlayer) {
        // 기존 플레이어 위치 업데이트
        if (player.position) {
          existingPlayer.updatePosition(
            player.position.x,
            player.position.y,
            player.position.direction
          )
        }
      } else {
        // 새로운 플레이어 생성
        const displayName = player.name && typeof player.name === 'string'
          ? player.name
          : `Player ${player.id}`

        const otherPlayer = new OtherPlayer(scene, player.id, displayName)

        const x = player.position?.x ?? INITIAL_SPAWN_POSITION.x
        const y = player.position?.y ?? INITIAL_SPAWN_POSITION.y

        otherPlayer.create(x, y)
        scene.otherPlayers.set(player.id, otherPlayer)
      }
    })
  }, [onlinePlayers, user?.id])

  return (
    <div className="relative w-full h-full">
      <div
        ref={gameRef}
        className="w-full h-full"
        style={{ touchAction: 'none', outline: 'none' }}
        tabIndex={0}
        autoFocus
      />
    </div>
  )
}
