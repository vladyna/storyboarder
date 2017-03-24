const EventEmitter = require('events').EventEmitter

const Color = require('color-js')

const defaultPalettes = {
  'pencil':       [Color('#ff0000'), Color('#00ff00'), Color('#0000ff')],
  'light-pencil': [Color('#ff40ff'), Color('#00ff00'), Color('#0000ff')],
  'pen':          [Color('#ff7044'), Color('#00ff00'), Color('#0000ff')],
  'brush':        [Color('#ffa099'), Color('#00ff00'), Color('#0000ff')],
  'note-pen':     [Color('#ff0000'), Color('#ff69b4'), Color('#821b4e')]
}

class Toolbar extends EventEmitter {
  constructor (el) {
    super()
    this.state = {}
    this.el = el
    this.swatchTimer = null
    this.setState({
      brush: 'pencil',
      transformMode: null,
      captions: true,

      currentBrushColor: null,
      palettesByBrush: defaultPalettes,

      grid: false,
      center: false,
      thirds: false,
      diagonals: false
    })
    this.onButtonDown = this.onButtonDown.bind(this)
    this.onSwatchUp = this.onSwatchUp.bind(this)
    this.onSwatchDown = this.onSwatchDown.bind(this)
    this.attachedCallback(this.el)
  }

  setState (newState) {
    this.state = Object.assign(this.state, newState)
    this.render()
  }

  attachedCallback () {
    const immediateButtons = [...this.el.querySelectorAll('.button:not([id^="toolbar-palette-color"])')]
    const swatchButtons = [...this.el.querySelectorAll('.button[id^="toolbar-palette-color"]')]

    for (let buttonEl of immediateButtons) {
      buttonEl.addEventListener('pointerdown', this.onButtonDown)
    }

    for (let buttonEl of swatchButtons) {
      buttonEl.addEventListener('pointerup', this.onSwatchUp)
      buttonEl.addEventListener('pointerdown', this.onSwatchDown)
    }
  }

  // TODO cleanup, remove listeners
  // detachedCallback () {}

  getEventTargetSelection (target) {
    // interpret brush tool icon div clicks
    if (target.classList.contains('icon')) {
      target = target.parentNode
    }

    return target.id.replace(/^toolbar-/, '')
  }

  onButtonDown (event) {
    let selection = this.getEventTargetSelection(event.target)

    switch (selection) {
      // board operations
      case 'add':
        this.emit('add')
        break
      case 'delete':
        this.emit('delete')
        break
      case 'duplicate':
        this.emit('duplicate')
        break
      case 'import':
        this.emit('import')
        break
      case 'print':
        this.emit('print')
        break
      
      // brushes
      case 'light-pencil':
        if (this.state.brush !== 'light-pencil') {
          this.setState({ brush: 'light-pencil' })
          this.emit('light-pencil')
        }
        break
      case 'pencil':
        if (this.state.brush !== 'pencil') {
          this.setState({ brush: 'pencil' })
          this.emit('pencil')
        }
        break
      case 'pen':
        if (this.state.brush !== 'pen') {
          this.setState({ brush: 'pen' })
          this.emit('pen')
        }
        break
      case 'brush':
        if (this.state.brush !== 'brush') {
          this.setState({ brush: 'brush' })
          this.emit('brush')
        }
        break
      case 'note-pen':
        if (this.state.brush !== 'note-pen') {
          this.setState({ brush: 'note-pen' })
          this.emit('note-pen')
        }
        break
      case 'eraser':
        if (this.state.brush !== 'eraser') {
          this.setState({ brush: 'eraser' })
          this.emit('eraser')
        }
        break

      case 'trash':
        this.emit('trash')
        break
      case 'fill':
        this.emit('fill', this.state.currentBrushColor)
        break

      case 'move':
        this.state.transformMode == 'move'
          ? this.emit('cancelTransform')
          : this.emit('move')
        break
      case 'scale':
        this.state.transformMode == 'scale'
          ? this.emit('cancelTransform')
          : this.emit('scale')
        break

      // undo/redo
      case 'undo':
        this.emit('undo')
        break
      case 'redo':
        this.emit('redo')
        break

      case 'current-color':
        this.emit('current-color')
        break

      case 'brush-size':
        this.emit('brush-size')
        break

      case 'grid':
        this.setState({ grid: !this.state.grid })
        this.emit('grid', this.state.grid)
        break
      case 'center':
        this.setState({ center: !this.state.center })
        this.emit('center', this.state.center)
        break
      case 'thirds':
        this.setState({ thirds: !this.state.thirds })
        this.emit('thirds', this.state.thirds)
        break
      case 'diagonals':
        this.setState({ diagonals: !this.state.diagonals })
        this.emit('diagonals', this.state.diagonals)
        break
      case 'onion':
        this.emit('onion')
        break
      case 'captions':
        this.setState({ captions: !this.state.captions })
        this.emit('captions')
        break

      default:
        console.log('toolbar selection', selection)
        break
    }
  }

