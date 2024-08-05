import { createAnimations } from './animations.js'
import { initAudio, playAudio } from './audio.js'
import { checkControls } from './controls.js'
import { initSpriteSheet } from './spritesheet.js'

// eslint-disable-next-line no-unused-vars
/* global phaser */
const config = {
  // eslint-disable-next-line no-undef
  type: Phaser.AUTO,
  width: 256,
  height: 244,
  backgroundColor: '#049cd8',
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: {
    preload, // se ejecuta para precargar recursos
    create, // se ejecuta cuando el juego comienza
    update // se ejecuta en cada frame
  }
}

// eslint-disable-next-line no-new, no-undef
new Phaser.Game(config)

function preload () {
  this.load.image(
    'cloud1',
    'assets/scenery/overworld/cloud1.png'
  )

  this.load.image(
    'floorbricks',
    'assets/scenery/overworld/floorbricks.png'
  )

  this.load.image(
    'supermushroom',
    'assets/collectibles/super-mushroom.png'
  )

  initSpriteSheet(this)

  initAudio(this)
}

function create () {
  createAnimations(this)
  // Agregar la imagen de fondo
  this.add.image(0, 0, 'cloud1')
    .setOrigin(0, 0)
    .setScale(0.15)

  // Crear el grupo de suelo estático
  this.floor = this.physics.add.staticGroup()

  this.floor.create(0, config.height - 16, 'floorbricks')
    .setOrigin(0, 0.5)
    .refreshBody()

  this.floor.create(150, config.height - 16, 'floorbricks')
    .setOrigin(0, 0.5)
    .refreshBody()

  // Crear el sprite de Mario
  this.mario = this.physics.add.sprite(50, 100, 'mario')
    .setOrigin(0, 1)
    .setCollideWorldBounds(true)
    .setGravityY(300)

  this.enemy = this.physics.add.sprite(120, config.height - 30, 'goomba')
    .setOrigin(0, 1)
    .setGravityY(300)
    .setVelocityX(-50)

  this.collectibles = this.physics.add.staticGroup()
  this.collectibles.create(150, 150, 'coin').anims.play(
    'coin-idle', true)
  this.collectibles.create(300, 150, 'coin').anims.play(
    'coin-idle', true)
  this.collectibles.create(200, config.height - 40,
    'supermushroom').anims.play('supermushroom-idle', true)
  this.physics.add.overlap(this.mario, this.collectibles,
    collectItem, null, this)

  // Añadir colisiones
  this.physics.world.setBounds(0, 0, 2000, config.height)
  this.physics.add.collider(this.mario, this.floor)
  this.physics.add.collider(this.floor, this.enemy)
  this.physics.add.collider(this.mario, this.enemy,
    onHitEnemy, null, this)

  this.cameras.main.setBounds(0, 0, 2000, config.height)
  this.cameras.main.startFollow(this.mario)

  this.enemy.anims.play('goomba-walk', true)

  // Crear controles de teclado
  this.keys = this.input.keyboard.createCursorKeys()

  function onHitEnemy (mario, enemy) {
    if (mario.body.touching.down && enemy.body.touching.up) {
      enemy.anims.play('goomba-dead', true)
      enemy.setVelocityX(0)
      mario.setVelocityY(-200)
      playAudio('goomba-stomp', this)
      addToScore(200, enemy, this)
      setTimeout(() => {
        enemy.destroy()
      }, 500)
    } else {
      killMario(this)
    }
  }

  function collectItem (mario, item) {
    const { texture: { key } } = item
    if (key == 'coin') {
      item.destroy()
      playAudio('coin-pickup', this, { volume: 0.1 })
      addToScore(100, item, this)
    // eslint-disable-next-line eqeqeq
    } else if (key == 'supermushroom') {
      item.destroy()
      this.physics.world.pause()
      this.anims.pauseAll()
      playAudio('powerup', this, { volume: 0.1 })
      let i = 0
      const interval = setInterval(() => {
        i++
        mario.anims.play(i % 2 == 0
          ? 'mario-grown-idle'
          : 'mario-idle'
        )
      }, 100)

      mario.isBlocked = true
      mario.isGrown = true

      setTimeout(() => {
        mario.setDisplaySize(18, 32)
        mario.body.setSize(18, 32)
        this.anims.resumeAll()
        mario.isBlocked = false
        clearInterval(interval)
        this.physics.world.resume()
      }, 1000)
    }
  }

  function addToScore (scoreToAdd, origin, game) {
    const scoreText = game.add.text(
      origin.x,
      origin.y,
      scoreToAdd,
      {
        fontFamily: 'pixel',
        fontSize: config.width / 35
      }
    )

    game.tweens.add({
      targets: scoreText,
      duration: 500,
      y: scoreText.y - 20,
      onComplete: () => {
        game.tweens.add({
          targets: scoreText,
          duration: 100,
          alpha: 0,
          onComplete: () => {
            scoreText.destroy()
          }
        })
      }
    })
  }
}
function update () {
  const { mario } = this

  checkControls(this)

  if (mario.y >= config.height) {
    killMario(this)
  }
}

function killMario (game) {
  const { mario, scene } = game

  if (mario.isDead) return

  mario.isDead = true
  mario.anims.play('mario-dead')
  mario.setCollideWorldBounds(false)
  playAudio('gameover', game, { volume: 0.2 })

  mario.body.checkCollision.none = true
  mario.setVelocityX(0)

  setTimeout(() => {
    mario.setVelocityY(-300)
  }, 100)

  setTimeout(() => {
    scene.restart()
  }, 6000)
}
