import { remote } from 'electron'
const { dialog } = remote
import React, { useMemo, useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import {
  deleteObjects,
  getSceneObjects, getSelections,
  updateObject
} from '../../../../shared/reducers/shot-generator'
import ListItem from './ListItem'
import {NumberSlider} from './../../NumberSlider'
import deepEqualSelector from './../../../../utils/deepEqualSelector'
import HandSelectionModal from '../HandInspector/HandSelectionModal'

const sceneObjectSelector = (state) => {
    let sceneObjects = getSceneObjects(state)
    return Object.values(sceneObjects).filter(object => object.type === "attachable").map((object) => {
        return  {
            id:           object.id,
            bindBone:     object.bindBone,
            displayName:  object.displayName,
            size:         object.size,
          }
    })
}
const getSceneObjectsM = deepEqualSelector([sceneObjectSelector], sceneObjects => sceneObjects)

const AttachableEditor = connect(
  state => ({
    sceneObjects: getSceneObjectsM(state),
    id: getSelections(state)[0],
  }),
  {
    updateObject,
    deleteObjects,
    withState: (fn) => (dispatch, getState) => fn(dispatch, getState())
  }
)(
  React.memo(({
    sceneObjects,

    updateObject,
    deleteObjects,
    withState,

    id
  }) => {
    const [isModalVisible, showModal] = useState(false)
    const selectedId = useRef(null)
    const model = useRef(null)
    const [sceneObject, setSceneObject] = useState({})
    const [selectedBindBone, setSelectedBindBone] = useState(null)

    useEffect(() => {
       withState((dispatch, state) => {
         setSceneObject(getSceneObjects(state)[id])
       })
    }, [id])

    const onSelectItem = (id, bindBoneName) => {
      selectedId.current = id
      setSelectedBindBone(bindBoneName)
      showModal(true)
    }

    const attachables = useMemo(() => {
        let result = []
        withState((dispatch, state) => {
            let sceneObjects = getSceneObjects(state)
            let keys = Object.keys(sceneObjects)
            for(let i = 0; i < keys.length; i++) {
                let key = keys[i]
                let value = sceneObjects[key]
                if(value.attachToId === sceneObject.id)
                    result.push(value)
            }
        })
        return result
    }, [sceneObjects, sceneObject])

    const updateAttachableBone = (model, id, name) => {
      if (name == null || name == '' || name == ' ') return
      updateObject(id, { bindBone: name })
    }

    const onDelete = (attachable) => {
      let choice = dialog.showMessageBox(null, {
        type: "question",
        buttons: ["Yes", "No"],
        message: "Are you sure?",
        defaultId: 1 // default to No
      })
      if (choice === 0) {
        deleteObjects([attachable.id])
      }
    }

    const getNumberSlider = (sceneObject) => {
      return <NumberSlider 
        label="size"
        value={ sceneObject.size }   
        min={ 0.7 }
        max={ 2 }
        onSetValue={ value => {
          updateObject(
            sceneObject.id,
            { size: value }
          )}}/>
    }
    
    return (
      <div>
        <HandSelectionModal
          visible={ isModalVisible }
          model={ model.current }
          setVisible={ showModal }
          id={ selectedId.current }
          skeleton={ sceneObject.skeleton }
          onSuccess={ updateAttachableBone }
          defaultSelectedHand={ selectedBindBone }/> 
        <div className="thumbnail-search.column">
            <div className="thumbnail-search__list"> 
                <div> 
                   { attachables.map((item, index) => 
                     <ListItem
                      key={ index }
                      attachable={ item } 
                      props={{
                        onSelectItem,
                        onDelete,
                        getNumberSlider
                      }}
                     />
                   )}
                </div>
            </div>
        </div>
    </div>
    )
}))

export default AttachableEditor