  onSwatchDown (event) {
    let selection = this.getEventTargetSelection(event.target)

    clearTimeout(this.swatchTimer)
    this.swatchTimer = setTimeout(this.onSwatchColorPicker.bind(this, selection), 2000)
  }
  
  onSwatchColorPicker (selection) {
    clearTimeout(this.swatchTimer)
    this.swatchTimer = null

    switch(selection) {
      case 'palette-colorA':
        this.emit('palette-colorA-color-picker', this.getCurrentPalette()[0])
        break
      case 'palette-colorB':
        this.emit('palette-colorB-color-picker', this.getCurrentPalette()[1])
        break
      case 'palette-colorC':
        this.emit('palette-colorC-color-picker', this.getCurrentPalette()[2])
        break
    }
  }

  onSwatchUp (event) {
    if (this.swatchTimer) {
      // timer is still running so we never showed the Color Picker
      let selection = this.getEventTargetSelection(event.target)
      switch(selection) {
        case 'palette-colorA':
          this.emit('palette-colorA', this.getCurrentPalette()[0])
          break
        case 'palette-colorB':
          this.emit('palette-colorB', this.getCurrentPalette()[1])
          break
        case 'palette-colorC':
          this.emit('palette-colorC', this.getCurrentPalette()[2])
          break
      }
    }
    clearTimeout(this.swatchTimer)
  }

  getCurrentPalette () {
    return this.state.palettesByBrush[this.state.brush]
  }

  render () {
    let brushesEls = this.el.querySelectorAll('.button[data-group=brushes]')
    for (let brushEl of brushesEls) {
      if (brushEl.id == `toolbar-${this.state.brush}`) {
        brushEl.classList.add('active')
      } else {
        brushEl.classList.remove('active')
      }
    }

    let btnMove = this.el.querySelector('#toolbar-move')
    let btnScale = this.el.querySelector('#toolbar-scale')
    switch (this.state.transformMode) {
      case 'move':
        btnMove.classList.add('active')
        btnScale.classList.remove('active')
        break
      case 'scale':
        btnScale.classList.add('active')
        btnMove.classList.remove('active')
        break
      default:
        btnScale.classList.remove('active')
        btnMove.classList.remove('active')
        break
    }
    
    let btnCaptions = this.el.querySelector('#toolbar-captions')
    if (this.state.captions) {
      btnCaptions.classList.add('active')
    } else {
      btnCaptions.classList.remove('active')
    }

    let gridEl = this.el.querySelector('#toolbar-grid')
    let centerEl = this.el.querySelector('#toolbar-center')
    let thirdsEl = this.el.querySelector('#toolbar-thirds')
    let diagonalsEl = this.el.querySelector('#toolbar-diagonals')
    gridEl.classList.toggle('active', this.state.grid)
    centerEl.classList.toggle('active', this.state.center)
    thirdsEl.classList.toggle('active', this.state.thirds)
    diagonalsEl.classList.toggle('active', this.state.diagonals)

    if (this.state.currentBrushColor) {
      this.el.querySelector('#toolbar-current-color .icon').style.backgroundColor = this.state.currentBrushColor.toCSS()

      this.el.querySelector('#toolbar-fill').style.setProperty('--color3', this.state.currentBrushColor.toCSS())
    }

    const palette = this.getCurrentPalette()

    if (palette) {
      const paletteIcons = ['A', 'B', 'C'].map(letter => this.el.querySelector(`#toolbar-palette-color${letter} .icon`))
      paletteIcons[0].style.backgroundColor = palette[0].toCSS()
      paletteIcons[1].style.backgroundColor = palette[1].toCSS()
      paletteIcons[2].style.backgroundColor = palette[2].toCSS()
    }
  }
}

module.exports = Toolbar
