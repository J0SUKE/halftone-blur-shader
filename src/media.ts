import { Position, Size } from "./types/types"
import * as THREE from "three"

import fragmentShader from "./shaders/fragment.glsl"
import vertexShader from "./shaders/vertex.glsl"
import GUI from "lil-gui"
import gsap from "gsap"

interface Props {
  element: HTMLImageElement
  scene: THREE.Scene
  sizes: Size
  gui: GUI
}

export default class Media {
  element: HTMLImageElement
  scene: THREE.Scene
  sizes: Size
  material: THREE.ShaderMaterial
  geometry: THREE.PlaneGeometry
  mesh: THREE.Mesh
  nodeDimensions: Size
  meshDimensions: Size
  meshPosition: Position
  elementBounds: DOMRect
  currentScroll: number
  lastScroll: number
  scrollSpeed: number
  texture: THREE.Texture
  gui: GUI

  constructor({ element, scene, sizes, gui }: Props) {
    this.element = element
    this.scene = scene
    this.sizes = sizes
    this.gui = gui

    this.currentScroll = 0
    this.lastScroll = 0
    this.scrollSpeed = 0

    this.createMaterial()
    this.setTexture()
    this.createGeometry()
    this.createMesh()
    this.setNodeBounds()
    this.setMeshDimensions()
    this.setMeshPosition()

    this.scene.add(this.mesh)

    this.gui
      .add(this.material.uniforms.uProgress, "value", 0, 1)
      .name("progress")
      .step(0.01)

    gsap.fromTo(
      this.material.uniforms.uProgress,
      { value: 0 },
      {
        value: 1,
        duration: 1.8,
        scrollTrigger: {
          trigger: this.element,
          start: "bottom bottom",
          toggleActions: "play reverse play reverse",
        },
      }
    )
  }

  createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
  }

  createMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTexture: { value: null },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
        uMediaDimensions: {
          value: new THREE.Vector2(1, 1),
        },
        uProgress: {
          value: 0,
        },
        uGridBase: {
          value: parseFloat(this.element.getAttribute("data-grid") || "20"),
        },
      },
    })
  }

  createGeometry() {
    this.geometry = new THREE.PlaneGeometry(1, 1)
  }

  setNodeBounds() {
    this.elementBounds = this.element.getBoundingClientRect()

    this.nodeDimensions = {
      width: this.elementBounds.width,
      height: this.elementBounds.height,
    }
  }

  setMeshDimensions() {
    this.meshDimensions = {
      width: (this.nodeDimensions.width * this.sizes.width) / window.innerWidth,
      height:
        (this.nodeDimensions.height * this.sizes.height) / window.innerHeight,
    }

    this.mesh.scale.x = this.meshDimensions.width
    this.mesh.scale.y = this.meshDimensions.height
  }

  setMeshPosition() {
    this.meshPosition = {
      x: (this.elementBounds.left * this.sizes.width) / window.innerWidth,
      y: (-this.elementBounds.top * this.sizes.height) / window.innerHeight,
    }

    this.meshPosition.x -= this.sizes.width / 2
    this.meshPosition.x += this.meshDimensions.width / 2

    this.meshPosition.y -= this.meshDimensions.height / 2
    this.meshPosition.y += this.sizes.height / 2

    this.mesh.position.x = this.meshPosition.x
    this.mesh.position.y = this.meshPosition.y
  }

  setTexture() {
    this.material.uniforms.uTexture.value = new THREE.TextureLoader().load(
      this.element.src,
      (texture) => {
        const { width, height } = texture.image
        this.material.uniforms.uMediaDimensions.value.set(width, height)
      }
    )
  }

  updateScroll(scrollY: number) {
    this.currentScroll = (-scrollY * this.sizes.height) / window.innerHeight

    const deltaScroll = this.currentScroll - this.lastScroll
    this.lastScroll = this.currentScroll

    this.updateY(deltaScroll)
  }

  updateY(deltaScroll: number) {
    this.meshPosition.y -= deltaScroll
    this.mesh.position.y = this.meshPosition.y
  }

  onResize(sizes: Size) {
    this.sizes = sizes

    this.setNodeBounds()
    this.setMeshDimensions()
    this.setMeshPosition()
  }

  render() {}
}
