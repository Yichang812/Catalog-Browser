'use strict';

angular.module('ace.catalog').factory('boxSelect', function () {
	var BROWSER_IS_NOT_SUPPORTED='Your browser is not supported';
	var CLIENT_ID_NOT_FOUND='The client id must be included';
	var INVALID_LINK_TYPE_OPTION='The link-type option must be "direct" or "shared"';
	var INVALID_MULTISELECT_OPTION='The multiselect option must be "true" or "false"';
	var POPUP_CLOSE_DETECTION_INTERVAL=1000;
	var rvalidchars=/^[\],:{}\s]*$/;
	var rvalidescape=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
	var rvalidtokens=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
	var rvalidbraces=/(?:^|:|,)(?:\s*\[)+/g;
	var button;
	var proxy;
	var popup;
	var stylesheet;
	var eventCallbacks={};
	var monitoringPopupClose=false;
	var windowConfiguration={height:520,width:590};
	var configuredOptions={clientId:'',linkType:'direct',multiselect:true,domain:'https://app.box.com',navigator:navigator};
	var booleanOptionNames=['multiselect'];

	var options = {
			clientId: 'clexwjqi1ncavj1t3xg8a9eiwqhs3zqv',
	    	linkType: 'shared',
	    	multiselect: 'false'
	};

	function indexOf(array,value){
		for(var i=0;i<array.length;i++){
			if(array[i]===value)
				{return i;}
		}
		return-1;
	}

	function validateOptions(options){
		var validationErrors=[];
		if(!options.clientId){
			validationErrors.push(CLIENT_ID_NOT_FOUND);
		}
		if(!options.linkType||!(options.linkType==='direct'||options.linkType==='shared')){
			validationErrors.push(INVALID_LINK_TYPE_OPTION);
		}
		if(options.multiselect!==undefined&&options.multiselect!==null){
			var type=typeof options.multiselect;
			if(type==='boolean'||type==='string'){
				if(type==='string'&&!(options.multiselect==='true'||options.multiselect==='false')){
					validationErrors.push(INVALID_MULTISELECT_OPTION);
				}
			}
			else{
				validationErrors.push(INVALID_MULTISELECT_OPTION);
			}
		}
		return validationErrors;
	}

	function configureOptions(options){
		for(var optionName in options){
			if(options.hasOwnProperty(optionName)&&options[optionName]!==null){
				var value=options[optionName];
				if(indexOf(booleanOptionNames,optionName)!==-1&&typeof value==='string'){
					value=(options[optionName]==='true');
				}
				configuredOptions[optionName]=value;
			}
		}
	}

	function parseOptions(button){
		var parsedOptions={
			clientId:button.getAttribute('data-client-id'),
			linkType:button.getAttribute('data-link-type'),
			multiselect:button.getAttribute('data-multiselect'),
			domain:button.getAttribute('data-domain')
		};
		var validationErrors=validateOptions(parsedOptions);
		if(validationErrors.length===0){
			configureOptions(parsedOptions);
		}
		return validationErrors;
	}

	function setOptions(options){
		options=options||{};
		var validationErrors=validateOptions(options);
		if(validationErrors.length===0){
			configureOptions(options);
		}
		return validationErrors;
	}
	
	function findButton(){
		if(button){
			return button;
		}
		button=document.getElementById('box-select');
		return button;
	}

	function createButton(){
		if(button){
			return button;
		}
		button=document.createElement('div');
		button.className='box-select';
		return button;
	}

	function launchPopupDirectly(){
		if(popup&&!popup.closed){
			return false;
		}
		var name='';
		var url=configuredOptions.domain+'/index.php?rm=box_select_view';
		url+='&client_id='+configuredOptions.clientId;
		url+='&link_type='+configuredOptions.linkType;
		url+='&multiselect='+configuredOptions.multiselect;
		var specs='height='+windowConfiguration.height+',width='+windowConfiguration.width;
		popup=window.open(url,name,specs);
		detectPopupClose();
		return true;
	}

	function launchPopupViaProxy(){
		if(proxy){
			return false;
		}
		proxy=document.createElement('iframe');
		var url=configuredOptions.domain+'/index.php?rm=box_select_proxy';
		url+='&client_id='+configuredOptions.clientId;
		url+='&link_type='+configuredOptions.linkType;
		url+='&multiselect='+configuredOptions.multiselect;
		proxy.src=url;
		proxy.height='0px';
		proxy.width='0px';
		document.body.appendChild(proxy);
		return true;
	}

	function removeProxyFrame(){
		if(proxy){
			proxy.parentNode.removeChild(proxy);
			proxy=null;
		}
	}
	
	function notifyCancelListeners(){
		if(eventCallbacks[boxSelect.CANCEL_EVENT_TYPE]){
			var listeners=eventCallbacks[boxSelect.CANCEL_EVENT_TYPE];
			for(var i=0;i<listeners.length;i++){
				listeners[i]();
			}
		}
	}

	function checkPopupClosed(){
		if(monitoringPopupClose){
			if(popup.closed){
				notifyCancelListeners();
			}else{
				detectPopupClose();
			}
		}
	}

	function detectPopupClose(){
		monitoringPopupClose=true;
		if(popup&&!popup.closed){
			window.setTimeout(checkPopupClosed,POPUP_CLOSE_DETECTION_INTERVAL);
		}
	}

	function receiveEventFromPopup(event){
		if(event.data){
			var data=parseJSON(event.data);
			if(data&&(data.eventType===boxSelect.SUCCESS_EVENT_TYPE||data.eventType===boxSelect.CANCEL_EVENT_TYPE)){
				if(eventCallbacks[data.eventType]){
					var listeners=eventCallbacks[data.eventType];
					for(var i=0;i<listeners.length;i++){
						if(data.eventType===boxSelect.SUCCESS_EVENT_TYPE){
							listeners[i](data.links);
						}
						else{
							listeners[i]();
						}
					}
				}
				boxSelect.closePopup();
				boxSelect.unregister(boxSelect.SUCCESS_EVENT_TYPE,data);
			}
		}
	}

	function subscribeToEventsFromPopup(){
		var eventMethod=window.addEventListener?'addEventListener':'attachEvent';
		var eventer=window[eventMethod];
		var messageEvent=eventMethod==='attachEvent'?'onmessage':'message';
		eventer(messageEvent,receiveEventFromPopup,false);
	}

	function unsubscribeToEventsFromPopup(){
		var eventMethod=window.addEventListener?'removeEventListener':'detachEvent';
		var eventer=window[eventMethod];var messageEvent=eventMethod==='detachEvent'?'onmessage':'message';
		eventer(messageEvent,receiveEventFromPopup,false);
	}

	function addEventCallback(eventType,callback){
		if(typeof callback==='function'){
			eventCallbacks[eventType]=eventCallbacks[eventType]||[];eventCallbacks[eventType].push(callback);
			return true;
		}
		return false;
	}

	function parseJSON(data){
		if(!data||typeof data!=='string'){
			return null;
		}
		try{
			if(window.JSON&&window.JSON.parse){
				return window.JSON.parse(data);
			}
			if(rvalidchars.test(data.replace(rvalidescape,'@').replace(rvalidtokens,']').replace(rvalidbraces,''))){
				/*jshint evil: true */
				return(new Function('return '+data))();
			}
		}
		catch(e){}
		return null;
	}
	
	function isMSIEInternetExplorer(){
		var ua=configuredOptions.navigator.userAgent;
		var msieRe=new RegExp('MSIE');
		var operaRe=new RegExp('Opera');
		return(msieRe.test(ua)&&!operaRe.test(ua));
	}

	function isTridentInternetExplorer(){
		var ua=configuredOptions.navigator.userAgent;
		var tridentRe=new RegExp('Trident');
		return tridentRe.test(ua);
	}

	function isInternetExplorer(){
		return isMSIEInternetExplorer()||isTridentInternetExplorer();
	}

	function getInternetExplorerVersion(){
		var ua=configuredOptions.navigator.userAgent;
		if(isMSIEInternetExplorer()){
			var msieRe=new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})');
			if(msieRe.exec(ua)!==null){
				return parseFloat(RegExp.$1);
			}
		} else if(isTridentInternetExplorer()){
			var rvRe=new RegExp('rv:([0-9]{1,}[\\.0-9]{0,})');
			if(rvRe.exec(ua)!==null){
				return parseFloat(RegExp.$1);
			}
		}
		return-1;
	}

	function injectStylesheet(){
		if(stylesheet){
			return;
		}
		stylesheet=document.getElementById('box-select-stylesheet');
		if(stylesheet){
			return;
		}
		stylesheet=document.createElement('style');
		stylesheet.type='text/css';stylesheet.id='box-select-stylesheet';
		var rules='';
		rules+='#box-select, .box-select { '+'width: 160px; '+'height: 42px; '+'border: none; '+'cursor: pointer; '+'background: url(\'https://app.box.com/img/box_select/Item_Selector_Button_Sprites.png\') no-repeat;'+'background-position: -50px -100px; '+'}';
		rules+='#box-select:hover, .box-select:hover { '+'background-position: -50px -50px ; '+'}';
		rules+='#box-select:active, .box-select:active { '+'background-position: -50px 0;'+'}';
		rules+='#box-select.not-supported, .box-select.not-supported { '+'zoom: 1;'+'filter: alpha(opacity=30);'+'opacity: 0.3;'+'}';
		if(stylesheet.styleSheet){
			stylesheet.styleSheet.cssText=rules;
		} else{
			stylesheet.textContent=rules;
		}
		document.getElementsByTagName('head')[0].appendChild(stylesheet);
	}

	function render(validationErrors,isBrowserSupported){
		if(validationErrors.length>0||!isBrowserSupported){
			button.disabled=true;
			button.className+=' not-supported';
			if(!isBrowserSupported){
				button.title=BROWSER_IS_NOT_SUPPORTED;
			} else{
				button.title=validationErrors[0];
			}
		}
		injectStylesheet();
		button.onclick=boxSelect.launchPopup;
	}

	function init(options){
		button=findButton();
		var validationErrors=[];
		if(button){validationErrors=parseOptions(button);
		} else{
			validationErrors=setOptions(options);
			button=createButton();
		}
		var isBrowserSupported=boxSelect.isBrowserSupported();
		render(validationErrors,isBrowserSupported);
		subscribeToEventsFromPopup();
	}
	
	var boxSelect={
		SUCCESS_EVENT_TYPE:'BoxSelect:Success',
		CANCEL_EVENT_TYPE:'BoxSelect:Cancel',
		closePopup:function(){
			if(popup){
				popup.close();
				monitoringPopupClose=false;
			}
			removeProxyFrame();
		},
		success:function(callback){
			return addEventCallback(boxSelect.SUCCESS_EVENT_TYPE,callback);
		},
		cancel:function(callback){
			return addEventCallback(boxSelect.CANCEL_EVENT_TYPE,callback);
		},
		unregister:function(eventType,callback){
			var unregistered=false;
			if(typeof callback==='function'){
				var callbacks=eventCallbacks[eventType]||[];
				eventCallbacks[eventType]=[];
				for(var i=0;i<callbacks.length;i++){
					if(callbacks[i]!==callback){
						eventCallbacks[eventType].push(callbacks[i]);
					} else{
						unregistered=true;
					}
				}
			} else{
				if(eventCallbacks[eventType]){
					eventCallbacks[eventType]=[];
					unregistered=true;
				}
			}
			return unregistered;
		},
		isBrowserSupported:function(){
			return(!isInternetExplorer()||getInternetExplorerVersion()>=8.0);
		},
		launchPopup:function(){
			if(isInternetExplorer()){return launchPopupViaProxy();
			} else{
				return launchPopupDirectly();
			}
		},
		getButton:function(){
			return button;
		},
		_destroy:function(){
			unsubscribeToEventsFromPopup();
		}
	};
	init(options);
	return boxSelect;
});