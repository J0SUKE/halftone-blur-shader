import * as THREE from "three"
import { Dimensions, Size } from "./types/types"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import GUI from "lil-gui"
import Media from "./media"
import Scroll from "./scroll"
import Transition from "./transition"
import gsap from "gsap"
import { $ } from "./utils/dom"

interface Props {
  scroll: Scroll
}

export default class Canvas {
  element: HTMLCanvasElement
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  sizes: Size
  dimensions: Dimensions
  time: number
  clock: THREE.Clock
  raycaster: THREE.Raycaster
  mouse: THREE.Vector2
  orbitControls: OrbitControls
  debug: GUI
  medias: Media[] = []
  scroll: Scroll
  transition: Transition
  mediaInfoBlock: HTMLDivElement

  constructor({ scroll }: Props) {
    this.scroll = scroll
    this.element = document.getElementById("webgl") as HTMLCanvasElement
    this.mediaInfoBlock = document.getElementById(
      "media-block"
    ) as HTMLDivElement
    this.time = 0
    this.createClock()
    this.createScene()
    this.createCamera()
    this.createRenderer()
    this.setSizes()
    this.createRayCaster()
    //this.createOrbitControls()
    this.addEventListeners()
    this.createDebug()
    this.createMedias()
    this.createTransition()

    this.debug.hide()

    this.render()

    this.medias.forEach((media, index) => {
      media.element.addEventListener("click", () => {
        this.onClickMedia(media.element, index + 1)
      })
    })

    document
      .querySelector("[data-back-button]")
      ?.addEventListener("click", () => {
        this.onClickBack()
      })
  }

  createScene() {
    this.scene = new THREE.Scene()
  }

  createMedias() {
    const elements = document.querySelectorAll("[data-halftone-media]")
    elements.forEach((element) => {
      const media = new Media({
        element: element as HTMLImageElement,
        scene: this.scene,
        sizes: this.sizes,
        gui: this.debug,
      })

      this.medias.push(media)
    })
  }

  createTransition() {
    this.transition = new Transition({
      scene: this.scene,
      sizes: this.sizes,
      gui: this.debug,
    })
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    this.scene.add(this.camera)
    this.camera.position.z = 10
  }

  createOrbitControls() {
    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    )
  }

  createRenderer() {
    this.dimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(2, window.devicePixelRatio),
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.element,
      alpha: true,
    })
    this.renderer.setSize(this.dimensions.width, this.dimensions.height)
    this.renderer.render(this.scene, this.camera)

    this.renderer.setPixelRatio(this.dimensions.pixelRatio)
  }

  createDebug() {
    this.debug = new GUI()
  }

  setSizes() {
    let fov = this.camera.fov * (Math.PI / 180)
    let height = this.camera.position.z * Math.tan(fov / 2) * 2
    let width = height * this.camera.aspect

    this.sizes = {
      width: width,
      height: height,
    }
  }

  createClock() {
    this.clock = new THREE.Clock()
  }

  createRayCaster() {
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
  }

  onMouseMove(event: MouseEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene.children)
    const target = intersects[0]
    if (target && "material" in target.object) {
      const targetMesh = intersects[0].object as THREE.Mesh
    }
  }

  addEventListeners() {
    window.addEventListener("mousemove", this.onMouseMove.bind(this))
    window.addEventListener("resize", this.onResize.bind(this))
  }

  onResize() {
    this.dimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(2, window.devicePixelRatio),
    }

    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.setSizes()

    this.renderer.setPixelRatio(this.dimensions.pixelRatio)
    this.renderer.setSize(this.dimensions.width, this.dimensions.height)

    this.medias.forEach((media) => {
      media.onResize(this.sizes)
      media.updateScroll(this.scroll.getScroll())
    })
  }

  onScroll(scrollY: number) {
    this.medias?.forEach((media) => {
      media.updateScroll(scrollY)
    })
  }

  onClickMedia(media: HTMLImageElement, index: number) {
    this.fillMediaData(media, index)
    this.transition.transitionIn().then(() => {
      this.mediaInfoBlock.style.pointerEvents = "all"
      document.body.style.background = "rgb(22,22,22)"
      this.medias.forEach((m) => {
        m.hide()
      })
      gsap.to(this.mediaInfoBlock, {
        opacity: 1,
        duration: 0.4,
        onComplete: () => {
          this.transition.reset()
        },
      })
    })
  }

  fillMediaData(element: HTMLImageElement, index: number) {
    $("[data-media-name-container]").textContent =
      element.getAttribute("data-halftone-media-name") || ""

    $("[data-media-size-container]").textContent =
      element.getAttribute("data-halftone-media-size") || ""

    $("[data-media-width-container]").textContent =
      element.getAttribute("data-halftone-media-width") || ""

    $("[data-media-height-container]").textContent =
      element.getAttribute("data-halftone-media-height") || ""

    $("[data-media-bit-depth-container]").textContent =
      element.getAttribute("data-halftone-media-bit-depth") || ""

    $("[data-media-horizontal-resolution-container]").textContent =
      element.getAttribute("data-halftone-media-horizontal-resolution") || ""

    $("[data-media-vertical-resolution-container]").textContent =
      element.getAttribute("data-halftone-media-vertical-resolution") || ""

    $("[data-media-index-container]").textContent =
      "0" + index.toString() + "/04"
    ;($("[data-full-size-image]") as HTMLImageElement).src = element.src
  }

  onClickBack() {
    this.scroll.resetScroll()

    this.element.style.zIndex = "30"

    const homepage = $("#homepage")

    gsap.set(homepage, {
      opacity: 0,
    })

    this.transition.transitionOut().then(() => {
      document.body.style.background = "white"
      this.mediaInfoBlock.style.opacity = "0"
      this.mediaInfoBlock.style.pointerEvents = "none"
      this.transition.reset()
      this.element.style.zIndex = "0"
      gsap.to(homepage, {
        opacity: 1,
        duration: 0.3,
      })

      this.medias.forEach((m) => {
        m.setupScrollTrigger()
      })
    })
  }

  render() {
    this.time = this.clock.getElapsedTime()

    this.medias.forEach((media) => {
      media.render()
    })

    this.renderer.render(this.scene, this.camera)
  }
}
