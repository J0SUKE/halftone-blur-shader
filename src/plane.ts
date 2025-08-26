import * as THREE from "three"

import vertexShader from "./shaders/vertex.glsl"
import fragmentShader from "./shaders/fragment.glsl"
import { Size } from "./types/types"
import GUI from "lil-gui"

interface Props {
  scene: THREE.Scene
  sizes: Size
  gui: GUI
}

export default class Plane {
  scene: THREE.Scene
  geometry: THREE.PlaneGeometry
  material: THREE.ShaderMaterial
  mesh: THREE.Mesh
  sizes: Size
  gui: GUI

  constructor({ scene, sizes, gui }: Props) {
    this.scene = scene
    this.sizes = sizes
    this.gui = gui

    this.createGeometry()
    this.createMaterial()
    this.createMesh()
    this.scaleMesh()

    this.gui
      .add(this.material.uniforms.uRedFactor, "value", 0, 1, 0.01)
      .name("Red Factor")
    this.gui
      .add(this.material.uniforms.uGreenFactor, "value", 0, 1, 0.01)
      .name("Green Factor")
    this.gui
      .add(this.material.uniforms.uBlueFactor, "value", 0, 1, 0.01)
      .name("Blue Factor")
  }

  createGeometry() {
    this.geometry = new THREE.PlaneGeometry(1, 1)
  }

  createMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uViewportRes: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uRedFactor: { value: 0.5 },
        uGreenFactor: { value: 0.2 },
        uBlueFactor: { value: 0.1 },
      },
    })
  }

  scaleMesh() {
    this.mesh.scale.set(this.sizes.width, this.sizes.height, 1)
  }

  onResize(sizes: Size) {
    this.sizes = sizes
    this.scaleMesh()
    if (this.material) {
      this.material.uniforms.uViewportRes.value.set(sizes.width, sizes.height)
    }
  }

  createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
  }

  render(time: number) {
    this.material.uniforms.uTime.value = time
  }
}
