import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

let showPrompt = (display,message) => {
    document.getElementById("prompt").style.display= display;
    document.getElementById("prompt").innerHTML= `<span style="margin: 0!important;opacity: 0.9">${message}</span> ` ;
}

let InitializeFight = (player1, player2) => {
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1920 / 1080, 1, 1000);
camera.position.set(75, 20, 0);
const listener = new THREE.AudioListener();
camera.add( listener );
const audioLoader = new THREE.AudioLoader();
const sound = new THREE.Audio( listener );
const renderer =  new THREE.WebGLRenderer();
const light1 = new THREE.AmbientLight( 0x404040 );
const light2 = new THREE.DirectionalLight( 0xffffff, 0.1);
const light3 =  new THREE.HemisphereLight( 0xffffbb, 0x080820,4 );
const manager = new THREE.LoadingManager();
renderer.setClearColor("#E5E5E5");
light2.position.set(0,0,100)
scene.add( light1 );
scene.add( light2 );
scene.add( light3 );
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();
var mixers = [];
var previousRAF = null;
var characters = [];
var gameover = false;
var paused = false;
document.getElementById("health1percent").innerText = player1;
document.getElementById("health2percent").innerText = player2;
renderer.setSize( window.innerWidth, window.innerHeight);
document.body.appendChild( renderer.domElement);
var initialLoad = false;
    manager.onStart = () => {
        if(!initialLoad){
        document.getElementById("loader-container").style.display = 'block';
        document.getElementById("loadpercent").innerText = 'Hang in there, it usually takes more time on the first load!';
        }
    }
    manager.onLoad =  () => {
        document.getElementById("loader-container").style.display = 'none';
        if(!initialLoad){
            characters.forEach(el => {el.visible = true;}
                );
            showPrompt('block', 'FIGHT')
            initialLoad = true;
            setTimeout(()=>{
                showPrompt('none','');
                document.getElementById("pause").style.display = 'inline-block';
                document.getElementById("home").style.display = 'inline-block';
            },2000)}
    };
    manager.onProgress =  ( url, itemsLoaded, itemsTotal ) => {
        if(!initialLoad){
        document.getElementById("loadpercent").style.width = itemsLoaded / itemsTotal * 100 + "%";
        document.getElementById("loadpercent").innerText = "loading - "+ url +" - "+ itemsLoaded +" / "+ itemsTotal;}
    };
    manager.onError = ( url ) => {
        console.log( 'Error loading ' + url );
    };
    window.addEventListener('resize', () => {
        renderer.setSize( window.innerWidth, window.innerHeight);
        animate();
    })
    document.addEventListener('keydown', (event) => {
        controller(event.key)
    });

    let LoadBackground = () => {
        const loadBg = new THREE.CubeTextureLoader(manager);
        const texture = loadBg.load([
            './assets/Background/posx.jpg',
            './assets/Background/negx.jpg',
            './assets/Background/posy.jpg',
            './assets/Background/negy.jpg',
            './assets/Background/posz.jpg',
            './assets/Background/negz.jpg',
        ]);
        scene.background = texture;
        const plane = new THREE.Mesh(
        new THREE.PlaneGeometry( 76.5 ,121.5, 100, 100),
        new THREE.MeshStandardMaterial({
                color: 0x202020,
                map: (new THREE.TextureLoader).load("./assets/Background/plane.jpg"),
            }));
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        // plane.rotation.y = 21;
        plane.position.x = 60
        scene.add(plane);
    }
    let LoadAnimatedModelAndPlay = (player, offset, playerCode, rotate) => {
        const loader = new FBXLoader(manager);
        loader.setPath('./assets/');
        loader.load(`Character/${player}.fbx`, (fbx) => {
            fbx.health = 1000;
            fbx.visible = false;
            fbx.name = player;
            fbx.code = playerCode;
          characters.push(fbx);
          fbx.scale.setScalar(0.1);
          fbx.traverse(c => {
            c.castShadow = true;
          });
          if(rotate)
            fbx.rotation.y = rotate
            animation(fbx, './assets/', `Action/${player}/Idle.fbx`);
          fbx.position.copy(offset);
          scene.add(fbx);
        },
        (xhr)=>{
        }, (err)=>{});
    }

    document.getElementById("pause").addEventListener("click",()=>{
        paused = !paused;
        if(paused){
            showPrompt('block','PAUSED');
            document.getElementById("pause").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16">
            <path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
          </svg>`;
        }
        else{
            showPrompt('none', '');
            document.getElementById("pause").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause" viewBox="0 0 16 16">
            <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
          </svg>`;
        }
        mixers.forEach(el => {
            el._actions[0].paused = paused;
        })
    });

    let animation = (fbx, path, animFile, options) => {
        const anim = new FBXLoader(manager);
        anim.setPath(path);
        anim.load(animFile, (anim) => {
          const m = new THREE.AnimationMixer(fbx);
          mixers.push(m);
          const idle = m.clipAction(anim.animations[0]);
          if(options && options.loopOnce === true)
          idle.setLoop( THREE.LoopOnce )
          if(options && options.clampWhenFinished === true)
          idle.clampWhenFinished = true;
          idle.play();
        });
    }
    let  Step = (timeElapsed) => {
        const timeElapsedS = timeElapsed * 0.001;
        if (mixers) {
          mixers.map(m => {
              if(m._actions[0].enabled)
              m.update(timeElapsedS)
            });
        }
      }
    let RAF = () => {
        requestAnimationFrame((t) => {
          if (previousRAF === null) {
            previousRAF = t;
          }
          RAF();
          renderer.render(scene, camera);
          Step(t - previousRAF);
          previousRAF = t;
        });
      }
    LoadBackground();
    LoadAnimatedModelAndPlay(
            player2, new THREE.Vector3(40, 0, -15), 'player2');
    LoadAnimatedModelAndPlay(
            player1, new THREE.Vector3(40, 0, 15), 'player1', 3);
    RAF();

    let controller = (key) => {
        if(characters.length > 1 && !gameover && !paused){
        switch(key.toUpperCase())
        {
            case 'W': {
                animation(getCharacterbyName("player1"), './assets/', `Action/${player1}/Jump.fbx`, { loopOnce : true})
                break; 
                }
            case 'A': {
                if(!(checkDistance(10)))
                getCharacterbyName("player1").position.z += 2; 
                break; 
                }
            case 'D': {
                if(!(checkDistance(11)))
                getCharacterbyName("player1").position.z -= 2;
                break;
                } 
            case 'F':{
                Attack('player1','player2','Attack', 'Impact', 150, 'Missed1.wav')
                break;
                } 
            case 'P':{
                Attack('player2','player1', 'Attack', 'Impact', 150, 'Missed.mp3')
                break;
                } 
            case 'E':{
                Attack('player1','player2', 'Attack1', 'Impact1', 300, 'EffortMan.wav');
                break;
                }   
            case 'CONTROL':{
                Attack('player2','player1', 'Attack1', 'Impact1', 300, 'EffortMan.wav');
                break;
            } 
            case 'ARROWUP':{
                animation(getCharacterbyName("player2"), './assets/', `Action/${player2}/Jump.fbx`, { loopOnce : true})
                break;
            }
            case 'ARROWLEFT':{
                if(!(checkDistance(11)))
                getCharacterbyName("player2").position.z +=2;
                break;
            }
            case 'ARROWRIGHT':{
                if(!(checkDistance(10)))
                getCharacterbyName("player2").position.z -=2;
                break;
            }
            case 'I':{
                console.log(characters)
            }
            case '↑':{ 
                animation(getCharacterbyName("player2"), './assets/', `Action/${player2}/Jump.fbx`, { loopOnce : true})
                break;}
            case '←': {
            if(!(checkDistance(11)))
            getCharacterbyName("player2").position.z +=2;
            break;}
            case '→':{
                if(!(checkDistance(10)))
                getCharacterbyName("player2").position.z -=2;
                break;
            }
            case 'CTRL':{
                Attack('player2','player1', 'Attack1', 'Impact1', 300, 'EffortMan.wav');
                break;
            } 
        }
    }     
    }

    document.getElementById("controls").addEventListener('click',(event)=>{
        controller(event.srcElement.childNodes[0].data);
    })

    let getCharacterbyName = (code) => {
        let character = {}
        if(characters.length > 0)
        character = characters.find(character => { return (character.code === code)});
        return character;
    }

    let checkIfDead = () => {
        var message = "";
        if(getCharacterbyName("player1").health < 0){
            mixers = [];
            animation(getCharacterbyName("player1"), './assets/', `Action/${player1}/Dies.fbx`,{ loopOnce : true, clampWhenFinished : true })
            animation(getCharacterbyName("player2"), './assets/', `Action/${player2}/Wins.fbx`,{ loopOnce : true, clampWhenFinished : true })
            gameover = true;
            message = `${player2} Wins!`
        }
        else if(getCharacterbyName("player2").health < 0){
            mixers = [];
            animation(getCharacterbyName("player2"), './assets/', `Action/${player2}/Dies.fbx`,{ loopOnce : true, clampWhenFinished : true })
            animation(getCharacterbyName("player1"), './assets/', `Action/${player1}/Wins.fbx`,{ loopOnce : true, clampWhenFinished : true })
            gameover = true;
            message = `${player1} Wins!`
        }
        document.getElementById("health1percent").style.width = (getCharacterbyName("player1").health/10 > 0) ? `${getCharacterbyName("player1").health/10}%` : "0%";
        document.getElementById("health2percent").style.width = (getCharacterbyName("player2").health/10 > 0) ? `${getCharacterbyName("player2").health/10}%` : "0%";
        if(message)
            showPrompt('block', message);
    }

    let soundEffect = (clipPath) =>{
        audioLoader.load( clipPath , function( buffer ) {
            sound.setBuffer( buffer );
            sound.setLoop( false );
            sound.setVolume( 0.5 );
            sound.play();
        });
    }

    let Attack = (Aggressor,Aggressee,Attack,Impact,loss, sound) => {
        const AggressorObject = getCharacterbyName(Aggressor);
        const AggresseeObject = getCharacterbyName(Aggressee)
        animation(AggressorObject, './assets/', `Action/${AggressorObject.name}/${Attack}.fbx`, { loopOnce : true});
        setTimeout(()=>{
            if(checkDistance(CharacterSpecs[AggressorObject.name][Attack].distance)){
            animation(AggresseeObject, './assets/',`Action/${AggresseeObject.name}/${Impact}.fbx`, { loopOnce : true});
            soundEffect('./assets/Sounds/PUNCH.mp3');
            AggresseeObject.health -= loss;     
            checkIfDead();}
            else
            soundEffect(`./assets/Sounds/${sound}`); 
        },CharacterSpecs[AggressorObject.name][Attack].time);
    }

    let checkDistance = (distance) => {
        return (getCharacterbyName("player1").position.z - getCharacterbyName("player2").position.z < distance
            && getCharacterbyName("player1").position.z - getCharacterbyName("player2").position.z > -1 * distance
        )
    }
    let animate = () => {
        requestAnimationFrame( animate );
        renderer.render( scene, camera );
    }

    const CharacterSpecs = {
        Hulk : {
           Attack: {time:400,distance:20},
           Attack1: {time:1300,distance:25},
        },
        Sophie : {
            Attack : {time:0,distance:15},
            Attack1: {time:1900,distance:25},
        },
        Maw : {
            Attack : {time:1050,distance:20},
            Attack1 : {time:800,distance:15},
        },
        VanGuard : {
            Attack : {time:1050,distance:20},
            Attack1 : {time:1050,distance:15},
        },
    }
}

