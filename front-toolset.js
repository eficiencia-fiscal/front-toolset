import Vue from 'vue/dist/vue.common.prod'
import Snackbar from 'node-snackbar'
import angular from 'angular'
import StringMask from 'string-mask'

/**
* Cria um EventBus para poder transmitir eventos entre os frameworks do front-end
* @returns {object} Retorna eventBus para poder se comunicar entre os frameworks
* @example
* import { EventBus } from '@eficiencia-fiscal/front-toolset';
* // For publish/emit one event
* EventBus.$emit('EVENT_NAME', function_to_handle);
* // For listen/subscribe one event
* EventBus.$on('EVENT_NAME', function_to_handle);
* // For cancel listen/subscribe from event
* EventBus.$off('EVENT_NAME', function_to_handle);
*/
export const EventBus = new Vue()

/**
* Função utilizada para poder instanciar component vue dinamicamente
*
* @param {object} $transitions - Diretiva do UI Router que nos dará o callback para renderizar somente quando o ciclo do angular acabar
* @param {string} component_name - Componente que será feito o download e renderizado
* @param {string} seletor - Seletor do dom onde o componente do Vue será renderizado
*/
export async function instanciaVueComponent($transitions, component_name, seletor = 'vue-lazy-load') {
  const component = await import(/* webpackChunkName: "[request]" */`@/${component_name}.vue`)

  $transitions.onSuccess({}, () => {
    new Vue({
      el: seletor,
      render: h => h(component.default)
    })
  })
}

