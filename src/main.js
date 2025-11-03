import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { instance, modelViewMatrix } from 'three/tsl'
import { gsap } from "gsap";

/**
 * Base
 */

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco')

const gui = new GUI()
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

let character = {
  instance: null,
  moveDistance: 3,
  jumpHeight: 1,
  isMoving: false,
  moveDuration: 0.2
}

/**
 * 3D objects 
 * GLTF + DRACO + animation
 */ 

const intersectObjects = []
const intersectObjectsNames = ["board","board001","board002","board003","character", "tuttle", "Snorlax", "name"]

gltfLoader.load('./models/shreeGarden/shree_man3.glb', (gltf) =>
{
    gltf.scene.traverse((child) => {

      if(intersectObjectsNames.includes(child.name)){
        intersectObjects.push(child);
      }

      if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
      }
      if (child.name== "character"){
        character.instance = child
      }

    })

    gltf.scene.scale.set(0.025, 0.025, 0.025)
    scene.add(gltf.scene)
})

/**
 * Lights 
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
directionalLight.castShadow = true
directionalLight.target.position.set(200, 0, 0)
directionalLight.shadow.mapSize.set(4096, 4096)
directionalLight.shadow.camera.near = 0.5
directionalLight.shadow.camera.far = 100
directionalLight.shadow.camera.left = -3
directionalLight.shadow.camera.right = 3
directionalLight.shadow.camera.top = 3
directionalLight.shadow.camera.bottom = -3
directionalLight.position.set(-5, 20, 5)
directionalLight.shadow.normalBias = 0.1
scene.add(directionalLight)

const shadowCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
scene.add(shadowCameraHelper)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    viewSize: 0.5
}

window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    const newAspectRatio = sizes.width / sizes.height
    const viewSize = 0.5

    camera.top = viewSize
    camera.bottom = -viewSize
    camera.left = -newAspectRatio * viewSize
    camera.right = newAspectRatio * viewSize
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Raycaster + Mouse
 */
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

/**
 * modalcontent
 */
const modalContent = {
  "board":{
    title: " project One",
    content : "this is project One",
    link:"https://example.com/"
  },
  "board001":{
    title: " project two",
    content : "this is project two",
    link:"https://example.com/"
  },
  "board002":{
    title: " project Three",
    content : "this is project Three",
    link:"https://example.com/"
  },
  "board003":{
    title: " project Four",
    content : "this is project four",
    link:"https://example.com/"
  },
  "name":{
    title : "this is name",
    content : "shree"
  },
};

const modal = document.querySelector(".modal")
const modalTitle = document.querySelector(".modal-title")
const modalprojectDescription = document.querySelector(".modal-project-description")
const modalExitButton = document.querySelector(".modal-exit-button")
const modalVisitProjectButton = document.querySelector(".modal-visit-button")

function showModal(id){
  const content = modalContent[id];
  if(content){
    modalTitle.textContent = content.title;
    modalprojectDescription.textContent = content.content;
    modal.classList.toggle("hidden");
  }

  if (content.link){
    modalVisitProjectButton.href = content.link
    modalVisitProjectButton.classList.remove("hidden");
  }else{
    modalVisitProjectButton.classList.add("hidden");
  }
}

function hideModal(){
  modal.classList.toggle("hidden")
}

let intersectObject = "";

function onPointerMove(event){
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
}

window.addEventListener('pointermove', onPointerMove)

/**
 * Movements and interactions
 */

function jumpCharacter(meshID){
  const mesh = scene.getObjectByName(meshID);
  const jumpHeight = 2 ;
  const jumpDuration = 0.5;

  const t1 = gsap.timeline();

  t1.to (mesh.scale, {
    x:1.2,
    y:0.8,
    z:1.2,
    duration:jumpDuration*0.2,
    ease: "power2.out",
  });
  t1.to(mesh.scale, {
    x:0.8,
    y:1.3,
    z:0.8,
    duration:jumpDuration*0.3,
    ease: "power2.out",
  });

  t1.to(mesh.position, {
    y: mesh.position.y + jumpHeight,
    duration:jumpDuration*0.5,
    ease: "power2.out",
  },"<");

  t1.to(mesh.scale, {
    x:1.5,
    y:1.5,
    z:1.5,
    duration:jumpDuration*0.3,
    ease: "power1.inOut",
  });

  t1.to(mesh.position, {
    y:mesh.position.y,
    duration:jumpDuration*0.5,
    ease: "bounce.out",
  },">");

  t1.to(mesh.scale, {
    x:1.5,
    y:1.5,
    z:1.5,
    duration:jumpDuration*0.2,
    ease: "elastic.out(1,0.3)",
  });
}

function onClick(){
  if (intersectObject !== ""){
    if (["tuttle", "Snorlax"].includes(intersectObject)){
      jumpCharacter(intersectObject); 
    } else {
      showModal(intersectObject);
    }
  }
}

function moveCharacter(targetPosition, targetRotation) {
  character.isMoving = true;

  const t1 = gsap.timeline({
    onComplete: () => (character.isMoving = false)
  });

  // Move
  t1.to(character.instance.position, {
    x: targetPosition.x,
    z: targetPosition.z,
    duration: character.moveDuration,
    ease: "power1.inOut"
  });

  // Rotate (at same time)
  t1.to(character.instance.rotation, {
    y: targetRotation,
    duration: character.moveDuration,
    ease: "power1.inOut"
  }, "<");

  //jump Animation
  t1.to(character.instance.position, {
    y: character.instance.position.y + character.jumpHeight ,
    duration: character.moveDuration/2,
    yoyo: true,
    repeat:1
  }, "<");
}

function onKeyDown(event) {
  if (!character.instance || character.isMoving) return;

  const targetPosition = character.instance.position.clone();
  let targetRotation = character.instance.rotation.y;

  switch (event.key.toLowerCase()) {
    case "w":
    case "arrowup":
      targetPosition.x -= character.moveDistance;
      targetRotation = 0; 
      break;
    case "s":
    case "arrowdown":
      targetPosition.x += character.moveDistance;
      targetRotation = Math.PI; 
      break;
    case "a":
    case "arrowleft":
      targetPosition.z += character.moveDistance;
      targetRotation = -Math.PI/2; 
      break;
    case "d":
    case "arrowright":
      targetPosition.z -= character.moveDistance;   
      targetRotation = Math.PI/2; 
      break;
    default:
      return;
  }

  moveCharacter(targetPosition, targetRotation);
}

window.addEventListener('click', onClick)
modalExitButton.addEventListener("click", hideModal)
window.addEventListener("keydown", onKeyDown)

/**
 * Camera
 */
const aspectRatio = sizes.width / sizes.height
const viewSize = 0.5

const camera = new THREE.OrthographicCamera(
    -aspectRatio * viewSize, 
    aspectRatio * viewSize, 
    viewSize,
    -viewSize,
    0.1, 
    1000
)
scene.add(camera)

camera.position.set(12,8,8);

const helper = new THREE.CameraHelper(camera);
scene.add(helper);

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.5
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
function animate(){
  raycaster.setFromCamera(pointer, camera);
  
  const intersects = raycaster.intersectObjects(intersectObjects, true)

  if (intersects.length > 0){
    document.body.style.cursor = "pointer"
    intersectObject = intersects[0].object.parent.name
  } else {
    document.body.style.cursor = "default"
    intersectObject = ""
  }

  renderer.render(scene, camera)
  window.requestAnimationFrame(animate)
}

animate()
