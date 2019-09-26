const THREE = require("three");
const RagDoll = require("../three/IK/XrRagdoll");
require('./GPUPickers/utils/Object3dExtension');
let instance = null;
class IKHelper extends THREE.Object3D
{
    constructor(mesh)
    {
        if(!instance)
        {
            super();
            instance = this;
            this.controlPoints = new THREE.Group();
            this.selectedContolPoint = null;
            instance.ragDoll = new RagDoll();
            this.poleTargets = new THREE.Group();
            this.selectedControlPoint = null;
            this.add(this.poleTargets);
            this.add(this.controlPoints);
            intializeInstancedMesh(mesh);
            this.add(this.instancedMesh);
            this.targetPoints = this.poleTargets.children.concat(this.controlPoints.children);
        }
        return instance;
    }

    static getInstance(mesh) 
    {
        return instance ? instance : new IKHelper(mesh)
    }

    initialize(skinnedMesh)
    {
        let ragDoll = instance.ragDoll;
        let meshes = this.targetPoints;

        for(let i = 0; i < meshes.length; i++)
        {
            let mesh = meshes[i];
            mesh.scale.set(0.5, 0.1, 0.5)
        }
        ragDoll.initObject(this, skinnedMesh.parent.parent, this.controlPoints.children, this.poleTargets.children);
        ragDoll.reinitialize();
        this.updateAllTargetPoints();
    }

    selectControlPoint(name)
    {
        let targetPoints = this.poleTargets.children.concat(this.controlPoints.children);
        this.selectedControlPoint = targetPoints.find(object => object.name === name);
        if(!this.selectedControlPoint) return;
        this.ragDoll.isEnabledIk = true;
        if(name === "Hips")
        {
            this.ragDoll.hipsMouseDown = true;
        }
        if(name === "Head")
        {
            this.ragDoll.applyingOffset = true;
        }
    }

    deselectControlPoint()
    {
        if(this.selectedControlPoint)
        {  
            this.ragDoll.isEnabledIk = false;
            if(this.selectedControlPoint.userData.type === "controlPoint")
            {
                this.controlPoints.attach(this.selectedControlPoint);
            }
            else
            {
                this.poleTargets.attach(this.selectedControlPoint);
            }
            if(this.selectedControlPoint.name === "Hips")
            {
                this.ragDoll.hipsMouseDown = false;
            }
            if(this.selectedControlPoint.name === "Head")
            {
                this.ragDoll.applyingOffset = false;
            }
            this.selectedControlPoint = null;
        }
    }

    updateControlPoint(controlPoint)
    {
        //console.log(controlPoint)
    }

    update()
    {
    
    }

    updateMatrixWorld(value)
    {
        super.updateMatrixWorld(value);
        this.ragDoll.update();
        if(this.selectedControlPoint)
        {
            let parent = this.selectedControlPoint.parent;
            if(this.selectedControlPoint.userData.type === "controlPoint")
            {
                this.controlPoints.attach(this.selectedControlPoint);
            }
            else
            {
                this.poleTargets.attach(this.selectedControlPoint);
            }
            this.updateInstancedTargetPoint(this.selectedControlPoint, null, false);
            parent.attach(this.selectedControlPoint);
        }
        else
        {
            this.updateAllTargetPoints();
        }
    }

    raycast(raycaster, intersects)
    {
        let values = this.controlPoints.children.concat(this.poleTargets.children);
        let results = raycaster.intersectObjects(values);
        for (let result of results)
        {
          //result.bone = this.helpingBonesRelation.find(object => object.helpingBone.id === result.object.id).originalBone;
          intersects.push(result);
        }
    }

    resetTargetPoint(targetPoint)
    {
        targetPoint.position.copy(this.defaultPosition);
        targetPoint.rotation.set(0, 0, 0);
        targetPoint.quaternion.set(0, 0, 0, 0);
        targetPoint.scale.set(0, 0, 0);
        this.updateInstancedTargetPoint(targetPoint, this.defaultColor);
    }

    updateAllTargetPoints()
    {
        for(let i = 0; i < this.targetPoints.length; i++)
        {
            this.updateInstancedTargetPoint(this.targetPoints[i]);
        }
    }

    updateInstancedTargetPoint(targetPoint, color = null, useWorld = false)
    {
        let id = targetPoint.userData.id;
        if(useWorld)
        {
            this.instancedMesh.setPositionAt( id , targetPoint.worldPosition() );
            this.instancedMesh.setQuaternionAt( id , targetPoint.worldQuaternion() );
            this.instancedMesh.setScaleAt( id , targetPoint.worldScale() );
        }
        else
        {
            this.instancedMesh.setPositionAt( id , targetPoint.position );
            this.instancedMesh.setQuaternionAt( id , targetPoint.quaternion );
            this.instancedMesh.setScaleAt( id , targetPoint.scale );
        }
        
        if(color)
        {
            this.instancedMesh.setColorAt(id, color );
            this.instancedMesh.needsUpdate("colors");
        }
        this.instancedMesh.needsUpdate("position");
        this.instancedMesh.needsUpdate("quaternion");
        this.instancedMesh.needsUpdate("scale");
    }
}

const intializeInstancedMesh = (mesh) =>
{
    let instance = IKHelper.getInstance();
    let listOfControlPoints = ["Head", "LeftHand", "RightHand", "LeftFoot", "RightFoot", "Hips"];
    let listOfControlTargets = ["leftArmPole", "rightArmPole", "leftLegPole", "rightLegPole"];
    let sizeOfTargets = listOfControlPoints.concat(listOfControlTargets).length;
    console.log(sizeOfTargets);
    let material = new THREE.MeshBasicMaterial({
        color: 0x008888,    
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 0.5,
        flatShading: true});
    instance.material = material;
    instance.instancedMesh = new THREE.InstancedMesh(mesh.geometry, material, sizeOfTargets, true, true, false);
    instance.defaultPosition = new THREE.Vector3(5000, 5000, 5000);
    instance.defaultColor = new THREE.Color().setHSL( 0.2 , 0.5 , 0.5 );
    instance.instancedMesh.userData.preventInteraction = true;
    instance.instancedMesh.userData.type = "instancedMesh";
    for(let i = 0; i < 6; i++)
    {
        let controlPoint = new THREE.Mesh(mesh.geometry, material);
        controlPoint.userData.id = --sizeOfTargets;
        console.log(sizeOfTargets);
        controlPoint.material.visible = false;
        controlPoint.userData.type = "controlPoint";
        controlPoint.name = listOfControlPoints.shift();
        instance.controlPoints.add(controlPoint);
        instance.resetTargetPoint(controlPoint);
    }
    for(let i = 0; i < 4; i++)
    {
        let poleTarget = new THREE.Mesh(mesh.geometry, material);
        poleTarget.material.visible = false;
        poleTarget.userData.id = --sizeOfTargets;
        poleTarget.userData.type = "poleTarget";
        poleTarget.name = listOfControlTargets.shift();
        instance.poleTargets.add(poleTarget);
        instance.resetTargetPoint(poleTarget);
    }
}
module.exports = IKHelper;
