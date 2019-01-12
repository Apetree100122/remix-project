var yo = require('yo-yo')
var EventManager = require('../../lib/events')
var Card = require('../ui/card')
var css = require('./styles/run-tab-styles')

var Settings = require('./runTab/model/settings.js')
var SettingsUI = require('./runTab/settings.js')

var DropdownLogic = require('./runTab/model/dropdownlogic.js')
var ContractDropdownUI = require('./runTab/contractDropdown.js')

var Recorder = require('./runTab/model/recorder.js')
var RecorderUI = require('./runTab/recorder.js')

class RunTab {

  constructor (udapp, udappUI, config, fileManager, editor, logCallback, filePanel, pluginManager, compilersArtefacts) {
    this.event = new EventManager()

    this.renderInstanceContainer()
    this.renderSettings(udapp)
    this.renderDropdown(udappUI, fileManager, pluginManager, compilersArtefacts, config, editor, udapp, filePanel, logCallback)
    this.renderRecorder(udapp, udappUI, fileManager, config, logCallback)
    this.renderRecorderCard()
    this.renderContainer()
  }

  renderContainer () {
    this.container = yo`<div class="${css.runTabView}" id="runTabView" ></div>`

    var el = yo`
    <div>
      ${this.settingsUI.render()}
      ${this.contractDropdownUI.render()}
      ${this.recorderCard.render()}
      ${this.instanceContainer}
    </div>
    `
    this.container.appendChild(el)
  }

  renderInstanceContainer () {
    this.instanceContainer = yo`<div class="${css.instanceContainer}"></div>`

    const instanceContainerTitle = yo`
      <div class=${css.instanceContainerTitle}
        title="Autogenerated generic user interfaces for interaction with deployed contracts">
        Deployed Contracts
        <i class="${css.clearinstance} ${css.icon} fa fa-trash" onclick=${() => this.event.trigger('clearInstance', [])}
          title="Clear instances list and reset recorder" aria-hidden="true">
        </i>
      </div>`

    this.noInstancesText = yo`
      <div class="${css.noInstancesText}">
        Currently you have no contract instances to interact with.
      </div>`

    this.event.register('clearInstance', () => {
      this.instanceContainer.innerHTML = '' // clear the instances list
      this.instanceContainer.appendChild(instanceContainerTitle)
      this.instanceContainer.appendChild(this.noInstancesText)
    })

    this.instanceContainer.appendChild(instanceContainerTitle)
    this.instanceContainer.appendChild(this.noInstancesText)
  }

  renderSettings (udapp) {
    var settings = new Settings(udapp)
    this.settingsUI = new SettingsUI(settings)

    this.settingsUI.event.register('clearInstance', () => {
      this.event.trigger('clearInstance', [])
    })
  }

  renderDropdown (udappUI, fileManager, pluginManager, compilersArtefacts, config, editor, udapp, filePanel, logCallback) {
    var dropdownLogic = new DropdownLogic(fileManager, pluginManager, compilersArtefacts, config, editor, udapp, filePanel)
    this.contractDropdownUI = new ContractDropdownUI(dropdownLogic, logCallback)

    this.contractDropdownUI.event.register('clearInstance', () => {
      var noInstancesText = this.noInstancesText
      if (noInstancesText.parentNode) { noInstancesText.parentNode.removeChild(noInstancesText) }
    })
    this.contractDropdownUI.event.register('newContractABIAdded', (abi, address) => {
      this.instanceContainer.appendChild(udappUI.renderInstanceFromABI(abi, address, address))
    })
    this.contractDropdownUI.event.register('newContractInstanceAdded', (contractObject, address, value) => {
      this.instanceContainer.appendChild(udappUI.renderInstance(contractObject, address, value))
    })
  }

  renderRecorder (udapp, udappUI, fileManager, config, logCallback) {
    this.recorderCount = yo`<span>0</span>`

    var recorder = new Recorder(udapp, fileManager, config)
    recorder.event.register('recorderCountChange', (count) => {
      this.recorderCount.innerText = count
    })
    this.event.register('clearInstance', recorder.clearAll.bind(recorder))

    this.recorderInterface = new RecorderUI(recorder, logCallback)

    this.recorderInterface.event.register('newScenario', (abi, address, contractName) => {
      var noInstancesText = this.noInstancesText
      if (noInstancesText.parentNode) { noInstancesText.parentNode.removeChild(noInstancesText) }
      this.instanceContainer.appendChild(udappUI.renderInstanceFromABI(abi, address, contractName))
    })

    this.recorderInterface.render()
  }

