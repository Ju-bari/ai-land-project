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
  onPositionUpdate?: (x: number, y: number, direction: 'U' | 'D' | 'L' | 'R') => void  // 위치 업데이트 콜백
  onlinePlayers?: OnlinePlayer[]  // 다른 플레이어 목록
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

    // 초기 줌 레벨 상수
    const INITIAL_ZOOM = 2

    // Phaser 게임 설정
    class MapScene extends Phaser.Scene {
      private backgroundImage?: Phaser.GameObjects.Image
      private map?: Phaser.Tilemaps.Tilemap
      public mapWidth: number = 0  // public으로 변경
      public mapHeight: number = 0  // public으로 변경
      private player: Player
      public otherPlayers: Map<number, OtherPlayer> = new Map()  // 다른 플레이어들

      constructor() {
        super({ key: 'MapScene' })
        this.player = new Player(this, onPositionUpdate)  // onPositionUpdate 콜백 전달
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
            this.player.create(INITIAL_SPAWN_POSITION.x, INITIAL_SPAWN_POSITION.y, this.mapWidth, this.mapHeight)

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

        // 다른 플레이어들 업데이트
        this.otherPlayers.forEach((otherPlayer) => {
          otherPlayer.update()
        })
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

    // Scene 참조를 약간의 지연 후에 설정 (create가 완료될 때까지)
    const timeoutId = setTimeout(() => {
      const scene = phaserGameRef.current?.scene.getScene('MapScene') as MapScene
      if (scene) {
        console.log('🎮 Scene 참조 설정 완료:', {
          mapWidth: scene.mapWidth,
          mapHeight: scene.mapHeight,
          otherPlayers: scene.otherPlayers.size
        })
        sceneRef.current = scene
      } else {
        console.warn('⚠️ Scene을 찾을 수 없습니다')
      }
    }, 100)

    // 클린업
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
    console.log('👥 useEffect 실행 - onlinePlayers:', onlinePlayers.length, '명')
    console.log('👥 sceneRef.current:', !!sceneRef.current)
    console.log('👥 user?.id:', user?.id)
    
    if (!sceneRef.current) {
      console.warn('⚠️ sceneRef.current가 없습니다')
      return
    }
    
    const scene = sceneRef.current as any
    if (!scene.otherPlayers) {
      console.warn('⚠️ scene.otherPlayers가 없습니다')
      return
    }

    const currentUserId = user?.id
    if (!currentUserId) {
      console.warn('⚠️ currentUserId가 없습니다')
      return
    }

    console.log('🔄 온라인 플레이어 업데이트:', {
      total: onlinePlayers.length,
      currentUserId,
      players: onlinePlayers.map(p => ({ id: p.id, name: p.name, position: p.position }))
    })

    // 현재 존재하는 다른 플레이어들의 ID 목록
    const otherPlayersList = onlinePlayers.filter(p => p.id !== currentUserId)
    console.log('👥 다른 플레이어 목록 (본인 제외):', otherPlayersList.length, '명')
    
    const onlinePlayerIds = new Set(otherPlayersList.map(p => p.id))

    // 더 이상 없는 플레이어 제거
    scene.otherPlayers.forEach((otherPlayer: OtherPlayer, playerId: number) => {
      if (!onlinePlayerIds.has(playerId)) {
        console.log('👋 플레이어 제거:', playerId)
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
          console.log('📍 플레이어 위치 업데이트:', {
            id: player.id,
            name: player.name,
            position: player.position
          })
          existingPlayer.updatePosition(
            player.position.x,
            player.position.y,
            player.position.direction
          )
        }
      } else {
        // 새로운 플레이어 생성
        console.log('👤 새 플레이어 생성 시도:', {
          id: player.id,
          name: player.name,
          nameType: typeof player.name,
          nameValue: player.name,
          position: player.position,
          mapWidth: scene.mapWidth,
          mapHeight: scene.mapHeight
        })
        
        // name이 없거나 숫자이면 기본 이름 사용
        const displayName = player.name && typeof player.name === 'string' 
          ? player.name 
          : `Player ${player.id}`
        
        console.log('👤 표시할 이름:', displayName)
        const otherPlayer = new OtherPlayer(scene, player.id, displayName)
        
        // 위치 정보가 있으면 해당 위치에, 없으면 초기 스폰 위치에 생성
        const x = player.position?.x ?? INITIAL_SPAWN_POSITION.x
        const y = player.position?.y ?? INITIAL_SPAWN_POSITION.y
        
        console.log('👤 플레이어 생성 위치:', { x, y })
        otherPlayer.create(x, y)
        scene.otherPlayers.set(player.id, otherPlayer)
        console.log('✅ 플레이어 생성 완료:', player.id, player.name)
      }
    })
    
    console.log('📊 현재 표시 중인 다른 플레이어:', scene.otherPlayers.size, '명')
  }, [onlinePlayers, user?.id])

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

