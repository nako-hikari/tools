const viewport = document.getElementById("viewport")
const animFile = document.getElementById("animFile")
const animationList = document.getElementById("animationList")
const fileStatus = document.getElementById("fileStatus")
const playBtn = document.getElementById("playBtn")
const pauseBtn = document.getElementById("pauseBtn")
const stopBtn = document.getElementById("stopBtn")
const speedSlider = document.getElementById("speed")
const loopCheckbox = document.getElementById("loop")

let scene, camera, renderer, controls
let clock = new THREE.Clock()
let mixer
let actions = {}
let currentAction = null
let modelRoot = null
let animationData = null
let speed = 1
let loop = false

init()
loadModel()
animate()

function init() {
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0e0e11)

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    camera.position.set(0, 1.5, 3)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(viewport.clientWidth, viewport.clientHeight)
    viewport.appendChild(renderer.domElement)

    controls = new THREE.OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    const light1 = new THREE.HemisphereLight(0xffffff, 0x444444, 1)
    scene.add(light1)

    const light2 = new THREE.DirectionalLight(0xffffff, 1)
    light2.position.set(2, 4, 2)
    scene.add(light2)

    window.addEventListener("resize", onResize)

    animFile.addEventListener("change", handleAnimFile)
    playBtn.onclick = playAnimation
    pauseBtn.onclick = pauseAnimation
    stopBtn.onclick = stopAnimation
    speedSlider.oninput = e => speed = parseFloat(e.target.value)
    loopCheckbox.onchange = e => loop = e.target.checked
}

function onResize() {
    camera.aspect = viewport.clientWidth / viewport.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(viewport.clientWidth, viewport.clientHeight)
}

async function loadModel() {
    const geoUrl = "https://raw.githubusercontent.com/Mojang/bedrock-samples/main/resource_pack/models/entity/humanoid.custom.geo.json"
    const texUrl = "https://raw.githubusercontent.com/nako-hikari/support-files/main/assets/Nako_maid2.png"

    const geo = await fetch(geoUrl).then(r => r.json())
    const tex = await new THREE.TextureLoader().loadAsync(texUrl)
    tex.magFilter = THREE.NearestFilter
    tex.minFilter = THREE.NearestFilter

    modelRoot = new THREE.Group()
    scene.add(modelRoot)

    const material = new THREE.MeshStandardMaterial({ map: tex })

    const geometryData = geo["minecraft:geometry"][0]

    const bones = {}

    function createBone(boneData) {
        const bone = new THREE.Group()
        bone.name = boneData.name

        const pivot = boneData.pivot || [0, 0, 0]
        bone.position.set(pivot[0] / 16, pivot[1] / 16, pivot[2] / 16)

        bones[boneData.name] = bone

        if (boneData.cubes) {
            boneData.cubes.forEach(cube => {
                const size = cube.size || [1, 1, 1]
                const origin = cube.origin || [0, 0, 0]

                const box = new THREE.BoxGeometry(
                    size[0] / 16,
                    size[1] / 16,
                    size[2] / 16
                )

                const mesh = new THREE.Mesh(box, material)

                mesh.position.set(
                    (origin[0] + size[0] / 2) / 16,
                    (origin[1] + size[1] / 2) / 16,
                    (origin[2] + size[2] / 2) / 16
                )

                bone.add(mesh)
            })
        }

        return bone
    }

    geometryData.bones.forEach(b => {
        bones[b.name] = createBone(b)
    })

    geometryData.bones.forEach(b => {
        const bone = bones[b.name]
        if (b.parent && bones[b.parent]) {
            bones[b.parent].add(bone)
        } else {
            modelRoot.add(bone)
        }
    })

    mixer = new THREE.AnimationMixer(modelRoot)
}

function handleAnimFile(e) {
    const file = e.target.files[0]
    const reader = new FileReader()

    reader.onload = () => {
        animationData = JSON.parse(reader.result)
        fileStatus.textContent = file.name
        buildAnimationList()
    }

    reader.readAsText(file)
}

function buildAnimationList() {
    animationList.innerHTML = ""
    actions = {}

    if (!animationData || !animationData.animations) return

    Object.keys(animationData.animations).forEach(name => {
        const div = document.createElement("div")
        div.className = "animation-item"
        div.textContent = name

        div.onclick = () => selectAnimation(name, div)

        animationList.appendChild(div)
    })
}

function selectAnimation(name, el) {
    document.querySelectorAll(".animation-item").forEach(i => i.classList.remove("active"))
    el.classList.add("active")

    currentAction = name
}

function playAnimation() {
    if (!currentAction || !animationData) return
    stopAnimation()

    const clip = THREE.AnimationClip.findByName(
        parseAnimations(animationData),
        currentAction
    )

    if (!clip) return

    const action = mixer.clipAction(clip)
    action.reset()
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
    action.play()

    actions[currentAction] = action
}

function pauseAnimation() {
    if (!currentAction || !actions[currentAction]) return
    actions[currentAction].paused = true
}

function stopAnimation() {
    Object.values(actions).forEach(a => a.stop())
    actions = {}
}

function parseAnimations(data) {
    const clips = []

    const anims = data.animations || {}

    for (const name in anims) {
        const a = anims[name]

        const times = [0, 1]
        const values = [0, 0, 0, 0, 0, 0, 0, 0, 0]

        const track = new THREE.VectorKeyframeTrack(
            ".position",
            times,
            values
        )

        const clip = new THREE.AnimationClip(name, -1, [track])

        clips.push(clip)
    }

    return clips
}

function animate() {
    requestAnimationFrame(animate)

    const delta = clock.getDelta()

    if (mixer) mixer.update(delta * speed)

    controls.update()
    renderer.render(scene, camera)
}
