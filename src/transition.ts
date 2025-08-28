import { Position, Size } from "./types/types"
import * as THREE from "three"

import fragmentShader from "./shaders/transition-frag.glsl"
import vertexShader from "./shaders/vertex.glsl"
import GUI from "lil-gui"
import gsap from "gsap"

interface Props {
  scene: THREE.Scene
  sizes: Size
  gui: GUI
}

export default class Transition {
  scene: THREE.Scene
  sizes: Size
  material: THREE.ShaderMaterial
  geometry: THREE.PlaneGeometry
  mesh: THREE.Mesh
  nodeDimensions: Size
  meshDimensions: Size
  meshPosition: Position
  currentScroll: number
  lastScroll: number
  scrollSpeed: number
  texture: THREE.Texture
  gui: GUI

  constructor({ scene, sizes, gui }: Props) {
    this.scene = scene
    this.sizes = sizes
    this.gui = gui

    this.currentScroll = 0
    this.lastScroll = 0
    this.scrollSpeed = 0

    this.createMaterial()
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
        uMediaDimensions: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uProgress: {
          value: 0,
        },
        uGridBase: {
          value: 35,
        },
        uColor: {
          value: 0.08,
        },
      },
    })
  }

  async transitionIn() {
    this.material.uniforms.uColor.value = 0.08

    return new Promise<void>((resolve) => {
      gsap.to(this.material.uniforms.uProgress, {
        value: 1,
        duration: 1.4,
        onComplete: resolve,
      })
    })
  }

  async transitionOut() {
    this.material.uniforms.uColor.value = 1

    return new Promise<void>((resolve) => {
      gsap.to(this.material.uniforms.uProgress, {
        value: 1,
        duration: 1.4,
        onComplete: resolve,
      })
    })
  }

  reset() {
    this.material.uniforms.uProgress.value = 0
  }

  createGeometry() {
    this.geometry = new THREE.PlaneGeometry(1, 1)
  }

  setNodeBounds() {
    this.nodeDimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  }

  setMeshDimensions() {
    this.meshDimensions = {
      width: this.sizes.width,
      height: this.sizes.height,
    }

    this.mesh.scale.x = this.meshDimensions.width
    this.mesh.scale.y = this.meshDimensions.height
  }

  setMeshPosition() {
    this.meshPosition = {
      x: 0,
      y: 0,
    }

    this.mesh.position.x = this.meshPosition.x
    this.mesh.position.y = this.meshPosition.y
    this.mesh.position.z = 0.001
  }

  onResize(sizes: Size) {
    this.sizes = sizes

    this.setNodeBounds()
    this.setMeshDimensions()
    this.setMeshPosition()
  }

  render() {}
}
