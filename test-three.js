const THREE = require('three');
const dirLight = new THREE.DirectionalLight(0xfffae0, 1.5);
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
console.log(dirLight.shadow.mapSize);
