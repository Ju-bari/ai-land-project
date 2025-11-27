import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { Player } from '../phaser/Player'
import { useUserAuth } from '@/domains/user'

interface PhaserMapProps {
  landImage?: string
  useTilemap?: boolean
  tilemapJsonPath?: string
  tilesetImagePath?: string
  tilesetName?: string
}

export function PhaserMap({
  landImage,
  useTilemap = false,
  tilemapJsonPath = '/maps/map1.tmj',
  tilesetImagePath = '/maps/Serene_Village_32x32.png',
  tilesetName = 'first-tileset'
}: PhaserMapProps) {
  const { user } = useUserAuth()
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!gameRef.current) return

    // 초기 줌 레벨 상수
    const INITIAL_ZOOM = 2

    // Phaser 게임 설정
    class MapScene extends Phaser.Scene {
      private backgroundImage?: Phaser.GameObjects.Image
      private map?: Phaser.Tilemaps.Tilemap
      private mapWidth: number = 0
      private mapHeight: number = 0
      private player: Player

      constructor() {
        super({ key: 'MapScene' })
        this.player = new Player(this)
      }

      preload() {
        if (useTilemap) {
          // 타일맵 로드
          this.load.tilemapTiledJSON('map', tilemapJsonPath)
          this.load.image('tileset', tilesetImagePath)

          // 플레이어 리소스 로드
          this.player.preload()
        } else if (landImage) {
          // 배경 이미지 로드
          this.load.image('landBackground', landImage)
        }
      }

      create() {
        // 캔버스 크기 가져오기
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        if (useTilemap) {
          // 타일맵 생성
          this.map = this.make.tilemap({ key: 'map' })
          const tileset = this.map.addTilesetImage(tilesetName, 'tileset')

          if (tileset) {
            // 모든 레이어를 순서대로 렌더링 (아래에서 위로)
            this.map.layers.forEach((layerData) => {
              this.map!.createLayer(layerData.name, tileset, 0, 0)
            })

            // 맵 크기 계산
            this.mapWidth = this.map.widthInPixels
            this.mapHeight = this.map.heightInPixels

            // 카메라 바운드 제거 (맵이 항상 중앙에 오도록)
            this.cameras.main.removeBounds()

            // 초기 줌 레벨 설정
            this.cameras.main.setZoom(INITIAL_ZOOM)

            // 플레이어 생성 (맵 중앙에 배치)
            const playerX = this.mapWidth / 2
            const playerY = this.mapHeight / 2
            this.player.create(playerX, playerY, this.mapWidth, this.mapHeight)

            // 사용자 이름 설정
            if (user?.nickname || user?.username) {
              this.player.setProfile(user.nickname || user.username)
            }

            // 카메라가 플레이어를 따라가도록 설정
            if (this.player.sprite) {
              this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
            }
          }
        } else if (landImage) {
          // 배경 이미지 추가 (중앙 정렬)
          this.backgroundImage = this.add.image(width / 2, height / 2, 'landBackground')

          // 배경 이미지를 화면에 맞게 스케일 조정
          const scaleX = width / (this.backgroundImage.width || 1)
          const scaleY = height / (this.backgroundImage.height || 1)
          const scale = Math.max(scaleX, scaleY)
          this.backgroundImage.setScale(scale)

          // 카메라 설정 (줌 및 팬 가능하도록)
          this.cameras.main.setBounds(0, 0, width, height)
        }

        // 마우스 휠로 줌 인/아웃 (맵 중앙 기준)
        this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
          if (!useTilemap || !this.map) return

          const camera = this.cameras.main
          const zoomAmount = deltaY > 0 ? 0.9 : 1.1
          const newZoom = Phaser.Math.Clamp(camera.zoom * zoomAmount, 0.5, 3)

          // 줌 적용
          camera.setZoom(newZoom)
        })

        // 드래그로 맵 이동 (타일맵 모드에서는 플레이어가 카메라를 제어하므로 비활성화)
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

        // 화면 크기 변경 대응
        this.scale.on('resize', this.resize, this)
      }

      update() {
        // 플레이어 업데이트
        this.player.update()
      }

      resize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width
        const height = gameSize.height

        this.cameras.main.setSize(width, height)

        if (useTilemap && this.map) {
          // 타일맵의 경우 맵 중앙을 화면 중앙에 유지
          this.cameras.main.centerOn(this.mapWidth / 2, this.mapHeight / 2)
        } else if (this.backgroundImage) {
          // 배경 이미지의 경우
          this.backgroundImage.setPosition(width / 2, height / 2)
          const scaleX = width / (this.backgroundImage.width || 1)
          const scaleY = height / (this.backgroundImage.height || 1)
          const scale = Math.max(scaleX, scaleY)
          this.backgroundImage.setScale(scale)
        }
      }
    }

    // Phaser 게임 설정
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: gameRef.current.clientWidth,
      height: gameRef.current.clientHeight,
      scene: [MapScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 }, // 중력 없음 (탑다운 뷰)
          debug: false // 디버그 모드 (필요시 true로 변경)
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        pixelArt: true, // 픽셀 아트 모드 (안티엘리어싱 제거)
        antialias: false, // 안티엘리어싱 비활성화
        roundPixels: true // 픽셀을 정수 위치로 반올림
      },
      backgroundColor: '#1e293b', // slate-950 배경색
      transparent: false,
    }

    // Phaser 게임 인스턴스 생성
    phaserGameRef.current = new Phaser.Game(config)

    // 클린업
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true)
        phaserGameRef.current = null
      }
    }
  }, [landImage, useTilemap, tilemapJsonPath, tilesetImagePath, tilesetName, user])

  return (
    <div className="relative w-full h-full">
      <div
        ref={gameRef}
        className="w-full h-full"
        style={{ touchAction: 'none', outline: 'none' }} // 모바일에서 스크롤 방지, 포커스 아웃라인 제거
        tabIndex={0} // 키보드 포커스 가능하도록 설정
        autoFocus
      />

      {/* UI Overlay Removed */}
    </div>
  )
}

