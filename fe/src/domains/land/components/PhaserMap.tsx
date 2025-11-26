import { useEffect, useRef } from 'react'
import Phaser from 'phaser'

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
      private player?: Phaser.Physics.Arcade.Sprite
      private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
      private playerSpeed: number = 150 // 플레이어 이동 속도 (픽셀/초)
      private lastDirection: string = 'down' // 마지막 방향 저장
      private lastPressedKey: string = '' // 마지막으로 눌린 키 추적

      constructor() {
        super({ key: 'MapScene' })
      }

      preload() {
        if (useTilemap) {
          // 타일맵 로드
          this.load.tilemapTiledJSON('map', tilemapJsonPath)
          this.load.image('tileset', tilesetImagePath)
          
          // 플레이어 스프라이트시트 로드
          // 이미지: 48x72 픽셀 (4열 x 4행 = 16프레임)
          this.load.spritesheet('player', '/players/player1.png', {
            frameWidth: 12,  // 48 / 4 = 12
            frameHeight: 18  // 72 / 4 = 18
          })
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
            
            // Physics 활성화된 플레이어 스프라이트 생성
            this.player = this.physics.add.sprite(playerX, playerY, 'player')
            this.player.setCollideWorldBounds(true)
            
            // 캐릭터 크기 조정 (12x18 → 32x32)
            // 32 / 12 ≈ 2.67배 확대
            this.player.setScale(2.67)
            
            // 부드러운 움직임을 위한 물리 설정
            this.player.setDrag(800)
            this.player.setMaxVelocity(this.playerSpeed, this.playerSpeed)
            
            // Physics 월드 바운드 설정 (플레이어가 맵 밖으로 나가지 못하도록)
            this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight)
            
            // 플레이어 애니메이션 생성
            // 아래 방향 (1줄, 프레임 0-3)
            this.anims.create({
              key: 'walk-down',
              frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
              frameRate: 6, // 속도에 맞춰 조정 (느린 애니메이션)
              repeat: -1
            })
            
            // 좌 방향 (2줄, 프레임 4-7)
            this.anims.create({
              key: 'walk-left',
              frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
              frameRate: 6,
              repeat: -1
            })
            
            // 우 방향 (3줄, 프레임 8-11)
            this.anims.create({
              key: 'walk-right',
              frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
              frameRate: 6,
              repeat: -1
            })
            
            // 위 방향 (4줄, 프레임 12-15)
            this.anims.create({
              key: 'walk-up',
              frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
              frameRate: 6,
              repeat: -1
            })
            
            // 정지 애니메이션 (각 방향의 첫 프레임)
            this.anims.create({
              key: 'idle-down',
              frames: [{ key: 'player', frame: 0 }],
              frameRate: 1
            })
            
            this.anims.create({
              key: 'idle-left',
              frames: [{ key: 'player', frame: 4 }],
              frameRate: 1
            })
            
            this.anims.create({
              key: 'idle-right',
              frames: [{ key: 'player', frame: 8 }],
              frameRate: 1
            })
            
            this.anims.create({
              key: 'idle-up',
              frames: [{ key: 'player', frame: 12 }],
              frameRate: 1
            })
            
            // 기본 애니메이션 재생
            this.player.play('idle-down')
            
            // 카메라를 맵 중앙에 고정 (플레이어를 따라가지 않음)
            this.cameras.main.centerOn(this.mapWidth / 2, this.mapHeight / 2)
            
            // 화살표 키 입력 설정
            this.cursors = this.input.keyboard?.createCursorKeys()
            
            // 키 입력 이벤트 리스너 (마지막 입력 추적)
            if (this.cursors) {
              this.cursors.up.on('down', () => { this.lastPressedKey = 'up' })
              this.cursors.down.on('down', () => { this.lastPressedKey = 'down' })
              this.cursors.left.on('down', () => { this.lastPressedKey = 'left' })
              this.cursors.right.on('down', () => { this.lastPressedKey = 'right' })
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
          
          // 맵 중앙을 화면 중앙에 유지
          camera.centerOn(this.mapWidth / 2, this.mapHeight / 2)
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
        // 플레이어가 없으면 리턴
        if (!this.player || !this.cursors) return

        // 이동 벡터 초기화
        let velocityX = 0
        let velocityY = 0
        let isMoving = false

        // 마지막으로 눌린 키 기준으로 이동 (대각선 불가)
        if (this.lastPressedKey === 'up' && this.cursors.up.isDown) {
          velocityY = -this.playerSpeed
          isMoving = true
          this.lastDirection = 'up'
        } else if (this.lastPressedKey === 'down' && this.cursors.down.isDown) {
          velocityY = this.playerSpeed
          isMoving = true
          this.lastDirection = 'down'
        } else if (this.lastPressedKey === 'left' && this.cursors.left.isDown) {
          velocityX = -this.playerSpeed
          isMoving = true
          this.lastDirection = 'left'
        } else if (this.lastPressedKey === 'right' && this.cursors.right.isDown) {
          velocityX = this.playerSpeed
          isMoving = true
          this.lastDirection = 'right'
        }
        // 마지막 키가 떼어졌으면 다른 눌린 키 찾기
        else {
          if (this.cursors.up.isDown) {
            velocityY = -this.playerSpeed
            isMoving = true
            this.lastDirection = 'up'
            this.lastPressedKey = 'up'
          } else if (this.cursors.down.isDown) {
            velocityY = this.playerSpeed
            isMoving = true
            this.lastDirection = 'down'
            this.lastPressedKey = 'down'
          } else if (this.cursors.left.isDown) {
            velocityX = -this.playerSpeed
            isMoving = true
            this.lastDirection = 'left'
            this.lastPressedKey = 'left'
          } else if (this.cursors.right.isDown) {
            velocityX = this.playerSpeed
            isMoving = true
            this.lastDirection = 'right'
            this.lastPressedKey = 'right'
          } else {
            this.lastPressedKey = ''
          }
        }

        // 부드러운 가속/감속 적용
        if (isMoving) {
          // 이동 중: 목표 속도로 부드럽게 가속
          this.player.setAcceleration(velocityX * 10, velocityY * 10)
        } else {
          // 정지 중: 부드럽게 감속 (드래그로)
          this.player.setAcceleration(0, 0)
        }

        // 애니메이션 처리
        if (isMoving) {
          // 이동 중일 때 방향에 맞는 애니메이션 재생
          const currentAnim = `walk-${this.lastDirection}`
          if (this.player.anims.currentAnim?.key !== currentAnim) {
            this.player.play(currentAnim, true)
          }
        } else {
          // 정지 시 해당 방향의 idle 애니메이션
          const idleAnim = `idle-${this.lastDirection}`
          if (this.player.anims.currentAnim?.key !== idleAnim) {
            this.player.play(idleAnim, true)
          }
        }

        // Physics 바운드로 맵 경계를 처리하므로 수동 클램핑 불필요
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
  }, [landImage, useTilemap, tilemapJsonPath, tilesetImagePath, tilesetName])

  return (
    <div 
      ref={gameRef} 
      className="w-full h-full"
      style={{ touchAction: 'none', outline: 'none' }} // 모바일에서 스크롤 방지, 포커스 아웃라인 제거
      tabIndex={0} // 키보드 포커스 가능하도록 설정
      autoFocus
    />
  )
}

