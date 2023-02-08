import {
  Box3,
  DirectionalLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  MeshPhysicalMaterial,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
export function createBannerRender(container: HTMLElement): {
  destroy: () => void
} {
  const width = container.clientWidth
  const height = container.clientHeight
  const aspect = width / height
  const scene = new Scene()
  const camera = new OrthographicCamera(
    -700 * aspect,
    700 * aspect,
    150 * aspect,
    -150 * aspect,
    -100000,
    100000
  )

  const renderer = new WebGLRenderer()
  renderer.setSize(width, height)
  container.appendChild(renderer.domElement)

  // TODO: 动态的求出实际需要的行列数量
  const rowCount = 145
  const columnCount = 145
  const useInstanced = false
  if (useInstanced) {
    const mesh = createInstancedCube(rowCount, columnCount, 100, 10)
    scene.add(mesh)
  } else {
    const cubes = createCubes(rowCount, columnCount, 100, 10)
    const textCubes = getTextCubeIndexes(rowCount, columnCount, 'C K B')
    textCubes.forEach((idx) => {
      const cube = cubes[idx]
      // TODO: 玻璃材质的灯箱效果不太好实现，先暂时用 MeshNormalMaterial
      // cube.material = new MeshNormalMaterial()
      cube.position.add(new Vector3(0, 40, 0))
      const size = 96
      const boxGeometry = new RoundedBoxGeometry(size, size, 5, 6, 6)
      const boxMaterial = new MeshBasicMaterial({ color: 0x2dc26b })
      const subGreen = new Mesh(boxGeometry, boxMaterial)
      subGreen.position.z = 100 - (100 - size / 2) - 5
      const boxMaterial2 = new MeshBasicMaterial({ color: 0x5784da })
      const subBlue = new Mesh(boxGeometry, boxMaterial2)
      subBlue.position.z = -(100 - (100 - size / 2) - 5)
      cube.add(subGreen)
      cube.add(subBlue)
    })
    cubes.forEach((cube) => scene.add(cube))
  }

  const light = new DirectionalLight(0xfff0dd, 20)
  light.position.set(0, 50, 120)
  scene.add(light)

  const useControls = true
  const controls = useControls
    ? new OrbitControls(camera, renderer.domElement)
    : null

  // TODO: 这应该是动态计算出的，不然容器宽度变化时会出现画面拉伸
  camera.rotation.x = Math.PI / (180 / -37.46298264794746)
  camera.rotation.y = Math.PI / (180 / -33.83082813346926)
  camera.rotation.z = Math.PI / (180 / -27.999319172766473)
  camera.position.x = -781.21316648914
  camera.position.z = 496.5526373542315
  camera.position.y = 681.9025439799655
  camera.zoom = 1
  camera.updateProjectionMatrix()
  console.log(camera)

  let stopRenderLoop: (() => void) | null = null
  function render() {
    const handle = requestAnimationFrame(render)
    stopRenderLoop = () => cancelAnimationFrame(handle)

    controls?.update()
    renderer.render(scene, camera)
  }
  render()

  return {
    destroy() {
      // TODO: 其他资源应该也需要手动销毁？
      stopRenderLoop?.()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

function createBaseCube(size = 100) {
  const boxGeometry = new RoundedBoxGeometry(size, size, size, 6, 6)
  const boxMaterial = new MeshPhysicalMaterial({
    metalness: 0,
    roughness: 0.6,
    transmission: 1,
  })
  const cube = new Mesh(boxGeometry, boxMaterial)
  return cube
}

function createCubes(
  rowCount: number,
  columnCount: number,
  size: number,
  gap: number,
  centerPos: Vector3 = new Vector3(0, 0, 0)
) {
  const cube = createBaseCube(size)
  const cubeBox = new Box3()
  cubeBox.setFromObject(cube)
  const cubeWidth = cubeBox.max.x - cubeBox.min.x
  const cubeLong = cubeBox.max.z - cubeBox.min.z

  const fullWidthWithGap = (cubeWidth + gap) * columnCount
  const fullLongWithGap = (cubeLong + gap) * rowCount

  const cubes: Mesh[] = []
  for (let z = 0; z < rowCount; z++) {
    for (let x = 0; x < columnCount; x++) {
      const cloned = cube.clone()
      const xOffset = x * (cubeWidth + gap)
      const zOffset = z * (cubeLong + gap)
      cloned.position.set(
        centerPos.x + (xOffset + gap / 2 + cubeWidth - fullWidthWithGap / 2),
        centerPos.y + cube.position.y,
        centerPos.z + (zOffset + gap / 2 + cubeLong - fullLongWithGap / 2)
      )
      cubes.push(cloned)
    }
  }
  return cubes
}

function createInstancedCube(
  rowCount: number,
  columnCount: number,
  size: number,
  gap: number,
  centerPos: Vector3 = new Vector3(0, 0, 0)
) {
  const boxGeometry = new RoundedBoxGeometry(size, size, size, 6, 6)
  const boxMaterial = new MeshPhysicalMaterial({
    metalness: 0,
    roughness: 0.6,
    transmission: 1,
  })
  const cubesMesh = new InstancedMesh(
    boxGeometry,
    boxMaterial,
    rowCount * columnCount
  )
  const cubeWidth = 100
  const cubeLong = 100

  const fullWidthWithGap = (cubeWidth + gap) * columnCount
  const fullLongWithGap = (cubeLong + gap) * rowCount

  const matrix = new Matrix4()
  for (let z = 0; z < rowCount; z++) {
    for (let x = 0; x < columnCount; x++) {
      const xOffset = x * (cubeWidth + gap)
      const zOffset = z * (cubeLong + gap)
      matrix.setPosition(
        centerPos.x + (xOffset + gap / 2 + cubeWidth - fullWidthWithGap / 2),
        centerPos.y,
        centerPos.z + (zOffset + gap / 2 + cubeLong - fullLongWithGap / 2)
      )
      cubesMesh.setMatrixAt(z * columnCount + x, matrix)
    }
  }
  return cubesMesh
}

function getTextCubeIndexes(
  rowCount: number,
  columnCount: number,
  text: string,
  font = '100 8px Arial'
) {
  // TODO: 动态计算出的字体太粗了，暂时用写死的
  return [
    // C
    [15, 21],
    [15, 22],
    [16, 20],
    [16, 23],
    [17, 19],
    [17, 24],
    [18, 19],
    [18, 24],
    // K
    [21, 19],
    [21, 20],
    [21, 21],
    [21, 22],
    [21, 23],
    [21, 24],
    [22, 21],
    [22, 22],
    [23, 20],
    [23, 23],
    [24, 19],
    [24, 24],
    // B
    [27, 19],
    [27, 20],
    [27, 21],
    [27, 22],
    [27, 23],
    [27, 24],
    [28, 19],
    [28, 22],
    [28, 24],
    [29, 20],
    [29, 21],
    [29, 23],
  ].map(([x, z]) => z * columnCount + x)
}
