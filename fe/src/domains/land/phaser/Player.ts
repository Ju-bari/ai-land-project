import Phaser from 'phaser'
import { roundCoordinate } from '@/utils'

export class Player {
  private scene: Phaser.Scene
  public sprite: Phaser.Physics.Arcade.Sprite | null = null
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys

  // 플레이어 설정
  private speed: number = 150
  private drag: number = 800
  private scale: number = 2.67
  private frameRate: number = 6

  // 상태
  private lastDirection: string = 'down'
  private lastPressedKey: string = ''

  // UI
  private nameTag?: Phaser.GameObjects.Text

  // 위치 업데이트 콜백
  private onPositionUpdate?: (x: number, y: number, direction: 'U' | 'D' | 'L' | 'R') => void
  private lastSentPosition: { x: number; y: number; direction: string } = { x: 0, y: 0, direction: 'down' }
  private updateThreshold: number = 5  // 픽셀 단위로 이 거리 이상 움직였을 때만 업데이트 전송
  private lastUpdateTime: number = 0
  private updateInterval: number = 100  // 100ms마다 한 번만 전송 (초당 10회)

  constructor(scene: Phaser.Scene, onPositionUpdate?: (x: number, y: number, direction: 'U' | 'D' | 'L' | 'R') => void) {
    this.scene = scene
    this.onPositionUpdate = onPositionUpdate
  }

  /**
   * 플레이어 리소스 로드
   */
  preload() {
    // 플레이어 스프라이트시트 로드
    // 이미지: 48x72 픽셀 (4열 x 4행 = 16프레임)
    this.scene.load.spritesheet('player', '/players/player1.png', {
      frameWidth: 12,  // 48 / 4 = 12
      frameHeight: 18  // 72 / 4 = 18
    })
  }

  /**
   * 플레이어 생성 및 초기화
   */
  create(x: number, y: number, mapWidth: number, mapHeight: number) {
    // Physics 활성화된 플레이어 스프라이트 생성
    this.sprite = this.scene.physics.add.sprite(x, y, 'player')
    this.sprite.setCollideWorldBounds(true)

    // 캐릭터 크기 조정 (12x18 → 32x48)
    this.sprite.setScale(this.scale)

    // 부드러운 움직임을 위한 물리 설정
    this.sprite.setDrag(this.drag)
    this.sprite.setMaxVelocity(this.speed, this.speed)

    // Physics 월드 바운드 설정 (플레이어가 맵 밖으로 나가지 못하도록)
    this.scene.physics.world.setBounds(0, 0, mapWidth, mapHeight)

    // 이름표 생성 - 부드러운 움직임을 위해 단순하게 렌더링
    this.nameTag = this.scene.add.text(x, y - 40, '', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    })
      .setOrigin(0.5)

    // 애니메이션 설정
    this.setupAnimations()

    // 화살표 키 입력 설정
    this.setupInput()