/**
* Função para poder fazer o download de arquivos ao ser altera do History API e com isso conseguir o Code Split
*
* @param {array} arrayName - Array com os nomes dos componentes que serão adicionados dinamicamente.
*/
export function lazyLoad(arrayName) {
  return {
    load: ($transitions) => {
      var map = arrayName.map(async path => {
        if (path.match(/services\/|controllers\/|components\//g)) {
          return await import(/* webpackChunkName: "angular-[request]" */`../${path}.js`);
        }

        if (path.match(/vue\//g)) {
          return instanciaVueComponent($transitions, path);
        }

        return Promise.reject(`Unrecognized file: ${path}`);
      });

      return Promise.all(map);
    }
  };
}

/**
* Função com o objetivo de mudar a url independente do framework sendo utilizado no front-end
*
* @param {string} url - URL que deseja ir
*/
export function goToUrl(url) {
  window.location = `${window.location.origin}${url}`;
}

/**
* Função utilizada para poder salvar o valor no localStorage independente do tipo
*
* @param {string} name - Nome do parametro que será buscado no localStorage
* @param {string|object|number} value - Valor que será salvo no localStorage
*/
export function setLocalStorageItem(name, value) {
  typeof (value) === 'object' ? value = JSON.stringify(value) : null
  localStorage.setItem(name, value)
}

/**
* Função utilizada para poder salvar o valor no localStorage independente do tipo
*
* @param {string} name - Nome do parametro que será buscado no localStorage
*/
export function getLocalStorageItem(name) {
  try {
    return JSON.parse(localStorage[name])
  } catch (e) {
    return localStorage[name]
  }
}

/**
* Função utilizada para poder salvar o valor na sessionStorage independente do tipo
*
* @param {string} name - Nome do parametro que será buscado no sessionStorage
* @param {string|object|number} value - Valor que será salvo no sessionStorage
*/
export function setSessionStorageItem(name, value) {
  typeof (value) === 'object' ? value = JSON.stringify(value) : null
  sessionStorage.setItem(name, value)
}

/**
* Função utilizada para poder salvar o valor na sessionStorage independente do tipo
*
* @param {string} name - Nome do parametro que será buscado no sessionStorage
*/
export function getSessionStorageItem(name) {
  try {
    return JSON.parse(sessionStorage[name])
  } catch (e) {
    return sessionStorage[name]
  }
}

/**
* Quando se faz o deploy com Cordova ou tecnologia híbridas o protocolo de renderização em aplicativos usa o "file:"
* com isto da de identificar se está sendo renderizado em um aplicativo híbrido ou não
*
* @returns {boolean} Retorna se o aplicativo está sendo renderizado em por WebView
*/
export function isApp() {
  return window.location.protocol === 'file:'
}

/*
* Valida se a renderização atual da página está sendo feita por um dispositivo mobile
*
* @returns {boolean} Retorna se a página atual está sendo renderizada por um dispositivo mobile
*/
export function isMobile() {
  return navigator.userAgent.toLowerCase().search(/(android|avantgo|blackberry|bolt|boost|cricket|docomo|fone|hiptop|mini|mobi|palm|phone|pie|up\.browser|up\.link|webos|wos)/i) !== -1
}

/*
* Valida se a renderização atual da página está sendo feita por desktop
*
* @returns {boolean} Retorna se a pagina atual está sendo renderizada por Desktop
*/
export function isDesktop() {
  return !isMobile()
}

/**
* Função retorna um string de um novo uuid
*
* @returns {string} uuid - Retorna um uuid novo
*/
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0
    var v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
* Função utilizada criar um identificador unico da máquina
*
* @returns {string} Retorna um uuid ou se o usuário estiver logado,
* uuid mais os dados do usuário logado, para criar um identificador unico da máquina
*/
export function identifyMachine() {
  var user = window.currentUsuario
  var UUID = 'uuid'

  var uuid = localStorage.getItem(UUID)

  if (!uuid) {
    uuid = generateUUID()
    localStorage.setItem(UUID, uuid)
  }

  return uuid + (user ? (' | ' + user.id + ' | ' + user.nome + ' | ' + user.email) : '');
}

/**
* Função utilizada para enviar eventos para o Google Analytics para poder metrificar alguns eventos
*
* @param {string} name - Nome do parametro que será buscado no localStorage
*/
export function saveEventOnAnalytics(category, actions, label, value) {
  var id = identifyMachine()

  category = category || 'evento'
  actions = actions || id
  label = label || id
  value = value || 0

  if (!isApp() && window.ga) window.ga('send', 'event', category, actions, label, value)
}

/**
* Função utilizada notificar uma mensagem, ela tem a aparencia de uma Snackbar/Toast
*
* @param {string} text - Texto da mensagem
* @param {string} type - Tipo da mensagem, pode ser: success/error/info
*/
export function notify(text, type) {
  let icon
  switch (type) {
    case 'success':
      icon = '<i class="fa fa-check" aria-hidden="true" style="color: #4caf50"></i>'
      break

    case 'error':
      icon = '<i class="fa fa-times-circle" aria-hidden="true" style="color: #f44336"></i>'
      break

    case 'info':
      icon = '<i class="fa fa-exclamation-triangle" aria-hidden="true" style="color: #ffeb3b"></i>'
      break

    default:
      icon = ''
      break
  }

  Snackbar.show({ text: `${icon} ${text}`, actionText: "Fechar" });
}

/**
* Função retorna o angular scope de um DOM
*
* @param {string} seletor - Seletor do DOM que está sendo renderizado pelo o angular
* @returns {object} Retorna o $scope do angular do DOM
*/
export function returnScopeFromSeletor(seletor) {
  var dom = document.querySelector(seletor);
  return dom ? angular.element(dom).scope() : false;
}

/**
* Função utilizada para formatar as strings de CPF ou CNPJ da aplicação
*
* @param {string} CPForCNPJ - String de um CPF ou CNPJ
* @returns {string} Retorna a string formatada depedendo do tamanho dela
*/
export function formatCPForCNPJ(CPForCNPJ) {
  if (!CPForCNPJ) return

  CPForCNPJ = CPForCNPJ.replace(/\.|-|\//g, '')

  var mask

  switch (CPForCNPJ.length) {
    case 14:
      mask = '00.000.000/0000-00'
      break;

    case 11:
      mask = '000.000.000-00'
      break;

    case 8:
      mask = '00.000.000'
      break;

    case 6:
      mask = '0000-00'
      break;

    default:
      mask = ''
      break;
  }

  return StringMask.apply(CPForCNPJ, mask)
}

/**
* Função que faz o broadcast para os frameworks do front
*
* @param {string} event - O nome do evento que será feito o bradcast
* @param {string|object} payload - Informação que será trasmisita
*/
export function broadcast(event, payload) {
  EventBus.$emit(event, payload);
  const $scope = returnScopeFromSeletor('body');
  $scope.$root.$broadcast(event, payload);
}

/**
* Função que retorna um quantidade de valor formatado
*
* @param {string} value - Valor que será formatado
* @returns {string} Retorna uma string do valor formatado
*/
export function formatValueToCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { currency: 'BRL' }).format(value)
}

/**
* Função que pega uma data em formato americano e transforma para o formato do Brasil
*
* @param {date} data - Data em string
* @returns {string} Retorna a data formatada
*/
export function formatDateToBRL(date) {
  return new Date(date).toLocaleDateString()
}

/**
* Função que ao receber uma string, um float, ou integer. Retorna uma float formatado com duas casas decimais
*
* @param {string|float|integer} float_number - Valor para ter parceado em um numero com duas casas decimais
* @returns {float} Retorna o valor formatado
*/
export function formatFloat(float_number) {
  return parseFloat(parseFloat(float_number).toFixed(2))
}

/**
* Função que retorna um id unico baseado na data e hora, quase igual ao uuid, mas menor.
*
* @returns {string} Retorna um id unico
*/
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