document.getElementById("initialize-button").addEventListener("click",()=>{
    let player1 ;
    let player2 ; 
    if(document.getElementById('player1_select') && document.getElementById('player2_select'))
    {
        player1 = document.getElementById('player1_select').value;
        player2 = document.getElementById('player2_select').value;
    }
    if(player1 && player2){
        fullScreen();
        document.getElementById("menu").style.display ="none";
        document.getElementById("topBar").style.display ="block";
        document.getElementById("controls").style.display ="block";
        showPrompt('block', 'Loading...')
        InitializeFight(player1, player2);
}})
document.getElementById("fullscreen-button").addEventListener("click",()=>{
    fullScreen();
    if (document.exitFullscreen) {
        document.exitFullscreen();
        document.getElementById("fullscreen-button").innerText = "Enter FullSceen";
        document.getElementById("fullscreen").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrows-fullscreen" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344 0a.5.5 0 0 1 .707 0l4.096 4.096V11.5a.5.5 0 1 1 1 0v3.975a.5.5 0 0 1-.5.5H11.5a.5.5 0 0 1 0-1h2.768l-4.096-4.096a.5.5 0 0 1 0-.707zm0-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707zm-4.344 0a.5.5 0 0 1-.707 0L1.025 1.732V4.5a.5.5 0 0 1-1 0V.525a.5.5 0 0 1 .5-.5H4.5a.5.5 0 0 1 0 1H1.732l4.096 4.096a.5.5 0 0 1 0 .707z"/>
      </svg>`
      }
})

document.getElementById("fullscreen").addEventListener("click",()=>{
    fullScreen();
    if (document.exitFullscreen) {
        document.exitFullscreen();
        document.getElementById("fullscreen").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrows-fullscreen" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344 0a.5.5 0 0 1 .707 0l4.096 4.096V11.5a.5.5 0 1 1 1 0v3.975a.5.5 0 0 1-.5.5H11.5a.5.5 0 0 1 0-1h2.768l-4.096-4.096a.5.5 0 0 1 0-.707zm0-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707zm-4.344 0a.5.5 0 0 1-.707 0L1.025 1.732V4.5a.5.5 0 0 1-1 0V.525a.5.5 0 0 1 .5-.5H4.5a.5.5 0 0 1 0 1H1.732l4.096 4.096a.5.5 0 0 1 0 .707z"/>
      </svg>`
      }
})

let fullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.getElementById("fullscreen-button").innerText = "Exit FullSceen";
        document.getElementById("fullscreen").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fullscreen-exit" viewBox="0 0 16 16">
        <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z"/>
      </svg>`;
      if(window.screen.orientation)
        window.screen.orientation.lock("landscape").then(
            success => console.log(success),
            failure => console.log(failure)
        )
    } 
}

document.getElementById("home").addEventListener("click",()=>{
    window.location.reload();
})