    // 기본 애니메이션 재생
    this.sprite.play('idle-down')
  }

  /**
   * 플레이어 프로필 설정
   */
  setProfile(name: string) {
    if (this.nameTag) {
      this.nameTag.setText(name)
    }
  }

  /**
   * 플레이어 애니메이션 설정
   */
  private setupAnimations() {
    const anims = this.scene.anims

    // 아래 방향 (1줄, 프레임 0-3)
    anims.create({
      key: 'walk-down',
      frames: anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: this.frameRate,
      repeat: -1
    })

    // 좌 방향 (2줄, 프레임 4-7)
    anims.create({
      key: 'walk-left',
      frames: anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: this.frameRate,
      repeat: -1
    })

    // 우 방향 (3줄, 프레임 8-11)
    anims.create({
      key: 'walk-right',
      frames: anims.generateFrameNumbers('player', { start: 8, end: 11 }),
      frameRate: this.frameRate,
      repeat: -1
    })

    // 위 방향 (4줄, 프레임 12-15)
    anims.create({
      key: 'walk-up',
      frames: anims.generateFrameNumbers('player', { start: 12, end: 15 }),
      frameRate: this.frameRate,
      repeat: -1
    })

    // 정지 애니메이션 (각 방향의 첫 프레임)
    anims.create({
      key: 'idle-down',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 1
    })

    anims.create({
      key: 'idle-left',
      frames: [{ key: 'player', frame: 4 }],
      frameRate: 1
    })

    anims.create({
      key: 'idle-right',
      frames: [{ key: 'player', frame: 8 }],
      frameRate: 1
    })

    anims.create({
      key: 'idle-up',
      frames: [{ key: 'player', frame: 12 }],
      frameRate: 1
    })
  }

  /**
   * 키보드 입력 설정
   */
  private setupInput() {
    this.cursors = this.scene.input.keyboard?.createCursorKeys()

    // 키 입력 이벤트 리스너 (마지막 입력 추적)
    if (this.cursors) {
      this.cursors.up.on('down', () => { this.lastPressedKey = 'up' })
      this.cursors.down.on('down', () => { this.lastPressedKey = 'down' })
      this.cursors.left.on('down', () => { this.lastPressedKey = 'left' })
      this.cursors.right.on('down', () => { this.lastPressedKey = 'right' })
    }
  }

  /**
   * 매 프레임 업데이트
   */
  update() {
    if (!this.sprite || !this.cursors) return

    this.handleMovement()
    this.handleAnimation()

    // 이름표 위치 업데이트
    if (this.nameTag) {
      this.nameTag.setPosition(this.sprite.x, this.sprite.y - 40)
    }

    // 위치 업데이트 전송 (throttle 적용)
    this.sendPositionUpdateIfNeeded()
  }

  /**
   * 위치 업데이트 전송 (일정 거리 이상 움직이고, 일정 시간이 지났을 때만)
   */
  private sendPositionUpdateIfNeeded() {
    if (!this.sprite || !this.onPositionUpdate) return

    const currentTime = Date.now()
    const currentX = this.sprite.x
    const currentY = this.sprite.y
    const currentDirection = this.lastDirection

    // 시간 체크: 마지막 전송 이후 updateInterval(100ms) 이상 경과했는지
    if (currentTime - this.lastUpdateTime < this.updateInterval) {
      return
    }

    // 거리 체크: 이전 위치와 일정 거리 이상 차이나는지
    const dx = currentX - this.lastSentPosition.x
    const dy = currentY - this.lastSentPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 방향이 바뀌었거나, 일정 거리 이상 움직였을 때만 전송
    if (distance >= this.updateThreshold || currentDirection !== this.lastSentPosition.direction) {
      // 방향 변환: down -> D, up -> U, left -> L, right -> R
      const directionMap: { [key: string]: 'U' | 'D' | 'L' | 'R' } = {
        down: 'D',
        up: 'U',
        left: 'L',
        right: 'R'
      }
      const direction = directionMap[currentDirection] || 'D'

      // 좌표를 소수점 둘째자리로 반올림하여 전송
      const roundedX = roundCoordinate(currentX, 2)
      const roundedY = roundCoordinate(currentY, 2)

      // 위치 업데이트 전송
      this.onPositionUpdate(roundedX, roundedY, direction)

      // 마지막 전송 정보 업데이트
      this.lastSentPosition = { x: currentX, y: currentY, direction: currentDirection }
      this.lastUpdateTime = currentTime
    }
  }

  /**
   * 플레이어 움직임 처리
   */
  private handleMovement() {
    if (!this.sprite || !this.cursors) return

    let velocityX = 0
    let velocityY = 0
    let isMoving = false

    // 마지막으로 눌린 키 기준으로 이동 (대각선 불가)
    if (this.lastPressedKey === 'up' && this.cursors.up.isDown) {
      velocityY = -this.speed
      isMoving = true
      this.lastDirection = 'up'
    } else if (this.lastPressedKey === 'down' && this.cursors.down.isDown) {
      velocityY = this.speed
      isMoving = true
      this.lastDirection = 'down'
    } else if (this.lastPressedKey === 'left' && this.cursors.left.isDown) {
      velocityX = -this.speed
      isMoving = true
      this.lastDirection = 'left'
    } else if (this.lastPressedKey === 'right' && this.cursors.right.isDown) {
      velocityX = this.speed
      isMoving = true
      this.lastDirection = 'right'
    }
    // 마지막 키가 떼어졌으면 다른 눌린 키 찾기
    else {
      if (this.cursors.up.isDown) {
        velocityY = -this.speed
        isMoving = true
        this.lastDirection = 'up'
        this.lastPressedKey = 'up'
      } else if (this.cursors.down.isDown) {
        velocityY = this.speed
        isMoving = true
        this.lastDirection = 'down'
        this.lastPressedKey = 'down'
      } else if (this.cursors.left.isDown) {
        velocityX = -this.speed
        isMoving = true
        this.lastDirection = 'left'
        this.lastPressedKey = 'left'
      } else if (this.cursors.right.isDown) {
        velocityX = this.speed
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
      this.sprite.setAcceleration(velocityX * 10, velocityY * 10)
    } else {
      // 정지 중: 부드럽게 감속 (드래그로)
      this.sprite.setAcceleration(0, 0)
    }
  }

  /**
   * 애니메이션 처리
   */
  private handleAnimation() {
    if (!this.sprite) return

    const velocity = this.sprite.body?.velocity
    if (!velocity) return

    const isMoving = Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1

    if (isMoving) {
      // 이동 중일 때 방향에 맞는 애니메이션 재생
      const currentAnim = `walk-${this.lastDirection}`
      if (this.sprite.anims.currentAnim?.key !== currentAnim) {
        this.sprite.play(currentAnim, true)
      }
    } else {
      // 정지 시 해당 방향의 idle 애니메이션
      const idleAnim = `idle-${this.lastDirection}`
      if (this.sprite.anims.currentAnim?.key !== idleAnim) {
        this.sprite.play(idleAnim, true)
      }
    }
  }

  /**
   * 플레이어 위치 가져오기
   */
  getPosition() {
    return {
      x: this.sprite?.x || 0,
      y: this.sprite?.y || 0
    }
  }

  /**
   * 설정 변경
   */
  setSpeed(speed: number) {
    this.speed = speed
    if (this.sprite) {
      this.sprite.setMaxVelocity(speed, speed)
    }
  }

  /**
   * 정리
   */
  destroy() {
    if (this.nameTag) {
      this.nameTag.destroy()
    }
  }

  setDrag(drag: number) {
    this.drag = drag
    if (this.sprite) {
      this.sprite.setDrag(drag)
    }
  }
}



