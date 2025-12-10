import Phaser from 'phaser'

/**
 * 다른 플레이어를 표시하는 클래스
 */
export class OtherPlayer {
  private scene: Phaser.Scene
  public sprite: Phaser.Physics.Arcade.Sprite | null = null
  private nameTag?: Phaser.GameObjects.Text
  public playerId: number
  public playerName: string

  // 플레이어 설정
  private scale: number = 2.67
  private frameRate: number = 6

  // 부드러운 이동을 위한 변수
  private targetX: number = 0
  private targetY: number = 0
  private currentDirection: 'U' | 'D' | 'L' | 'R' = 'D'
  private isMoving: boolean = false

  constructor(scene: Phaser.Scene, playerId: number, playerName: string) {
    this.scene = scene
    this.playerId = playerId
    this.playerName = playerName
  }

  /**
   * 다른 플레이어 스프라이트 생성
   */
  create(x: number, y: number) {
    try {
      // Physics 활성화된 스프라이트 생성
      this.sprite = this.scene.physics.add.sprite(x, y, 'player')
      this.sprite.setScale(this.scale)

      // 목표 위치 초기화
      this.targetX = x
      this.targetY = y

      // 애니메이션이 없으면 생성
      this.ensureAnimations()

      // 이름표 생성
      this.nameTag = this.scene.add.text(x, y - 40, this.playerName, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',  // 다른 플레이어는 금색
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5)

      // 기본 애니메이션 재생
      this.sprite.play('idle-down')
    } catch (error) {
      console.error('OtherPlayer 생성 에러:', this.playerId, error)
    }
  }

  /**
   * 애니메이션 확인 및 생성
   */
  private ensureAnimations() {
    const anims = this.scene.anims

    // 애니메이션이 이미 존재하면 스킵
    if (anims.exists('walk-down')) return

    // 아래 방향
    anims.create({
      key: 'walk-down',
      frames: anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: this.frameRate,
      repeat: -1
    })

    // 좌 방향
    anims.create({
      key: 'walk-left',
      frames: anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: this.frameRate,
      repeat: -1
    })

    // 우 방향
    anims.create({
      key: 'walk-right',
      frames: anims.generateFrameNumbers('player', { start: 8, end: 11 }),
      frameRate: this.frameRate,
      repeat: -1
    })

    // 위 방향
    anims.create({
      key: 'walk-up',
      frames: anims.generateFrameNumbers('player', { start: 12, end: 15 }),
      frameRate: this.frameRate,
      repeat: -1
    })

    // 정지 애니메이션
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
   * 위치 업데이트 (부드러운 이동)
   */
  updatePosition(x: number, y: number, direction: 'U' | 'D' | 'L' | 'R') {
    if (!this.sprite) return

    this.targetX = x
    this.targetY = y
    this.currentDirection = direction
    this.isMoving = true
  }

  /**
   * 매 프레임 업데이트
   */
  update() {
    if (!this.sprite) return

    // 목표 위치로 부드럽게 이동
    const currentX = this.sprite.x
    const currentY = this.sprite.y

    const dx = this.targetX - currentX
    const dy = this.targetY - currentY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 목표 위치에 거의 도달했으면 정지
    if (distance < 2) {
      this.sprite.x = this.targetX
      this.sprite.y = this.targetY
      this.isMoving = false
    } else {
      // 부드럽게 이동 (lerp)
      const lerpFactor = 0.2  // 이동 속도 (0.1 ~ 0.3 추천)
      this.sprite.x += dx * lerpFactor
      this.sprite.y += dy * lerpFactor
    }

    // 애니메이션 업데이트
    this.updateAnimation()

    // 이름표 위치 업데이트
    if (this.nameTag) {
      this.nameTag.setPosition(this.sprite.x, this.sprite.y - 40)
    }
  }

  /**
   * 애니메이션 업데이트
   */
  private updateAnimation() {
    if (!this.sprite) return

    // 방향을 소문자로 변환
    const directionMap: { [key: string]: string } = {
      U: 'up',
      D: 'down',
      L: 'left',
      R: 'right'
    }

    const direction = directionMap[this.currentDirection] || 'down'

    if (this.isMoving) {
      // 이동 중
      const animKey = `walk-${direction}`
      if (this.sprite.anims.currentAnim?.key !== animKey) {
        this.sprite.play(animKey, true)
      }
    } else {
      // 정지
      const idleKey = `idle-${direction}`
      if (this.sprite.anims.currentAnim?.key !== idleKey) {
        this.sprite.play(idleKey, true)
      }
    }
  }

  /**
   * 정리
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy()
      this.sprite = null
    }
    if (this.nameTag) {
      this.nameTag.destroy()
      this.nameTag = undefined
    }
  }
}