  renderRecorderCard () {
    const collapsedView = yo`
      <div class=${css.recorderCollapsedView}>
        <div class=${css.recorderCount}>${this.recorderCount}</div>
      </div>`

    const expandedView = yo`
      <div class=${css.recorderExpandedView}>
        <div class=${css.recorderDescription}>
          All transactions (deployed contracts and function executions) in this environment can be saved and replayed in
          another environment. e.g Transactions created in Javascript VM can be replayed in the Injected Web3.
        </div>
        <div class="${css.transactionActions}">
          ${this.recorderInterface.recordButton}
          ${this.recorderInterface.runButton}
          </div>
        </div>
      </div>`

    this.recorderCard = new Card({}, {}, { title: 'Transactions recorded:', collapsedView: collapsedView })
    this.recorderCard.event.register('expandCollapseCard', (arrow, body, status) => {
      body.innerHTML = ''
      status.innerHTML = ''
      if (arrow === 'down') {
        status.appendChild(collapsedView)
        body.appendChild(expandedView)
      } else if (arrow === 'up') {
        status.appendChild(collapsedView)
      }
    })
  }

  render () {
    return this.container
  }

  profile () {
    return {
      name: 'run transactions',
      methods: [],
      events: [],
      icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMjMwNCIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMjMwNCAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yMzAxIDEwMzZxMTIgMTAzLTIyIDE5OC41dC05OSAxNjMuNS0xNTguNSAxMDYtMTk2LjUgMzFxLTE2MS0xMS0yNzkuNS0xMjV0LTEzNC41LTI3NHEtMTItMTExIDI3LjUtMjEwLjV0MTE4LjUtMTcwLjVsLTcxLTEwN3EtOTYgODAtMTUxIDE5NHQtNTUgMjQ0cTAgMjctMTguNSA0Ni41dC00NS41IDE5LjVoLTMyNXEtMjMgMTY0LTE0OSAyNzR0LTI5NCAxMTBxLTE4NSAwLTMxNi41LTEzMS41dC0xMzEuNS0zMTYuNSAxMzEuNS0zMTYuNSAzMTYuNS0xMzEuNXE3NiAwIDE1MiAyN2wyNC00NXEtMTIzLTExMC0zMDQtMTEwaC02NHEtMjYgMC00NS0xOXQtMTktNDUgMTktNDUgNDUtMTloMTI4cTc4IDAgMTQ1IDEzLjV0MTE2LjUgMzguNSA3MS41IDM5LjUgNTEgMzYuNWg2MjdsLTg1LTEyOGgtMjIycS0zMCAwLTQ5LTIyLjV0LTE0LTUyLjVxNC0yMyAyMy0zOHQ0My0xNWgyNTNxMzMgMCA1MyAyOGw3MCAxMDUgMTE0LTExNHExOS0xOSA0Ni0xOWgxMDFxMjYgMCA0NSAxOXQxOSA0NXYxMjhxMCAyNi0xOSA0NXQtNDUgMTloLTE3OWwxMTUgMTcycTEzMS02MyAyNzUtMzYgMTQzIDI2IDI0NCAxMzQuNXQxMTggMjUzLjV6bS0xODUzIDM3MnExMTUgMCAyMDMtNzIuNXQxMTEtMTgzLjVoLTMxNHEtMzUgMC01NS0zMS0xOC0zMi0xLTYzbDE0Ny0yNzdxLTQ3LTEzLTkxLTEzLTEzMiAwLTIyNiA5NHQtOTQgMjI2IDk0IDIyNiAyMjYgOTR6bTE0MDggMHExMzIgMCAyMjYtOTR0OTQtMjI2LTk0LTIyNi0yMjYtOTRxLTYwIDAtMTIxIDI0bDE3NCAyNjBxMTUgMjMgMTAgNDl0LTI3IDQwcS0xNSAxMS0zNiAxMS0zNSAwLTUzLTI5bC0xNzQtMjYwcS05MyA5NS05MyAyMjUgMCAxMzIgOTQgMjI2dDIyNiA5NHoiLz48L3N2Zz4=',
      description: 'execute and save transactions'
    }
  }
}

module.exports = RunTab
